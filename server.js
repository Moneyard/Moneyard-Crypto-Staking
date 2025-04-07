const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SQLite database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) return console.error('Failed to connect to DB:', err);
  console.log('Connected to SQLite database.');

  db.run(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      address TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approval_date TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `, (err) => {
    if (err) {
      console.error('Error creating withdrawals table:', err);
    } else {
      console.log('Withdrawals table is ready.');
    }
  });
});

const MIN_WITHDRAWAL = 50;
const MAX_WITHDRAWAL = 5000;

// Helper: send confirmation email
async function sendConfirmationEmail(userEmail) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your_email@gmail.com',
      pass: 'your_email_password'
    }
  });

  const mailOptions = {
    from: 'your_email@gmail.com',
    to: userEmail,
    subject: 'Withdrawal Request Confirmation',
    text: 'Please confirm your withdrawal request by clicking the link.'
  };

  await transporter.sendMail(mailOptions);
}

// Get user summary
app.get('/api/user-info', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, 'your-secret-key', (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });

    const userId = decoded.userId;

    db.get(`SELECT SUM(amount) AS totalDeposit FROM transactions WHERE user_id = ? AND type = "deposit"`, [userId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalDeposit = result?.totalDeposit || 0;

      db.get(`SELECT SUM(amount) AS totalWithdrawn FROM withdrawals WHERE user_id = ? AND status = "approved"`, [userId], (err, withdrawalResult) => {
        if (err) return res.status(500).json({ error: err.message });

        const totalWithdrawn = withdrawalResult?.totalWithdrawn || 0;
        const balance = totalDeposit - totalWithdrawn;

        db.get(`SELECT username FROM users WHERE id = ?`, [userId], (err, userResult) => {
          if (err) return res.status(500).json({ error: err.message });

          const username = userResult?.username || 'Unknown User';

          res.json({
            username,
            totalDeposit,
            balance
          });
        });
      });
    });
  });
});

// Log withdrawal request
app.post('/log-withdrawal', (req, res) => {
  const { userId, amount, address, password, otp } = req.body;

  if (amount < MIN_WITHDRAWAL || amount > MAX_WITHDRAWAL) {
    return res.status(400).json({ message: `Withdrawal must be between ${MIN_WITHDRAWAL} and ${MAX_WITHDRAWAL}` });
  }

  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ message: 'User not found' });
    }

    bcrypt.compare(password, user.password, (err, passwordMatch) => {
      if (err || !passwordMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
      }

      const verified = speakeasy.totp.verify({
        secret: user.secret,
        encoding: 'base32',
        token: otp
      });

      if (!verified) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      const sql = `INSERT INTO withdrawals (user_id, amount, address, status) VALUES (?, ?, ?, ?)`;
      db.run(sql, [userId, amount, address, 'pending'], function(err) {
        if (err) {
          console.error('Error logging withdrawal request:', err);
          return res.status(500).json({ message: 'Failed to log withdrawal request' });
        }

        sendConfirmationEmail(user.email).catch(e => console.error("Email error:", e));

        res.json({ message: 'Withdrawal request submitted successfully', withdrawalId: this.lastID });
      });
    });
  });
});

// Get withdrawal history
app.get('/get-withdrawal-history', (req, res) => {
  const userId = req.query.userId || 1;

  db.all(`SELECT * FROM withdrawals WHERE user_id = ? ORDER BY request_date DESC`, [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching withdrawal history:', err);
      return res.status(500).json({ error: 'Failed to fetch withdrawal history' });
    }
    res.json(rows);
  });
});

// Admin approves withdrawal
app.post('/approve-withdrawal', (req, res) => {
  const { withdrawalId } = req.body;

  if (!withdrawalId) {
    return res.status(400).json({ error: 'Withdrawal ID is required' });
  }

  const sql = `UPDATE withdrawals SET status = 'approved', approval_date = CURRENT_TIMESTAMP WHERE id = ?`;
  db.run(sql, [withdrawalId], function(err) {
    if (err) {
      console.error('Error approving withdrawal:', err);
      return res.status(500).json({ error: 'Failed to approve withdrawal' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    res.json({ message: 'Withdrawal approved successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
