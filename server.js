const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");  // Ensure bcryptjs is installed

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SQLite database setup
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Failed to connect to DB:", err);
    return;
  }
  console.log("Connected to SQLite database.");
});

// Create users table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        refcode TEXT,
        created_at TEXT
    )
`);

// Static page routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// SignUp API
app.post("/signup", (req, res) => {
  const { username, password, refcode } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required" });
  }

  // Hash the password before storing it
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Error hashing password" });
    }

    // Insert user into database
    db.run(
      `INSERT INTO users (username, password, refcode, created_at) VALUES (?, ?, ?, datetime("now"))`,
      [username, hashedPassword, refcode],
      function (err) {
        if (err) {
          return res.status(400).json({ success: false, error: "Username already exists" });
        }
        res.status(201).json({ success: true, message: "User registered successfully" });
      }
    );
  });
});

// Login API
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required" });
  }

  // Get user from database
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Database error" });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Compare password with hashed password
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Error comparing password" });
      }

      if (match) {
        res.status(200).json({ success: true, message: "Login successful" });
      } else {
        res.status(400).json({ success: false, error: "Incorrect password" });
      }
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
