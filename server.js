const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;



// API to claim rewards (simple calculation for demo)
app.post('/claim-rewards', (req, res) => {
  const { userId } = req.body;

  db.all('SELECT * FROM stakes WHERE user_id = ?', [userId], (err, rows) => {
    if (err) return res.status(500).send(err.message);

    let totalRewards = 0;
    rows.forEach(stake => {
      totalRewards += (stake.amount * stake.apy / 100) * (stake.lock_period / 365);
    });

    res.status(200).send({ totalRewards: totalRewards.toFixed(2) });
  });
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database setup
const dbPath = process.env.DATABASE_URL || './database.sqlite';
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

db.run(`CREATE TABLE IF NOT EXISTS stakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    strategy TEXT NOT NULL,
    amount REAL NOT NULL,
    apy REAL NOT NULL,
    status TEXT DEFAULT 'active',
    startDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

// Signup
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;
    if (!passwordRegex.test(password)) return res.status(400).json({ 
        error: 'Password must contain at least 1 lowercase, 1 uppercase letter, 1 number, and be at least 5 characters long'
    });

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (user) return res.status(400).json({ error: 'Email already in use' });

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run("INSERT INTO users (email, password) VALUES (?, ?)", 
            [email, hashedPassword], 
            function(err) {
                if (err) return res.status(500).json({ error: 'Failed to register user' });
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

        res.json({ 
            success: true, 
            userId: user.id,
            username: user.email
        });
    });
});

// DeFi staking plans (for USDT)
app.get('/api/stake-plans', (req, res) => {
    const plans = [
        { strategy: 'Stable Growth', apy: 8 },
        { strategy: 'Yield Farming', apy: 15 },
        { strategy: 'Liquidity Mining', apy: 22 }
    ];
    res.json(plans);
});

// Stake USDT funds
app.post('/api/stake', (req, res) => {
    const { userId, strategy, amount } = req.body;
    const strategyAPY = {
        'Stable Growth': 8,
        'Yield Farming': 15,
        'Liquidity Mining': 22
    }[strategy];

    if (!userId || !strategy || !strategyAPY || amount < 10) {
        return res.status(400).json({ message: 'Invalid input or strategy.' });
    }

    db.run(`
        INSERT INTO stakes (userId, strategy, amount, apy)
        VALUES (?, ?, ?, ?)`,
        [userId, strategy, amount, strategyAPY],
        function (err) {
            if (err) return res.status(500).json({ message: 'Staking failed' });
            res.json({ success: true, stakeId: this.lastID });
        }
    );
});

// View user active DeFi stakes
app.get('/api/active-stakes', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });

    db.all('SELECT * FROM stakes WHERE userId = ? AND status = "active"', [userId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error loading stakes' });
        res.json(rows);
    });
});

// Unstake
app.post('/api/unstake/:id', (req, res) => {
    const stakeId = req.params.id;
    db.run('UPDATE stakes SET status = "unstaked" WHERE id = ?', [stakeId], function (err) {
        if (err) return res.status(500).json({ message: 'Unstake failed' });
        res.json({ success: true });
    });
});

// Serve frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
