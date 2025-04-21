const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');

// Helper function to normalize email
const normalizeEmail = (email) => email.toLowerCase().trim();

// Sign up new user
exports.signup = async (req, res) => {
  const { email, password, referralCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    // Check if the user already exists
    db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], async (err, row) => {
      if (err) {
        console.error('Signup DB error:', err);
        return res.status(500).json({ error: 'Database error during user check' });
      }

      if (row) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user
      db.run(
        'INSERT INTO users (email, password, referral_code) VALUES (?, ?, ?)',
        [normalizedEmail, hashedPassword, referralCode || null],
        function (err) {
          if (err) {
            console.error('Signup insertion error:', err);
            return res.status(500).json({ error: 'Failed to create user' });
          }

          console.log(`User created with ID: ${this.lastID}`);
          
          // Generate token immediately after signup
          const token = jwt.sign({ userId: this.lastID }, process.env.JWT_SECRET, { expiresIn: '1h' });
          
          res.status(201).json({ 
            message: 'User created successfully',
            token,
            user: {
              email: normalizedEmail,
              referralCode: referralCode || null
            }
          });
        }
      );
    });
  } catch (err) {
    console.error('Signup process error:', err);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
};

// Log in an existing user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    // Find the user
    db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], async (err, row) => {
      if (err) {
        console.error('Login DB error:', err);
        return res.status(500).json({ error: 'Database error during login' });
      }

      if (!row) {
        console.log(`Login attempt for non-existent email: ${normalizedEmail}`);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, row.password);
      if (!passwordMatch) {
        console.log(`Failed login attempt for user: ${row.email}`);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = jwt.sign({ userId: row.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      console.log(`User logged in: ${row.email}`);
      res.json({ 
        message: 'Login successful',
        token,
        user: {
          email: row.email,
          referralCode: row.referral_code
        }
      });
    });
  } catch (err) {
    console.error('Login process error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

// Helper endpoint to verify token (optional)
exports.verifyToken = (req, res) => {
  res.json({ valid: true, user: req.user });
};