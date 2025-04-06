const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { GoogleAuthenticator } = require("google-authenticator");

const app = express();
app.use(express.json());

// Set up SQLite3 database
const db = new sqlite3.Database('./moneyard.db');

// Initialize tables for users and transactions
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, balance REAL, secretKey TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, userId INTEGER, type TEXT, amount REAL, date TEXT)");
});

// Register User Route
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run("INSERT INTO users (username, password, balance) VALUES (?, ?, ?)", [username, hashedPassword, 0], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ userId: this.lastID });
  });
});

// Login Route
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    const token = jwt.sign({ userId: user.id }, "secretkey", { expiresIn: "1h" });
    res.status(200).json({ token });
  });
});

// Deposit Route
app.post("/deposit", (req, res) => {
  const { userId, amount, network } = req.body;
  const validNetworks = ["TRC20", "BEP20"];
  
  if (!validNetworks.includes(network)) {
    return res.status(400).json({ message: "Invalid network" });
  }
  
  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: "Deposit successful", balance: user.balance + amount });
    });
  });
});

// Withdrawal Route
app.post("/withdraw", (req, res) => {
  const { userId, amount, password } = req.body;
  
  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    
    db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, userId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: "Withdrawal successful", balance: user.balance - amount });
    });
  });
});

// Transaction History Route
app.get("/transactions/:userId", (req, res) => {
  const { userId } = req.params;
  db.all("SELECT * FROM transactions WHERE userId = ?", [userId], (err, transactions) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ transactions });
  });
});

// Admin: Process Withdrawals (Admin Only)
app.post("/admin/process-withdrawal", (req, res) => {
  const { withdrawalId, adminPassword } = req.body;
  // Check if adminPassword is correct (you can hash and compare)
  if (adminPassword !== "admin123") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  
  db.get("SELECT * FROM transactions WHERE id = ?", [withdrawalId], (err, transaction) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    
    // Process the withdrawal here, update status, etc.
    res.status(200).json({ message: "Withdrawal processed" });
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
