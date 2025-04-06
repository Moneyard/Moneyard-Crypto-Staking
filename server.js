const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

// Create users table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    email TEXT,
    is_verified BOOLEAN DEFAULT 0,
    reset_token TEXT,
    reset_token_expiry TEXT
  )
`);

// Create transactions table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    amount REAL,
    network TEXT,
    tx_id TEXT,
    status TEXT,
    date TEXT
  )
`);

// Create withdrawals table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    wallet_address TEXT,
    password TEXT,
    status TEXT DEFAULT 'pending',
    date TEXT
  )
`);

// Static page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Email transport setup (use your own email details here)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Replace with your email
    pass: 'your-email-password'    // Replace with your email password
  }
});

// Register a new user
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  // Check if user already exists
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: 'Username already exists.' });

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ error: err.message });

      // Insert new user into the database
      db.run(
        'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
        [username, hashedPassword, email],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });

          // Send email verification
          const verificationToken = jwt.sign({ id: this.lastID }, 'secret', { expiresIn: '1h' });
          const verificationLink = `http://localhost:${PORT}/verify-email?token=${verificationToken}`;

          transporter.sendMail({
            to: email,
            subject: 'Verify your email',
            html: `Click <a href="${verificationLink}">here</a> to verify your email.`
          });

          res.json({ message: 'User registered successfully. Please check your email to verify your account.' });
        }
      );
    });
  });
});

// Verify email
app.get('/verify-email', (req, res) => {
  const { token } = req.query;

  jwt.verify(token, 'secret', (err, decoded) => {
    if (err) return res.status(400).json({ error: 'Invalid or expired token' });

    db.run('UPDATE users SET is_verified = 1 WHERE id = ?', [decoded.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Email verified successfully!' });
    });
  });
});

// Password reset request
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(400).json({ error: 'No user found with that email' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // Token expires in 1 hour

    db.run(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, row.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const resetLink = `http://localhost:${PORT}/reset-password?token=${resetToken}`;

        transporter.sendMail({
          to: email,
          subject: 'Password Reset',
          html: `Click <a href="${resetLink}">here</a> to reset your password.`
        });

        res.json({ message: 'Password reset link sent to your email.' });
      }
    );
  });
});

// Reset password
app.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  db.get('SELECT * FROM users WHERE reset_token = ?', [token], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(400).json({ error: 'Invalid or expired token' });

    if (new Date(row.reset_token_expiry) < new Date()) {
      return res.status(400).json({ error: 'Token has expired' });
    }

    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ error: err.message });

      db.run(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
        [hashedPassword, row.id],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Password updated successfully' });
        }
      );
    });
  });
});

// Basic staking logic (simple deposit earnings calculation)
app.post('/stake', (req, res) => {
  const { userId, amount } = req.body;

  if (amount < 15 || amount > 1000) {
    return res.status(400).json({ error: 'Amount must be between 15 and 1000 USDT' });
  }

  const dailyEarnings = amount * 0.08; // 8% daily earnings

  db.run(
    'INSERT INTO transactions (user_id, type, amount, network, tx_id, status, date) VALUES (?, "stake", ?, "TRC20", ?, "pending", datetime("now"))',
    [userId, amount, crypto.randomBytes(16).toString('hex')],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: `Staking successful. Daily earnings: ${dailyEarnings.toFixed(2)} USDT.` });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
