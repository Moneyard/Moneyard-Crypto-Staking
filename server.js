const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./moneyard.db', (err) => {
  if (err) {
    console.error('SQLite error:', err.message);
  } else {
    console.log('Connected to the moneyard SQLite database.');
  }
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS balances (
      user_id INTEGER PRIMARY KEY,
      balance REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      amount REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to register user' });

    const userId = this.lastID;
    db.run('INSERT INTO balances (user_id) VALUES (?)', [userId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to initialize balance' });
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, 'your-secret-key', { expiresIn: '1h' });
    res.json({ token });
  });
});

// Deposit
app.post('/deposit', (req, res) => {
  const { token, amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid deposit amount' });

  jwt.verify(token, 'your-secret-key', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });

    const userId = decoded.id;
    db.serialize(() => {
      db.run('UPDATE balances SET balance = balance + ? WHERE user_id = ?', [amount, userId]);
      db.run('INSERT INTO transactions (user_id, type, amount) VALUES (?, ?, ?)', [userId, 'deposit', amount]);
      res.json({ message: 'Deposit successful' });
    });
  });
});

// Get Transaction History
app.post('/transactions', (req, res) => {
  const { token } = req.body;
  jwt.verify(token, 'your-secret-key', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });

    const userId = decoded.id;
    db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC', [userId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch transactions' });
      res.json({ transactions: rows });
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
