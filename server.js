const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const dbPath = './moneyard.db';
if (!fs.existsSync(dbPath)) {
    fs.closeSync(fs.openSync(dbPath, 'w'));
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error('DB Error:', err);
    console.log('Connected to SQLite:', dbPath);
});

// Tables
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

db.run(`CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user INTEGER,
    to_user INTEGER,
    amount REAL,
    date TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS stakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    plan TEXT,
    amount REAL,
    apy REAL,
    lock_period INTEGER,
    start_date TEXT,
    status TEXT DEFAULT 'active'
)`);

// Signup
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;

    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (!passwordRegex.test(password)) return res.status(400).json({ 
        error: 'Password must contain lowercase, uppercase, number, and be 5+ characters' 
    });

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (user) return res.status(400).json({ error: 'Email already in use' });

        const hashedPassword = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (email, password) VALUES (?, ?)", 
            [email, hashedPassword], 
            function(err) {
                if (err) return res.status(500).json({ error: 'Failed to register' });
                res.json({ success: true, userId: this.lastID });
            }
        );
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid email or user not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        res.json({ success: true, userId: user.id, username: user.email });
    });
});

// Deposit
app.post('/api/deposit', (req, res) => {
    const { userId, amount, network, txId } = req.body;
    if (!userId || !amount || !network || !txId) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const now = new Date().toISOString();
    db.run(`
        INSERT INTO transactions (user_id, type, amount, network, tx_id, status, date)
        VALUES (?, 'deposit', ?, ?, ?, 'confirmed', ?)`,
        [userId, amount, network, txId, now],
        function (err) {
            if (err) return res.status(500).json({ error: 'Deposit failed' });

            db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId], (err) => {
                if (err) return res.status(500).json({ error: 'Balance update failed' });
                res.json({ success: true, message: 'Deposit confirmed' });
            });
        }
    );
});

// Withdraw
app.post('/api/withdraw', (req, res) => {
    const { userId, amount, walletAddress, password } = req.body;
    if (!userId || !amount || !walletAddress || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }

    db.get("SELECT * FROM users WHERE id = ?", [userId], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found' });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(403).json({ error: 'Invalid password' });

        if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

        const date = new Date().toISOString();
        db.run("INSERT INTO withdrawals (user_id, amount, wallet_address, password, date) VALUES (?, ?, ?, ?, ?)", 
            [userId, amount, walletAddress, password, date], (err) => {
                if (err) return res.status(500).json({ error: 'Withdrawal failed' });

                db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, userId], (err) => {
                    if (err) return res.status(500).json({ error: 'Balance update failed' });
                    res.json({ success: true, message: 'Withdrawal request submitted' });
                });
            }
        );
    });
});

// Transfer
app.post('/api/transfer', (req, res) => {
    const { fromUserId, toEmail, amount, password } = req.body;
    if (!fromUserId || !toEmail || !amount || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }

    db.get("SELECT * FROM users WHERE id = ?", [fromUserId], async (err, sender) => {
        if (err || !sender) return res.status(400).json({ error: 'Sender not found' });

        const valid = await bcrypt.compare(password, sender.password);
        if (!valid) return res.status(403).json({ error: 'Invalid password' });

        if (sender.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

        db.get("SELECT * FROM users WHERE email = ?", [toEmail], (err, receiver) => {
            if (err || !receiver) return res.status(400).json({ error: 'Recipient not found' });

            const date = new Date().toISOString();

            db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, fromUserId]);
            db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, receiver.id]);

            db.run("INSERT INTO transfers (from_user, to_user, amount, date) VALUES (?, ?, ?, ?)", 
                [fromUserId, receiver.id, amount, date], (err) => {
                    if (err) return res.status(500).json({ error: 'Transfer failed' });
                    res.json({ success: true, message: 'Transfer completed' });
                }
            );
        });
    });
});

// Stake
app.post('/api/stake', (req, res) => {
    const { userId, plan, amount } = req.body;
    if (!userId || !plan || !amount) {
        return res.status(400).json({ error: 'All fields required' });
    }

    const plans = {
        "Stable Growth": 8,
        "Yield Farming": 15,
        "Liquidity Mining": 22
    };

    const apy = plans[plan];
    if (!apy) return res.status(400).json({ error: 'Invalid plan' });

    db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
        if (err || !row) return res.status(400).json({ error: 'User not found' });
        if (row.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

        const lockPeriod = 30;
        const startDate = new Date().toISOString();

        db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, userId]);
        db.run("INSERT INTO stakes (user_id, plan, amount, apy, lock_period, start_date) VALUES (?, ?, ?, ?, ?, ?)", 
            [userId, plan, amount, apy, lockPeriod, startDate], function(err) {
                if (err) return res.status(500).json({ error: 'Staking failed' });
                res.json({ success: true, message: 'Staking successful' });
            }
        );
    });
});

// View Stakes
app.get('/api/active-stakes', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    db.all("SELECT * FROM stakes WHERE user_id = ? AND status = 'active'", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to load stakes' });
        res.json(rows);
    });
});

// Unstake
app.post('/api/unstake', (req, res) => {
    const { userId, stakeId } = req.body;
    if (!userId || !stakeId) return res.status(400).json({ error: 'Missing fields' });

    db.get("SELECT * FROM stakes WHERE id = ? AND user_id = ? AND status = 'active'", [stakeId, userId], (err, stake) => {
        if (err || !stake) return res.status(400).json({ error: 'Stake not found or already unstaked' });

        db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [stake.amount, userId]);
        db.run("UPDATE stakes SET status = 'inactive' WHERE id = ?", [stakeId], (err) => {
            if (err) return res.status(500).json({ error: 'Unstake failed' });
            res.json({ success: true, message: 'Unstaked successfully' });
        });
    });
});

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
