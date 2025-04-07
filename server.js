const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key'; // Use a secret key for JWT

// SQLite database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    return console.error('Failed to connect to DB:', err);
  }
  console.log('Connected to SQLite database.');
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API: User Sign-Up
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to hash password' });

    const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
    db.run(sql, [username, hashedPassword], function(err) {
      if (err) return res.status(500).json({ success: false, error: 'Failed to register user' });

      // Respond with success message
      res.json({ success: true });
    });
  });
});

// API: User Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  const sql = `SELECT * FROM users WHERE username = ?`;
  db.get(sql, [username], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(400).json({ success: false, error: 'Invalid password' });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ success: true, token });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
