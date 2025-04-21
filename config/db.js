const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database(process.env.DB_PATH || './moneyard.db', (err) => {
  if (err) {
    console.error('SQLite connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
    db.run('PRAGMA foreign_keys = ON'); // Enable foreign key constraints
  }
});

// Initialize database tables
db.serialize(() => {
  // Users table (updated to match your current schema)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      balance REAL DEFAULT 0,
      referral_code TEXT,
      reset_token TEXT,
      reset_token_expiry INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Optional: Add indexes for better performance
  db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  db.run('CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code)');
});

// Add error handling middleware
db.on('trace', (sql) => {
  console.debug('SQL:', sql);
});

db.on('profile', (sql, elapsed) => {
  console.debug(`SQL (${elapsed}ms):`, sql);
});

module.exports = db;