const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SQLite setup
const db = new sqlite3.Database(process.env.DATABASE_URL || './database.sqlite', (err) => {
    if (err) return console.error('DB Error:', err);
    console.log('Connected to SQLite.');
});

// Create necessary tables
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 0,
    reset_token TEXT,
    reset_token_expiry INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    amount REAL,
    network TEXT,
    tx_id TEXT,
    status TEXT,
    date TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    wallet_address TEXT,
    password TEXT,
    status TEXT DEFAULT 'pending',
    date TEXT
)`);
// Signup Route
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword], function(err) {
        if (err) return res.status(400).json({ error: 'User already exists or invalid data' });
        res.json({ success: true, userId: this.lastID });
    });
});

// Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid email or user not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        res.json({ success: true, userId: user.id });
    });
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',         // Change this
        pass: 'your-email-password'           // Use app password or env var
    }
});

// Password Reset - Request Link
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    const token = crypto.randomBytes(20).toString('hex');
    const expiry = Date.now() + 3600000;

    db.run(
        `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?`,
        [token, expiry, email],
        function(err) {
            if (err) return res.status(500).json({ message: "DB update error" });

            const link = `https://your-app-url.com/reset-password?token=${token}`;
            const mail = {
                from: 'your-email@gmail.com',
                to: email,
                subject: 'Reset Password',
                text: `Click to reset your password:\n\n${link}`
            };

            transporter.sendMail(mail, (error, info) => {
                if (error) return res.status(500).json({ message: "Email failed" });
                res.json({ success: true, message: "Reset link sent." });
            });
        }
    );
});

// Password Reset - Submit New Password
app.post('/api/reset-password', (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Invalid request' });

    db.get(`SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?`, [token, Date.now()], (err, user) => {
        if (err) return res.status(500).json({ message: 'DB error' });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ message: 'Hashing error' });

            db.run(`UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`, [hashedPassword, user.id], function(err) {
                if (err) return res.status(500).json({ message: 'Update error' });
                res.json({ success: true, message: 'Password reset successful.' });
            });
        });
    });
});

// Serve static pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// Deposit Wallet Addresses
const walletAddresses = {
    TRC20: "TXYZ1234567890TRONADDRESS",
    BEP20: "0x1234567890BNBADDRESS"
};

// Get Deposit Address
app.post('/get-deposit-address', (req, res) => {
    const { network } = req.body;
    if (!walletAddresses[network]) return res.status(400).json({ error: 'Invalid network' });
    res.json({ address: walletAddresses[network] });
});

// Log Deposit
app.post('/log-deposit', (req, res) => {
    const { userId, amount, network, txId } = req.body;
    if (amount < 15 || amount > 1000) return res.status(400).json({ error: 'Invalid amount range' });

    db.run(`INSERT INTO transactions (user_id, type, amount, network, tx_id, status, date) VALUES (?, "deposit", ?, ?, ?, "pending", datetime("now"))`,
        [userId, amount, network, txId],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Deposit logged.' });
        });
});

// Confirm Deposit
function updateUserBalance(userId, amount) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId], function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
}

app.post('/confirm-deposit', (req, res) => {
    const { userId, txId, amount } = req.body;

    db.run(`UPDATE transactions SET status = 'confirmed' WHERE user_id = ? AND tx_id = ?`,
        [userId, txId],
        async function(err) {
            if (err) return res.status(500).json({ error: err.message });
            try {
                await updateUserBalance(userId, amount);
                res.json({ message: 'Confirmed and balance updated' });
            } catch (error) {
                res.status(500).json({ error: 'Balance update failed' });
            }
        });
});

// Get Transaction History
app.get('/get-transaction-history', (req, res) => {
    const userId = req.query.userId || 1;

    db.all(`SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ transactions: rows });
    });
});

// Get User Summary
app.get('/user-summary', (req, res) => {
    const userId = req.query.userId;

    if (!userId) return res.status(400).json({ error: 'User ID required' });

    db.get(`SELECT SUM(amount) AS totalDeposit FROM transactions WHERE user_id = ? AND type = 'deposit'`, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB error' });

        const totalDeposit = row?.totalDeposit || 0;
        const balance = totalDeposit * 0.9;
        res.json({ totalDeposit, balance });
    });
});

// Full Assets Summary
app.get('/user/assets-summary', (req, res) => {
    const userId = req.query.userId || 1;

    db.get(`SELECT SUM(amount) as totalDeposits FROM transactions WHERE user_id = ? AND type = 'deposit' AND status = 'confirmed'`, [userId], (err, depositRow) => {
        if (err) return res.status(500).json({ error: err.message });

        db.get(`SELECT SUM(amount) as pendingWithdrawals FROM withdrawals WHERE user_id = ? AND status = 'pending'`, [userId], (err, withdrawalRow) => {
            if (err) return res.status(500).json({ error: err.message });

            const deposits = depositRow?.totalDeposits || 0;
            const earnings = deposits * 0.1;
            const pendingWithdrawals = withdrawalRow?.pendingWithdrawals || 0;
            const totalValue = deposits + earnings - pendingWithdrawals;

            res.json({ totalDeposits: deposits, earnings, pendingWithdrawals, totalValue });
        });
    });
});

// Admin Routes
app.get('/admin/withdrawals', (req, res) => {
    db.all("SELECT * FROM withdrawals WHERE status = 'pending'", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ withdrawals: rows });
    });
});

app.post('/admin/approve-withdrawal', (req, res) => {
    const { withdrawalId } = req.body;

    db.run("UPDATE withdrawals SET status = 'approved' WHERE id = ?", [withdrawalId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Withdrawal approved' });
    });
});

app.post('/admin/reject-withdrawal', (req, res) => {
    const { withdrawalId } = req.body;

    db.run("UPDATE withdrawals SET status = 'rejected' WHERE id = ?", [withdrawalId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Withdrawal rejected' });
    });
});

app.get('/admin/get-withdrawals', (req, res) => {
    db.all('SELECT * FROM transactions WHERE type = "withdrawal" ORDER BY date DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ withdrawals: rows });
    });
});

app.post('/admin/update-withdrawal', (req, res) => {
    const { id, status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    db.run('UPDATE transactions SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Withdrawal ${status}` });
    });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
