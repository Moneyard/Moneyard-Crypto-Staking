const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// SQLite setup
const db = new sqlite3.Database('./moneyard.db', (err) => {
  if (err) {
    console.error('SQLite error:', err.message);
  } else {
    console.log('Connected to the moneyard SQLite database.');
  }
});

// Example table creation
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);
});

// Example route
app.get('/', (req, res) => {
  res.send('Welcome to Moneyard (SQLite version)');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
