const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Create tables
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
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            error: 'Password must contain at least 1 lowercase, 1 uppercase letter, 1 number, and be at least 5 characters long'
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

// Login Route
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

// Serve frontend files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./moneyard.db');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Public')));

// Create tables if they don’t exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS stakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    plan TEXT,
    amount REAL,
    apy REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Signup route
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashed], function (err) {
    if (err) return res.json({ success: false, error: 'Email already exists' });
    res.json({ success: true });
  });
});

// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.json({ success: false, error: 'Invalid email' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ success: false, error: 'Wrong password' });
    res.json({ success: true, userId: user.id });
  });
});

// Stake plans (Frontend loads these)
app.get('/api/stake-plans', (req, res) => {
  const plans = [
    { name: 'Flexible', apy: 5 },
    { name: 'Locked', apy: 10 },
    { name: 'High-Yield', apy: 15 }
  ];
  res.json(plans);
});

// Stake funds
app.post('/api/stake', (req, res) => {
  const { userId, plan, amount } = req.body;
  const planAPY = {
    Flexible: 5,
    Locked: 10,
    'High-Yield': 15
  }[plan];

  if (!planAPY || amount < 10) {
    return res.json({ success: false, error: 'Invalid plan or amount' });
  }

  db.run(
    'INSERT INTO stakes (userId, plan, amount, apy) VALUES (?, ?, ?, ?)',
    [userId, plan, amount, planAPY],
    function (err) {
      if (err) return res.json({ success: false, error: 'Stake failed' });
      res.json({ success: true });
    }
  );
});

// View user stakes
app.get('/api/user-stakes', (req, res) => {
  const userId = req.query.userId;
  db.all('SELECT * FROM stakes WHERE userId = ?', [userId], (err, rows) => {
    if (err) return res.json({ success: false, error: 'Failed to load stakes' });
    res.json({ success: true, stakes: rows });
  });
});

// Unstake (delete entry)
app.post('/api/unstake', (req, res) => {
  const { stakeId, userId } = req.body;
  db.run('DELETE FROM stakes WHERE id = ? AND userId = ?', [stakeId, userId], function (err) {
    if (err) return res.json({ success: false, error: 'Unstake failed' });
    res.json({ success: true });
  });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Moneyard server running on port ${PORT}`));
