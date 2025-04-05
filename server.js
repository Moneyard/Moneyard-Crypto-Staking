const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path'); // Import path module to serve static files
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Serve static files (HTML, CSS, JS) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// SQLite setup
const db = new sqlite3.Database('./moneyard.db', (err) => {
  if (err) {
    console.error('SQLite error:', err.message);
  } else {
    console.log('Connected to the moneyard SQLite database.');
  }
});

// Example table creation for users
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  // Create balances table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS balances (
      user_id INTEGER PRIMARY KEY,
      balance REAL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

// Example route (API)
app.get('/', (req, res) => {
  res.send('Welcome to Moneyard (SQLite version)');
});

// User registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to register user' });
    }
    res.status(201).json({ message: 'User registered successfully' });
  });
});

// User login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if (err || !row) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, row.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: row.id, username: row.username }, 'your-secret-key', { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  });
});

// Deposit endpoint
app.post('/deposit', (req, res) => {
  const { userId, amount } = req.body;

  // Validate deposit amount
  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }

  // Check if user exists
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, userRow) => {
    if (err || !userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if balance record exists for user
    db.get('SELECT * FROM balances WHERE user_id = ?', [userId], (err, balanceRow) => {
      if (err) {
        return res.status(500).json({ error: 'Error checking balance' });
      }

      let newBalance = balanceRow ? balanceRow.balance + amount : amount;

      if (balanceRow) {
        // Update balance if user already has one
        db.run('UPDATE balances SET balance = ? WHERE user_id = ?', [newBalance, userId], function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update balance' });
          }
          res.status(200).json({ message: 'Deposit successful', newBalance });
        });
      } else {
        // Create balance record for new user
        db.run('INSERT INTO balances (user_id, balance) VALUES (?, ?)', [userId, amount], function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create balance record' });
          }
          res.status(200).json({ message: 'Deposit successful', newBalance: amount });
        });
      }
    });
  });
});

// Catch-all route to serve the frontend (index.html) for non-API requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
