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

// API: Get user summary (total deposit, balance, and username)
app.get('/user-summary', (req, res) => {
  const userId = req.query.userId || 1; // Default to userId 1 for now
  console.log('Fetching user summary for userId:', userId);  // Log the userId

  // Get the username and total deposit amount for the user
  db.get(
    `SELECT username FROM users WHERE id = ?`,
    [userId],
    (err, userResult) => {
      if (err) {
        console.error('Error fetching username:', err); // Log the error
        return res.status(500).json({ error: err.message });
      }

      if (!userResult) {
        return res.status(404).json({ error: 'User not found' });
      }

      const username = userResult.username; // Fetch the username

      db.get(
        `SELECT SUM(amount) AS totalDeposit FROM transactions WHERE user_id = ? AND type = "deposit"`,
        [userId],
        (err, result) => {
          if (err) {
            console.error('Error fetching total deposit:', err); // Log the error
            return res.status(500).json({ error: err.message });
          }

          const totalDeposit = result && result.totalDeposit ? result.totalDeposit : 0; // Safely handle null results
          console.log('Total deposit:', totalDeposit);  // Log the total deposit

          // Get the total withdrawn amount for the user (approved withdrawals)
          db.get(
            `SELECT SUM(amount) AS totalWithdrawn FROM withdrawals WHERE user_id = ? AND status = "approved"`,
            [userId],
            (err, withdrawalResult) => {
              if (err) {
                console.error('Error fetching total withdrawals:', err); // Log the error
                return res.status(500).json({ error: err.message });
              }

              const totalWithdrawn = withdrawalResult && withdrawalResult.totalWithdrawn ? withdrawalResult.totalWithdrawn : 0; // Safely handle null results
              console.log('Total withdrawn:', totalWithdrawn);  // Log the total withdrawn

              const balance = totalDeposit - totalWithdrawn; // Calculate balance as totalDeposit - totalWithdrawn
              console.log('User summary:', { totalDeposit, balance }); // Log the fetched summary

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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
