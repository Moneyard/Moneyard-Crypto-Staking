const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig'); // Import the SQLite DB configuration

// Sign up new user
exports.signup = async (req, res) => {
  const { email, password, referralCode } = req.body;

  try {
    // Check if the user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      db.run('INSERT INTO users (email, password, referral_code) VALUES (?, ?, ?)', [email, hashedPassword, referralCode], function (err) {
        if (err) {
          return res.status(500).json({ error: 'Signup failed' });
        }

        const newUser = { email, referralCode }; // Mocked user data
        res.status(201).json({ message: 'User created', referralCode: newUser.referralCode });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
};

// Log in an existing user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row || !(await bcrypt.compare(password, row.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate a JWT token
      const token = jwt.sign({ userId: row.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({ message: 'Login successful', token });
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};
