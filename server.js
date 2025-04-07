const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SQLite database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) return console.error('Failed to connect to DB:', err);
    console.log('Connected to SQLite database.');
});

// Create transactions table if not exists
db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        amount REAL,
        network TEXT,
        tx_id TEXT,
        status TEXT,
        date TEXT
    )
`);

// Create withdrawals table if not exists
db.run(`
    CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL,
        wallet_address TEXT,
        password TEXT,
        status TEXT DEFAULT 'pending',
        date TEXT
    )
`);

// Static pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Deposit wallet addresses
const walletAddresses = {
    TRC20: "TJREgZTuTnvRrw5Fme4DDd6hSwCEwxQV3f",
    BEP20: "0x2837db956aba84eb2670d00aeea5c0d8a9e20a01"
};

// API: Get deposit address
app.post('/get-deposit-address', (req, res) => {
    const { userId, network } = req.body;
    if (!walletAddresses[network]) {
        return res.status(400).json({ error: 'Invalid network selected' });
    }
    res.json({ address: walletAddresses[network] });
});

// API: Log deposit
app.post('/log-deposit', (req, res) => {
    const { userId, amount, network, txId } = req.body;
    if (amount < 15 || amount > 1000) {
        return res.status(400).json({ error: 'Amount must be between 15 and 1000 USDT' });
    }
    db.run(
        `INSERT INTO transactions (user_id, type, amount, network, tx_id, status, date)
         VALUES (?, "deposit", ?, ?, ?, "pending", datetime("now"))`,
        [userId, amount, network, txId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Deposit logged, pending confirmation' });
        }
    );
});

// API: Get transaction history
app.get('/get-transaction-history', (req, res) => {
    const userId = req.query.userId || 1;
    db.all(
        `SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`,
        [userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ transactions: rows });
        }
    );
});

// API: Get user summary
app.get('/user-summary', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    db.get(
        `SELECT SUM(amount) AS totalDeposit FROM transactions WHERE user_id = ? AND type = 'deposit' AND status = 'approved'`,
        [userId],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const totalDeposit = row?.totalDeposit || 0;
            const balance = totalDeposit * 0.9;
            res.json({ totalDeposit, balance });
        }
    );
});

// API: Request withdrawal
app.post('/withdraw', (req, res) => {
    const { userId, amount, wallet_address, password } = req.body;
    if (!userId || !amount || !wallet_address || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    db.run(
        `INSERT INTO withdrawals (user_id, amount, wallet_address, password, status, date)
         VALUES (?, ?, ?, ?, 'pending', datetime('now'))`,
        [userId, amount, wallet_address, password],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Withdrawal request submitted for review' });
        }
    );
});

// ADMIN PANEL

// Admin API: Get pending withdrawals
app.get('/admin/withdrawals', (req, res) => {
    db.all("SELECT * FROM withdrawals WHERE status = 'pending'", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ withdrawals: rows });
    });
});

// Admin API: Approve withdrawal
app.post('/admin/approve-withdrawal', (req, res) => {
    const { withdrawalId } = req.body;
    db.run("UPDATE withdrawals SET status = 'approved' WHERE id = ?", [withdrawalId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Withdrawal approved successfully.' });
    });
});

// Admin API: Reject withdrawal
app.post('/admin/reject-withdrawal', (req, res) => {
    const { withdrawalId } = req.body;
    db.run("UPDATE withdrawals SET status = 'rejected' WHERE id = ?", [withdrawalId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Withdrawal rejected successfully.' });
    });
});

// Admin API: Approve deposit manually
app.post('/admin/approve-deposit', (req, res) => {
    const { transactionId } = req.body;
    db.run("UPDATE transactions SET status = 'approved' WHERE id = ?", [transactionId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deposit approved successfully.' });
    });
});

// Admin API: Reject deposit manually
app.post('/admin/reject-deposit', (req, res) => {
    const { transactionId } = req.body;
    db.run("UPDATE transactions SET status = 'rejected' WHERE id = ?", [transactionId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deposit rejected successfully.' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
