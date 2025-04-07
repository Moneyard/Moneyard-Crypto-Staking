const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key'; // Change this for production

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SQLite database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) return console.error('Failed to connect to DB:', err);
  console.log('Connected to SQLite database.');
  
  // Create the users table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      ref_code TEXT
    );
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
  });

  // Create deposits table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount REAL,
      network TEXT,
      txId TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `, (err) => {
    if (err) console.error('Error creating deposits table:', err);
  });
});

// API: User Sign-Up
app.post('/signup', (req, res) => {
  const { username, password, refCode } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to hash password' });

    const sql = `INSERT INTO users (username, password, ref_code) VALUES (?, ?, ?)`;
    db.run(sql, [username, hashedPassword, refCode], function(err) {
      if (err) return res.status(500).json({ success: false, error: 'Failed to register user' });
      
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

// API: Get User Info (for user loading)
app.get('/user-info', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });

    const sql = `SELECT username FROM users WHERE id = ?`;
    db.get(sql, [decoded.id], (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'User not found' });
      res.json({ username: user.username });
    });
  });
});

// API: Get user summary (username, totalDeposit, balance)
app.get('/user-summary', (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  const sqlUser = `SELECT username FROM users WHERE id = ?`;
  const sqlDeposit = `SELECT 
                        IFNULL(SUM(amount), 0) as totalDeposit, 
                        IFNULL(SUM(amount * 1.08), 0) as balance 
                      FROM deposits WHERE user_id = ?`;

  db.get(sqlUser, [userId], (err, userRow) => {
    if (err || !userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.get(sqlDeposit, [userId], (err, depositRow) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch deposit summary' });
      }

      res.json({
        username: userRow.username,
        totalDeposit: depositRow.totalDeposit,
        balance: depositRow.balance
      });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
