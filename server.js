const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== MIDDLEWARE ======
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from Public directory
app.use(express.static(path.join(__dirname, 'Public'), {
  extensions: ['html', 'htm'] // Auto-add .html extension
}));

// ====== DATABASE CONNECTION ======
let db;
try {
  const dbPath = path.join(__dirname, 'moneyard.db');
  if (!fs.existsSync(dbPath)) {
    fs.closeSync(fs.openSync(dbPath, 'w'));
  }
  db = new sqlite3.Database(dbPath);
  console.log('Database connected successfully');
} catch (dbError) {
  console.error('Database connection failed:', dbError);
  process.exit(1); // Exit if DB connection fails
}

// ====== ROUTES ======

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Serve index.html for all routes that don't match API or static files
app.get(['/', '/dashboard', '/login', '/signup', '/stake', '/withdraw', '/deposit'], (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'Public', 'index.html'));
  } catch (err) {
    console.error('Error serving index.html:', err);
    res.status(500).send('Internal Server Error');
  }
});

// ====== API ROUTES ======
// (Keep all your existing API routes but wrap them in try-catch blocks)

// Example of a protected API route with error handling
app.get('/api/user', (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    db.get("SELECT id, email, balance FROM users WHERE id = ?", [userId], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(row);
    });
  } catch (err) {
    console.error('Error in /api/user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ====== ERROR HANDLING ======
// 404 Handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    availableEndpoints: [
      '/api/signup',
      '/api/login',
      '/api/deposit',
      '/api/balance',
      '/api/stake-plans',
      '/api/stake',
      '/api/stakes'
    ]
  });
});

// General error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Final catch-all route
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'Public', '404.html'));
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the app at http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});