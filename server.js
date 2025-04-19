require('dotenv').config();
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// ==================== INITIALIZATION ====================
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== ERROR HANDLERS ====================
process.on('uncaughtException', (err) => {
  console.error('🔥 Critical Error:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
});

// ==================== MIDDLEWARE ====================
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting with Heroku proxy support
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  }
});
app.use(limiter);

// ==================== DATABASE SETUP ====================
const dbPath = process.env.DB_PATH || path.join(__dirname, 'moneyard.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite at', dbPath);
});
db.get("PRAGMA foreign_keys = ON");

// ==================== EMAIL SETUP ====================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: true,
  port: 587,
  secure: false
});

// ==================== ROUTES ====================
// Root route - serves frontend or API info
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    db: db.open ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV || 'development'
  });
});

// [Your existing routes here...]
// signup, login, deposit, admin endpoints etc.

// ==================== ERROR HANDLING MIDDLEWARE ====================
app.use((err, req, res, next) => {
  console.error('🚨 Route Error:', err);
  
  if (err.code === 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR') {
    return res.status(400).json({ 
      error: 'Invalid request headers',
      solution: 'Contact support'
    });
  }

  res.status(500).json({ 
    error: 'Internal server error',
    requestId: req.id
  });
});

// ==================== SERVER START ====================
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  📊 Environment: ${process.env.NODE_ENV || 'development'}
  🛡️ Trust proxy: ${process.env.TRUST_PROXY || 'false'}
  `);
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Closing server...');
  server.close(() => {
    db.close();
    console.log('✅ Server and database connections closed');
    process.exit(0);
  });
});