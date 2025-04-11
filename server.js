const express = require('express');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

// Initialize app and database
const app = express();
const db = new sqlite3.Database('./moneyard.db');
const secret = 'your-secret-key';  // Replace with your actual secret key

app.use(bodyParser.json());  // Parse JSON request bodies

// Example: /login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Query database for the user
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }

    if (!user) {
      return res.json({ success: false, error: 'User not found' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, error: 'Invalid password' });
    }

    // Return the userId and username along with a success flag
    res.json({
      success: true,
      userId: user.id,
      username: user.username,  // Ensure that the username is included
    });
  });
});

// Example: /user-summary endpoint
app.get('/user-summary', (req, res) => {
  const userId = req.query.userId;  // Retrieve the userId from the query parameter

  if (!userId) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }

  // Fetch user data including deposits and balance
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Example of fetching deposits and balance (adjust query as needed)
    db.get('SELECT SUM(amount) AS totalDeposit FROM deposits WHERE userId = ?', [userId], (err, depositData) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Failed to fetch deposit data' });
      }

      const totalDeposit = depositData.totalDeposit || 0;

      // Fetch the balance (this can be based on your platform's calculation)
      const balance = user.balance || 0;

      // Return the user summary with username
      res.json({
        success: true,
        username: user.username, // Include username in the response
        totalDeposit: totalDeposit,
        balance: balance,
      });
    });
  });
});

// Example: /signup endpoint (just for reference)
app.post('/signup', (req, res) => {
  const { email, password, username } = req.body;

  // Hash the password before saving it
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: 'Password hashing failed' });
    }

    // Save the user to the database
    db.run('INSERT INTO users (email, password, username) VALUES (?, ?, ?)', [email, hashedPassword, username], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Failed to sign up' });
      }

      res.json({ success: true, userId: this.lastID, username: username });
    });
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
