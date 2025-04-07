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

// Create tables if they don't exist
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT,
        email TEXT
    )
`);

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

// Routes

// Static pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sign up page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// User registration
app.post('/signup', (req, res) => {
    const { username, password, email } = req.body;
    db.run(
        `INSERT INTO users (username, password, email) VALUES (?, ?, ?)`,
        [username, password, email],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'User registered successfully' });
        }
    );
});

// User login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(
        `SELECT * FROM users WHERE username = ? AND password = ?`,
        [username, password],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (row) {
                res.json({ message: 'Login successful', userId: row.id });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        }
    );
});

// Load staking plans and display them
app.get('/get-staking-plans', (req, res) => {
    const stakingPlans = [
        { id: 1, name: "Plan A", duration: "30 days", interestRate: "5%" },
        { id: 2, name: "Plan B", duration: "60 days", interestRate: "10%" },
        { id: 3, name: "Plan C", duration: "90 days", interestRate: "15%" },
    ];
    res.json({ stakingPlans });
});

// Load APY (Annual Percentage Yield)
app.get('/get-apy', (req, res) => {
    const APY = 12;  // Example APY value
    res.json({ apy: APY });
});

// Get user summary (e.g., total deposit and balance)
app.get('/user-summary', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    db.get(
        `SELECT SUM(amount) AS totalDeposit FROM transactions WHERE user_id = ? AND type = 'deposit' AND status = 'approved'`,
        [userId],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });

            const totalDeposit = row?.totalDeposit || 0;
            const balance = totalDeposit * 0.9;  // Example balance calculation
            res.json({ totalDeposit, balance });
        }
    );
});

// Transaction history for user
app.get('/get-transaction-history', (req, res) => {
    const userId = req.query.userId || 1;  // Example user ID
    db.all(
        `SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`,
        [userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ transactions: rows });
        }
    );
});

// Withdraw funds
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

// Admin - View pending withdrawals
app.get('/admin/withdrawals', (req, res) => {
    db.all("SELECT * FROM withdrawals WHERE status = 'pending'", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ withdrawals: rows });
    });
});

// Admin - Approve withdrawal
app.post('/admin/approve-withdrawal', (req, res) => {
    const { withdrawalId } = req.body;
    db.run("UPDATE withdrawals SET status = 'approved' WHERE id = ?", [withdrawalId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Withdrawal approved successfully.' });
    });
});

// Admin - Reject withdrawal
app.post('/admin/reject-withdrawal', (req, res) => {
    const { withdrawalId } = req.body;
    db.run("UPDATE withdrawals SET status = 'rejected' WHERE id = ?", [withdrawalId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Withdrawal rejected successfully.' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
