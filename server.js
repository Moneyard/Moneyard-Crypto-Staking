const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
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

// Sign-Up API: Create a new user
app.post('/signup', (req, res) => {
  const { username, password, refcode } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Check if username already exists
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      console.error('Error checking username:', err);
      return res.status(500).json({ error: 'An error occurred during sign up' });
    }

    if (row) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ error: 'Failed to hash password' });
      }

      // Insert user into the database
      const sql = 'INSERT INTO users (username, password, refcode) VALUES (?, ?, ?)';
      db.run(sql, [username, hashedPassword, refcode], function(err) {
        if (err) {
          console.error('Error inserting user:', err);
          return res.status(500).json({ error: 'An error occurred during sign up' });
        }

        res.json({ success: true, message: 'Sign up successful' });
      });
    });
  });
});

// Login API: Authenticate user
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Check if user exists
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'An error occurred during login' });
    }

    if (!row) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Compare the password
    bcrypt.compare(password, row.password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ error: 'An error occurred during login' });
      }

      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }

      // Login successful
      res.json({ success: true, message: 'Login successful' });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
