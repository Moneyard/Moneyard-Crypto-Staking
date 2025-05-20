const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const jwt = require('jsonwebtoken'); // 1. Added jwt
const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here_change_this'; // 2. Secret key

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// DB Initialization
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

db.run(`CREATE TABLE IF NOT EXISTS stakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    plan TEXT,
    amount REAL,
    apy REAL,
    lock_period INTEGER,
    start_date TIMESTAMP,
    status TEXT DEFAULT 'active',
    FOREIGN KEY(user_id) REFERENCES users(id)
)`);

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token missing' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// Signup
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;

    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            error: 'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and be at least 5 characters' 
        });
    }

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

// Login with JWT
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid email or user not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const payload = { userId: user.id, email: user.email };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            userId: user.id,
            username: user.email
        });
    });
});

// Protected profile route
app.get('/api/profile', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    db.get("SELECT id, email, balance FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    });
});

// Deposit Funds
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
                if (err) return res.status(500).json({ error: 'Failed to update balance' });

                db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
                    if (err || !row) return res.status(500).json({ error: 'Failed to retrieve updated balance' });
                    res.json({ success: true, message: 'Deposit confirmed', updatedBalance: row.balance });
                });
            });
        }
    );
});

// Remaining routes like /api/deposits, /api/withdraw, /api/withdrawals continue unchanged
