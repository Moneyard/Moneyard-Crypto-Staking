const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// SQLite setup
const db = new sqlite3.Database('./database.db');

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
    startDate TEXT,
    status TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);
});

// Signup
app.post('/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ success: false, error: 'Missing credentials' });

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.json({ success: false, error: 'Error encrypting password' });

    db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function (err) {
      if (err) return res.json({ success: false, error: 'Email already in use' });
      res.json({ success: true });
    });
  });
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) return res.json({ success: false, error: 'Invalid login' });

    bcrypt.compare(password, user.password, (err, match) => {
      if (match) {
        res.json({ success: true, userId: user.id });
      } else {
        res.json({ success: false, error: 'Invalid login' });
      }
    });
  });
});

// Stake funds
app.post('/api/stake', (req, res) => {
  const { userId, plan, amount, apy } = req.body;
  if (!userId || !plan || !amount || !apy) return res.status(400).json({ error: "Missing stake info" });

  db.run(`
    INSERT INTO stakes (userId, plan, amount, apy, startDate, status)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, plan, amount, apy, new Date().toISOString(), 'active'],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to create stake." });
      res.json({ success: true, message: "Stake created successfully." });
    }
  );
});

// Get active stakes for user
app.get('/api/stakes', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  db.all('SELECT * FROM stakes WHERE userId = ? AND status = "active"', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Error fetching stakes" });
    res.json({ success: true, stakes: rows });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
