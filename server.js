const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SQLite database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) return console.error('Failed to connect to DB:', err);
  console.log('Connected to SQLite database.');
});

// Create users table (for balance tracking)
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 0
  )
`);

// Signup Route
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Please provide both username and password.' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    }

    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, hashedPassword],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Error saving user to database' });
        }
        res.json({ success: true });
      }
    );
  });
});

// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: 'User not found' });
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err || !isMatch) {
          return res.status(400).json({ error: 'Incorrect password' });
        }

        const token = jwt.sign({ userId: user.id }, 'secretkey', { expiresIn: '1h' });
        res.json({ success: true, userId: user.id, token });
      });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
