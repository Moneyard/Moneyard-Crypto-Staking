const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database(process.env.DB_PATH || './moneyard.db', (err) => {
  if (err) {
    console.error('SQLite error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

module.exports = db;
