// server.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());

// Mock user database (replace with actual DB later)
const users = [];

// Register Route
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  // Hash password before saving
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create new user
  const newUser = { username, email, password: hashedPassword };

  // Save user to database (mocked here)
  users.push(newUser);

  // Return success message
  res.status(200).json({ message: 'User registered successfully!' });
});

// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Check if the user exists
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ error: 'User not found!' });
  }

  // Check if the password is correct
  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ error: 'Invalid password!' });
  }

  // Generate JWT token for the user
  const token = jwt.sign({ username: user.username }, 'your-secret-key', { expiresIn: '1h' });
  
  res.status(200).json({ token });
});

// Forgot Password Route
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  // Handle password reset (you can integrate with an email service here)
  res.status(200).json({ message: 'Password reset instructions sent!' });
});

// Stake Route (Dummy Example)
app.post('/stake', (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid staking amount' });
  }

  res.status(200).json({ message: `Successfully staked ${amount} tokens!` });
});

// Start server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
