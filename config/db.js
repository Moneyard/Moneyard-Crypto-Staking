const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database(process.env.DB_PATH || './moneyard.db', (err) => {
  if (err) {
    console.error('SQLite error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Ensure tables are created (users, balances) when the app starts
db.serialize(() => {
  // Create users table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  // Create balances table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS balances (
      user_id INTEGER,
      balance REAL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

module.exports = db;
