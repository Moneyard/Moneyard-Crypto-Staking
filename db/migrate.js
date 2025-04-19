const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use Heroku's ephemeral storage or local fallback
const dbPath = process.env.DB_PATH || 
               path.join(__dirname, '../moneyard.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database at', dbPath);
});

// Execute migrations sequentially
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance REAL DEFAULT 0 CHECK(balance >= 0),
    reset_token TEXT,
    reset_token_expiry INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal')),
    amount REAL NOT NULL CHECK(amount > 0),
    network TEXT,
    tx_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'rejected')),
    date TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // Add other tables (stakes, withdrawals etc.) here...
});

db.close((err) => {
  if (err) console.error('❌ Database close error:', err.message);
  else console.log('✅ Migration completed');
});