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

  console.log('Fetching user summary for userId:', userId);  // Add logging to check the userId

  // Get the total deposit amount for the user
  db.get(
    `SELECT SUM(amount) AS totalDeposit FROM transactions WHERE user_id = ? AND type = "deposit"`,
    [userId],
    (err, result) => {
      if (err) {
        console.error('Error fetching total deposit:', err); // Log the error
        return res.status(500).json({ error: err.message });
      }

      const totalDeposit = result.totalDeposit || 0;

      // Get the total withdrawn amount for the user (approved withdrawals)
      db.get(
        `SELECT SUM(amount) AS totalWithdrawn FROM withdrawals WHERE user_id = ? AND status = "approved"`,
        [userId],
        (err, withdrawalResult) => {
          if (err) {
            console.error('Error fetching total withdrawals:', err); // Log the error
            return res.status(500).json({ error: err.message });
          }

          const totalWithdrawn = withdrawalResult.totalWithdrawn || 0;
          const balance = totalDeposit - totalWithdrawn; // Calculate balance as totalDeposit - totalWithdrawn

          console.log('User summary:', { totalDeposit, balance }); // Log the fetched summary

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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
