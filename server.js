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

// =============== INITIALIZATION ===============
const app = express();
const PORT = process.env.PORT || 3000;

// =============== ERROR HANDLING ===============
process.on('uncaughtException', (err) => {
  console.error('🛑 Critical Error:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('⚠️ Unhandled Rejection:', err);
});

// =============== MIDDLEWARE ===============
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting with Heroku support
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
  keyGenerator: (req) => req.headers['x-forwarded-for'] || req.ip
});
app.use(limiter);

// =============== DATABASE SETUP ===============
const dbPath = process.env.DB_PATH || path.join(__dirname, 'moneyard.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
  console.log('✅ Database connected at:', dbPath);
});
db.get("PRAGMA foreign_keys = ON");

// =============== STATIC FILES ===============
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
});

// =============== ROUTES ===============

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// Menu API Endpoint
app.get('/api/menu', (req, res) => {
  res.json({
    menuItems: [
      { title: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { title: 'Deposit', path: '/deposit', icon: 'payment' },
      { title: 'Staking', path: '/staking', icon: 'trending_up' },
      { title: 'Withdraw', path: '/withdraw', icon: 'account_balance' }
    ]
  });
});

// Your existing routes (keep these exactly as is)
app.post('/api/signup', async (req, res) => { /* ... */ });
app.post('/api/login', (req, res) => { /* ... */ });
app.post('/api/deposit', (req, res) => { /* ... */ });
// Include ALL your other existing routes here...

// =============== FRONTEND CATCH-ALL ===============
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============== ERROR HANDLER ===============
app.use((err, req, res, next) => {
  console.error('🚨 Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong',
    requestId: req.id 
  });
});

// =============== START SERVER ===============
const server = app.listen(PORT, () => {
  console.log(`
  ===================================
  🚀 Server running on port ${PORT}
  📅 ${new Date().toLocaleString()}
  🌐 Environment: ${process.env.NODE_ENV || 'development'}
  ===================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    db.close();
    console.log('✅ Server stopped');
    process.exit(0);
  });
});