// server.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();

// Middleware
app.use(bodyParser.json());

// SQLite database setup
const db = new sqlite3.Database('./moneyard.db');

// Register Route
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  // Hash password before saving
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create new user in the database
  const query = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
  db.run(query, [username, hashedPassword, email], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to register user' });
    }
    res.status(200).json({ message: 'User registered successfully!' });
  });
});

// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Fetch user from database
  const query = 'SELECT * FROM users WHERE username = ?';
  db.get(query, [username], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check if password is correct
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign({ username: user.username }, 'secret-key', { expiresIn: '1h' });
    res.status(200).json({ token });
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
