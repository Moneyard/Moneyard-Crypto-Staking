const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('Public'));

const db = new sqlite3.Database('./moneyard.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      reference TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount REAL,
      method TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount REAL,
      status TEXT DEFAULT 'pending',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

app.post('/api/signup', async (req, res) => {
  const { email, password, reference } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.run(
    `INSERT INTO users (email, password, reference) VALUES (?, ?, ?)`,
    [email, hashed, reference || null],
    function (err) {
      if (err) return res.status(400).json({ error: 'User exists or error occurred' });
      res.json({ message: 'Signup successful' });
    }
  );
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, 'secret');
    res.json({ token });
  });
});

app.post('/api/deposit', (req, res) => {
  const { token, amount, method } = req.body;
  if (!token) return res.status(401).json({ error: 'No token' });

  let userId;
  try {
    userId = jwt.verify(token, 'secret').id;
  } catch (e) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  db.run(
    `INSERT INTO deposits (user_id, amount, method) VALUES (?, ?, ?)`,
    [userId, amount, method],
    function (err) {
      if (err) return res.status(400).json({ error: 'Deposit error' });
      res.json({ message: 'Deposit successful' });
    }
  );
});

app.post('/api/withdraw', (req, res) => {
  const { token, amount } = req.body;
  if (!token) return res.status(401).json({ error: 'No token' });

  let userId;
  try {
    userId = jwt.verify(token, 'secret').id;
  } catch (e) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  db.run(
    `INSERT INTO withdrawals (user_id, amount) VALUES (?, ?)`,
    [userId, amount],
    function (err) {
      if (err) return res.status(400).json({ error: 'Withdraw error' });
      res.json({ message: 'Withdrawal request submitted' });
    }
  );
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
