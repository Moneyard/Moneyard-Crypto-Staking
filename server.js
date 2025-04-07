const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
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

    // Create the withdrawals table if it doesn't exist
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

// API: Get user summary (total deposit and balance)
app.get('/api/user-info', (req, res) => {
  const token = req.headers['authorization']; // Get the token from the headers
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, 'your-secret-key', (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });

    const userId = decoded.userId; // Get userId from the decoded token

    // Get the total deposit amount for the user
    db.get(
      `SELECT SUM(amount) AS totalDeposit FROM transactions WHERE user_id = ? AND type = "deposit"`,
      [userId],
      (err, result) => {
        if (err) {
          console.error('Error fetching total deposit:', err);
          return res.status(500).json({ error: err.message });
        }

        const totalDeposit = result && result.totalDeposit ? result.totalDeposit : 0;

        // Get the total withdrawn amount for the user (approved withdrawals)
        db.get(
          `SELECT SUM(amount) AS totalWithdrawn FROM withdrawals WHERE user_id = ? AND status = "approved"`,
          [userId],
          (err, withdrawalResult) => {
            if (err) {
              console.error('Error fetching total withdrawals:', err);
              return res.status(500).json({ error: err.message });
            }

            const totalWithdrawn = withdrawalResult && withdrawalResult.totalWithdrawn ? withdrawalResult.totalWithdrawn : 0;

            const balance = totalDeposit - totalWithdrawn; // Calculate balance as totalDeposit - totalWithdrawn

            // Get the username from the users table
            db.get(
              `SELECT username FROM users WHERE id = ?`,
              [userId],
              (err, userResult) => {
                if (err) {
                  console.error('Error fetching username:', err);
                  return res.status(500).json({ error: err.message });
                }

                const username = userResult && userResult.username ? userResult.username : 'Unknown User';

                // Return user summary with username, total deposit, and balance
                res.json({
                  username,
                  totalDeposit,
                  balance
                });
              }
            );
          }
        );
      }
    );
  });
});

// API: Get deposit address for selected network
app.post('/get-deposit-address', (req, res) => {
  const { userId, network } = req.body;

  // Simulate getting deposit address based on the network (TRC20/BEP20)
  const depositAddress = network === 'TRC20' ? 'TXXXXXXX' : network === 'BEP20' ? 'BXXXXXXX' : '';

  if (!depositAddress) {
    return res.status(400).json({ error: "Invalid network selected." });
  }

  // In real cases, you would fetch or generate an actual address from the database
  res.json({ address: depositAddress });
});

// API: Log withdrawal request
app.post('/log-withdrawal', (req, res) => {
  const { userId, amount, address, password } = req.body;

  // Validate inputs
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }
  if (!address) {
    return res.status(400).json({ error: 'Withdrawal address is required' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required for withdrawal' });
  }

  // Insert withdrawal request into the withdrawals table
  const sql = `INSERT INTO withdrawals (user_id, amount, address, status) VALUES (?, ?, ?, ?)`;
  db.run(sql, [userId, amount, address, 'pending'], function(err) {
    if (err) {
      console.error('Error logging withdrawal request:', err);
      return res.status(500).json({ error: 'Failed to log withdrawal request' });
    }
    res.json({ message: 'Withdrawal request submitted successfully', withdrawalId: this.lastID });
  });
});

// API: Get transaction history for the user
app.get('/get-transaction-history', (req, res) => {
  const userId = req.query.userId || 1;

  // Simulate fetching transaction history from the database
  db.all(
    `SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch transaction history' });
      }
      res.json(rows); // Send back the transaction history
    }
  );
});

// API: Get withdrawal history for the user
app.get('/get-withdrawal-history', (req, res) => {
  const userId = req.query.userId || 1; // Default to userId 1 for now

  // Get withdrawal history from the withdrawals table
  db.all(
    `SELECT * FROM withdrawals WHERE user_id = ? ORDER BY request_date DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching withdrawal history:', err);
        return res.status(500).json({ error: 'Failed to fetch withdrawal history' });
      }
      res.json(rows); // Send back the withdrawal history
    }
  );
});

// API: Admin approves withdrawal
app.post('/approve-withdrawal', (req, res) => {
  const { withdrawalId } = req.body;

  if (!withdrawalId) {
    return res.status(400).json({ error: 'Withdrawal ID is required' });
  }

  // Update the status of the withdrawal to 'approved'
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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
