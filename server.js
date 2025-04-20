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

// ====== FILE SERVING FIX ======
const publicPath = path.join(__dirname, 'Public');

// Verify Public directory exists
if (!fs.existsSync(publicPath)) {
  console.error(`ERROR: Missing Public directory at ${publicPath}`);
  console.log('Creating Public directory with default files...');
  
  try {
    fs.mkdirSync(publicPath);
    
    // Create essential default files
    fs.writeFileSync(path.join(publicPath, 'index.html'), `
      <!DOCTYPE html>
      <html>
      <head><title>Moneyard</title></head>
      <body>
        <h1>Moneyard App</h1>
        <p>Backend is running</p>
      </body>
      </html>
    `);
    
    fs.writeFileSync(path.join(publicPath, 'dashboard.html'), `
      <!DOCTYPE html>
      <html>
      <head><title>Dashboard</title></head>
      <body>
        <h1>Dashboard</h1>
        <p>Backend is running</p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Failed to create Public directory:', err);
  }
}

// Serve static files with proper error handling
app.use(express.static(publicPath, {
  fallthrough: true // Allows us to handle missing files
}));

// ====== DATABASE SETUP ======
const dbPath = path.join(__dirname, 'moneyard.db');
if (!fs.existsSync(dbPath)) fs.closeSync(fs.openSync(dbPath, 'w'));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('Database connection error:', err);
  console.log('Connected to SQLite database at', dbPath);
});

// ====== CREATE TABLES ======
db.serialize(() => {
  // Your original table creation code
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 0,
    reset_token TEXT,
    reset_token_expiry INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    amount REAL,
    network TEXT,
    tx_id TEXT,
    status TEXT,
    date TEXT
  )`);

  // ... include ALL your other table creations ...
  // (Keep all your original table creation queries here)
});

// ====== ROUTES ======
// Frontend routes
app.get(['/', '/dashboard', '/login', '/signup', '/stake', '/withdraw', '/deposit'], (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend files not found');
  }
});

// ====== API ROUTES ======
// Keep ALL your original API routes exactly as you had them:
app.post('/api/signup', async (req, res) => {
  // ... your original signup code ...
});

app.post('/api/login', (req, res) => {
  // ... your original login code ...
});

// ... include ALL your other API routes ...
// (Keep all your original route handlers)

// ====== ERROR HANDLING ======
// 404 for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// General error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

// Frontend 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) res.status(404).send('Page not found');
  });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Public files served from: ${publicPath}`);
  console.log(`Database file: ${dbPath}`);
  console.log(`Access app at: http://localhost:${PORT}`);
});