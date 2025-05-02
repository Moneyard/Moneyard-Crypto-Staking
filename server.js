const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cron = require('node-cron');
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

// =================== TABLES ===================
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
    status TEXT DEFAULT 'pending',
    date TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS emergency (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE,
    balance REAL DEFAULT 0
)`);

db.run(`CREATE TABLE IF NOT EXISTS stakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    plan TEXT,
    amount REAL,
    apy REAL,
    lock_period INTEGER,
    start_date TIMESTAMP,
    status TEXT DEFAULT 'active'
)`);

// =============== AUTH MIDDLEWARE ===============
function auth(req, res, next) {
    const token = req.headers.authorization;
    if (!token) return res.sendStatus(401);
    jwt.verify(token, 'secret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// =============== EMERGENCY BALANCE ROUTES ===============
app.get('/api/emergency/balance', auth, (req, res) => {
    db.get("SELECT balance FROM emergency WHERE user_id = ?", [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.json({ balance: row ? row.balance : 0 });
    });
});

app.post('/api/emergency/deposit', auth, (req, res) => {
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    db.run(`
        INSERT INTO emergency (user_id, balance) VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET balance = balance + excluded.balance
    `, [req.user.id, amount], err => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json({ message: "Deposit successful" });
    });
});

app.post('/api/emergency/withdraw', auth, (req, res) => {
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount < 1) return res.status(400).json({ message: "Minimum withdrawal is $1" });

    db.get("SELECT balance FROM emergency WHERE user_id = ?", [req.user.id], (err, row) => {
        if (err || !row) return res.status(400).json({ message: "Account not found or DB error" });
        if (row.balance < amount) return res.status(400).json({ message: "Insufficient funds" });

        db.run("UPDATE emergency SET balance = balance - ? WHERE user_id = ?", [amount, req.user.id], err2 => {
            if (err2) return res.status(500).json({ message: "DB error" });
            res.json({ message: "Withdrawal successful" });
        });
    });
});

// =============== DAILY INTEREST (0.1%) ===============
cron.schedule('0 0 * * *', () => {
    const rate = 0.001;
    db.all("SELECT user_id, balance FROM emergency", (err, rows) => {
        if (err || !rows) return;
        rows.forEach(row => {
            const interest = row.balance * rate;
            db.run("UPDATE emergency SET balance = balance + ? WHERE user_id = ?", [interest, row.user_id]);
        });
    });
});

// =============== USER SIGNUP ===============
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (!passwordRegex.test(password)) return res.status(400).json({ error: 'Weak password' });

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (user) return res.status(400).json({ error: 'Email already in use' });

        const hashed = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashed], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to register' });
            const token = jwt.sign({ id: this.lastID }, 'secret');
            res.json({ success: true, token });
        });
    });
});

// =============== USER LOGIN ===============
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid email or password' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id }, 'secret');
        res.json({ success: true, token });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
