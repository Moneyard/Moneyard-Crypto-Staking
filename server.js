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
  if (err) console.error(err.message);
  else console.log('Connected to the moneyard SQLite database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS balances (
    user_id INTEGER PRIMARY KEY,
    balance REAL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed], function(err) {
    if (err) return res.status(500).json({ error: 'Registration failed' });
    const userId = this.lastID;
    db.run('INSERT INTO balances (user_id) VALUES (?)', [userId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to initialize balance' });
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if (err || !row) return res.status(400).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, row.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: row.id, username: row.username }, 'your-secret-key', { expiresIn: '1h' });
    res.json({ token });
  });
});

app.post('/deposit', (req, res) => {
  const { token, amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid deposit amount' });

  jwt.verify(token, 'your-secret-key', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    const userId = decoded.id;
    db.run('UPDATE balances SET balance = balance + ? WHERE user_id = ?', [amount, userId], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update balance' });
      res.json({ message: 'Deposit successful' });
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
