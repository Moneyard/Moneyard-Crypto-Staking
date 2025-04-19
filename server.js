const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ==================== INITIALIZATION ====================
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== ERROR HANDLERS ====================
process.on('uncaughtException', (err) => {
  console.error('🔥 Critical Error:', err);
  // Graceful shutdown
  server.close(() => process.exit(1));
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
});

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// ==================== DATABASE SETUP ====================
const dbPath = process.env.DB_PATH || './moneyard.db';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite at', dbPath);
});

// Enable foreign key constraints
db.get("PRAGMA foreign_keys = ON");

// ==================== EMAIL TRANSPORTER ====================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: true,
  port: 587,
  secure: false,
  tls: { rejectUnauthorized: false }
});

// ==================== ROUTES ====================
// [Your existing routes remain unchanged...]
// Signup, Login, Deposit, Withdrawal, Stake routes go here

// ==================== SERVER START ====================
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
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