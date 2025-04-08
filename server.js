const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_secret_here';

// Enhanced middleware configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-heroku-app-name.herokuapp.com' 
    : 'http://localhost:5500',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Heroku-compatible database setup
let db;
if (process.env.DATABASE_URL) {
  db = new sqlite3.Database(process.env.DATABASE_URL);
} else {
  db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
      console.error('Database connection error:', err);
      process.exit(1);
    }
    console.log('Connected to local SQLite database');
    initializeDatabase();
  });
}

function initializeDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      refcode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      network TEXT,
      tx_id TEXT UNIQUE,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `, (err) => {
    if (err) console.error('Database initialization error:', err);
  });
}

// Enhanced auth middleware with error handling
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authorization token required' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Enhanced Signup Endpoint with transaction safety
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password, refcode } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check existing users first
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT username, email FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      const conflicts = [];
      if (existingUser.username === username) conflicts.push('username');
      if (existingUser.email === email) conflicts.push('email');
      return res.status(409).json({ 
        error: `Conflict found: ${conflicts.join(', ')} already exists`
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, email, password, refcode) 
         VALUES (?, ?, ?, ?)`,
        [username, email, hashedPassword, refcode],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    const token = jwt.sign(
      { userId: newUser.lastID, username }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      message: 'Registration successful',
      token,
      user: { id: newUser.lastID, username, email }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: error.message.includes('UNIQUE') 
        ? 'Username or email already exists' 
        : 'Registration failed' 
    });
  }
});

// Enhanced Login Endpoint with rate limiting potential
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Production configuration
if (process.env.NODE_ENV === 'production') {
  // HTTPS enforcement
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });

  // Static assets and SPA handling
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});