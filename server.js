const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'Public')));
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./moneyard.db', (err) => {
  if (err) return console.error('DB Connection Error:', err);
  console.log('Connected to SQLite database.');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      refcode TEXT
    )
  `);
});

// Signup route
app.post('/api/signup', async (req, res) => {
  const { username, email, password, refcode } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (username, email, password, refcode) VALUES (?, ?, ?, ?)`,
      [username, email, hashedPassword, refcode || ''],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists.' });
          }
          console.error('Signup Error:', err.message);
          return res.status(500).json({ error: 'Server error during signup.' });
        }

        return res.status(201).json({ message: 'User registered successfully!' });
      }
    );
  } catch (error) {
    console.error('Signup Error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Login route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password.' });

    return res.json({ message: 'Login successful', userId: user.id });
  });
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
