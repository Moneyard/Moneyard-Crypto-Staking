const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());

// SQLite DB Setup
const dbPath = './moneyard.db';
if (!fs.existsSync(dbPath)) fs.closeSync(fs.openSync(dbPath, 'w'));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('SQLite connection failed:', err.message);
  console.log('Connected to SQLite at', dbPath);
});

// Create Tables
db.serialize(() => {
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

  db.run(`CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    lesson_id TEXT,
    progress INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    last_updated TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// ========== ROUTES ==========

// (Signup, Login, Deposit, Balance, Staking, Lesson Progress - already handled)

// ---------- ADMIN ROUTES ----------

// View all users
app.get('/api/admin/users', (req, res) => {
  db.all("SELECT id, email, balance FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    res.json(rows);
  });
});

// View all deposits
app.get('/api/admin/deposits', (req, res) => {
  db.all("SELECT * FROM transactions WHERE type = 'deposit' ORDER BY date DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch deposits' });
    res.json(rows);
  });
});

// View all withdrawals
app.get('/api/admin/withdrawals', (req, res) => {
  db.all("SELECT * FROM withdrawals ORDER BY date DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch withdrawals' });
    res.json(rows);
  });
});

// Approve a withdrawal
app.post('/api/admin/approve-withdrawal', (req, res) => {
  const { withdrawalId } = req.body;
  if (!withdrawalId) return res.status(400).json({ error: 'Missing withdrawalId' });

  db.run("UPDATE withdrawals SET status = 'approved' WHERE id = ?", [withdrawalId], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to approve withdrawal' });
    res.json({ success: true, message: 'Withdrawal approved' });
  });
});

// Reject a withdrawal
app.post('/api/admin/reject-withdrawal', (req, res) => {
  const { withdrawalId } = req.body;
  if (!withdrawalId) return res.status(400).json({ error: 'Missing withdrawalId' });

  db.run("UPDATE withdrawals SET status = 'rejected' WHERE id = ?", [withdrawalId], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to reject withdrawal' });
    res.json({ success: true, message: 'Withdrawal rejected' });
  });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
