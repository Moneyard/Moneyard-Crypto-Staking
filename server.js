const express = require("express");
const app = express();
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

app.use(cors());
app.use(express.json());
app.use(express.static("Public"));

const db = new sqlite3.Database("moneyard.db");

// JWT Secret
const SECRET = "moneyard_secret_key";

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com", // Replace
    pass: "your_app_password",    // Use app password
  },
});

// Create users table with extra fields
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT,
  reference_code TEXT,
  verified INTEGER DEFAULT 0,
  reset_token TEXT,
  reset_expires INTEGER
)`);

// Sign Up API with email verification
app.post("/signup", async (req, res) => {
  const { email, password, referenceCode } = req.body;
  const hashedPassword = await bcrypt.hash(password, 12);
  const token = jwt.sign({ email }, SECRET, { expiresIn: "1d" });

  db.run(
    "INSERT INTO users (email, password, reference_code) VALUES (?, ?, ?)",
    [email, hashedPassword, referenceCode],
    (err) => {
      if (err) return res.status(400).json({ error: "Email already exists" });

      const verifyLink = `http://localhost:3000/verify?token=${token}`;
      transporter.sendMail({
        to: email,
        subject: "Verify Your Moneyard Email",
        html: `<p>Please verify your email: <a href="${verifyLink}">Click here</a></p>`,
      });

      res.json({ message: "Signup successful, please check your email to verify." });
    }
  );
});

// Email verification endpoint
app.get("/verify", (req, res) => {
  const { token } = req.query;
  try {
    const { email } = jwt.verify(token, SECRET);
    db.run("UPDATE users SET verified = 1 WHERE email = ?", [email]);
    res.send("Email verified successfully!");
  } catch {
    res.send("Invalid or expired token.");
  }
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: "Invalid email" });
    if (!user.verified) return res.status(403).json({ error: "Please verify your email" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: "1h" });
    res.json({ token });
  });
});

// Forgot Password
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  const token = jwt.sign({ email }, SECRET, { expiresIn: "15m" });

  db.run("UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?",
    [token, Date.now() + 15 * 60 * 1000, email]);

  transporter.sendMail({
    to: email,
    subject: "Moneyard Password Reset",
    html: `<p>Click to reset your password: <a href="http://localhost:3000/reset-password?token=${token}">Reset</a></p>`,
  });

  res.json({ message: "Password reset email sent" });
});

// Reset Password
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const { email } = jwt.verify(token, SECRET);
    const hashed = await bcrypt.hash(newPassword, 12);

    db.run("UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE email = ? AND reset_token = ?",
      [hashed, email, token], function (err) {
        if (err || this.changes === 0) return res.status(400).json({ error: "Reset failed" });
        res.json({ message: "Password reset successful" });
      });
  } catch {
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

// Daily staking reward logic (simplified endpoint)
app.post("/calculate-reward", (req, res) => {
  const { amount } = req.body;
  const dailyRate = 0.01; // 1% daily return
  const reward = amount * dailyRate;
  res.json({ reward });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
