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
app.use(express.static(path.join(__dirname, 'Public')));

// ====== ROUTES ======

// Handle all routes by serving index.html and let frontend router handle it
app.get(['/', '/dashboard', '/login', '/signup', '/stake', '/withdraw', '/deposit'], (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// API routes remain the same as before...

// ====== DATABASE SETUP ======
const dbPath = './moneyard.db';
if (!fs.existsSync(dbPath)) fs.closeSync(fs.openSync(dbPath, 'w'));
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('SQLite connection failed:', err.message);
  console.log('Connected to SQLite at', dbPath);
});

// ====== CREATE TABLES ======
// ... (keep all your existing database table creation code)

// ====== USER ROUTES ======
// ... (keep all your existing API routes)

// ====== ERROR HANDLING ======
// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Handle 404 for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Handle 404 for all other routes by redirecting to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the app at http://localhost:${PORT}`);
});