const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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

// API: Get user summary (total deposit and balance)
app.get('/user-summary', (req, res) => {
  const userId = req.query.userId || 1; // Default to userId 1 for now
  console.log('Fetching user summary for userId:', userId);

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
      console.log('Total deposit:', totalDeposit);

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
          console.log('Total withdrawn:', totalWithdrawn);

          const balance = totalDeposit - totalWithdrawn;
          console.log('User summary:', { totalDeposit, balance });

          // Return user summary with total deposit and balance
          res.json({
            totalDeposit,
            balance
          });
        }
      );
    }
  );
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

  // Simulate withdrawal logging
  console.log(`User ${userId} is requesting withdrawal: ${amount} USDT to ${address}`);

  // Here you'd save the withdrawal request to the database for admin approval, etc.
  // For simplicity, let's assume it's successful.
  
  res.json({ message: 'Withdrawal request submitted successfully' });
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

// API: Log deposit (for testing deposit functionality)
app.post('/log-deposit', (req, res) => {
  const { userId, amount, network, txId } = req.body;

  // Validate inputs
  if (!amount || amount < 15 || amount > 1000) {
    return res.status(400).json({ error: 'Invalid deposit amount. Must be between 15 and 1000 USDT' });
  }

  if (!txId) {
    return res.status(400).json({ error: 'Transaction ID is required' });
  }

  // Log deposit into the database (simulate for now)
  db.run(
    `INSERT INTO transactions (user_id, amount, type, network, tx_id) VALUES (?, ?, "deposit", ?, ?)`,
    [userId, amount, network, txId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to log deposit' });
      }
      res.json({ message: 'Deposit logged successfully' });
    }
  );
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
