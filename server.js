const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('Public'));

// Database setup
const db = new sqlite3.Database('./moneyard.db');

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    amount REAL,
    network TEXT,
    txId TEXT,
    date TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    amount REAL,
    address TEXT,
    status TEXT DEFAULT 'Pending',
    request_date TEXT
  )`);
});

// Signup
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);

  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashed], function (err) {
    if (err) return res.status(400).json({ error: 'Username taken.' });
    res.json({ message: 'Signup successful', userId: this.lastID });
  });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, 'secret');
    res.json({ message: 'Login successful', token, userId: user.id });
  });
});

// Log deposit
app.post('/log-deposit', (req, res) => {
  const { userId, amount, network, txId } = req.body;
  const date = new Date().toISOString();

  db.run(`INSERT INTO deposits (userId, amount, network, txId, date) VALUES (?, ?, ?, ?, ?)`,
    [userId, amount, network, txId, date],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to log deposit' });
      res.json({ message: 'Deposit logged successfully' });
    }
  );
});

// Get user summary
app.get('/user-summary', (req, res) => {
  const userId = req.query.userId;

  db.get(`SELECT SUM(amount) as totalDeposit FROM deposits WHERE userId = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error fetching summary' });

    const total = row.totalDeposit || 0;
    const balance = total + total * 0.08; // Sample logic for daily earnings

    res.json({ totalDeposit: total, balance });
  });
});

// Log withdrawal
app.post('/log-withdrawal', (req, res) => {
  const { userId, amount, address, password } = req.body;

  db.get(`SELECT password FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Password incorrect' });
    }

    const date = new Date().toISOString();

    db.run(`INSERT INTO withdrawals (userId, amount, address, request_date) VALUES (?, ?, ?, ?)`,
      [userId, amount, address, date],
      function (err) {
        if (err) return res.status(500).json({ error: 'Withdrawal failed' });
        res.json({ message: 'Withdrawal request submitted' });
      }
    );
  });
});

// Get withdrawal history
app.get('/get-withdrawal-history', (req, res) => {
  const userId = req.query.userId;

  db.all(`SELECT * FROM withdrawals WHERE userId = ? ORDER BY id DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error loading history' });
    res.json(rows);
  });
});

// Admin: Approve withdrawal
app.post('/approve-withdrawal', (req, res) => {
  const { id } = req.body;

  db.run(`UPDATE withdrawals SET status = 'Approved' WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to approve' });
    res.json({ message: 'Withdrawal approved' });
  });
});

// Admin: Reject withdrawal
app.post('/reject-withdrawal', (req, res) => {
  const { id } = req.body;

  db.run(`UPDATE withdrawals SET status = 'Rejected' WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to reject' });
    res.json({ message: 'Withdrawal rejected' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Moneyard server running on port ${PORT}`);
});
