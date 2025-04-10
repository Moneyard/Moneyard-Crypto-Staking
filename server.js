const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ensure database file exists (for SQLite on Heroku)
const dbPath = process.env.DATABASE_URL || './database.sqlite';
if (!fs.existsSync(dbPath)) {
    fs.closeSync(fs.openSync(dbPath, 'w'));
}

// SQLite setup
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error('DB Error:', err);
    console.log('Connected to SQLite:', dbPath);
});

// Create necessary tables
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 0,
    reset_token TEXT,
    reset_token_expiry INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    amount REAL,
    network TEXT,
    tx_id TEXT,
    status TEXT,
    date TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    wallet_address TEXT,
    password TEXT,
    status TEXT DEFAULT 'pending',
    date TEXT
)`);

// API Routes with `/api` prefix
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (user) return res.status(400).json({ error: 'Email already in use' });

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to register user' });
            res.json({ success: true, userId: this.lastID });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid email or user not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        res.json({ success: true, userId: user.id });
    });
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',         // Change this
        pass: 'your-email-password'           // Use app password or env var
    }
});

// Password Reset Routes
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    const token = crypto.randomBytes(20).toString('hex');
    const expiry = Date.now() + 3600000;

    db.run(
        `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?`,
        [token, expiry, email],
        function(err) {
            if (err) return res.status(500).json({ message: "DB update error" });

            const link = `https://your-app-url.com/reset-password?token=${token}`;
            const mail = {
                from: 'your-email@gmail.com',
                to: email,
                subject: 'Reset Password',
                text: `Click to reset your password:\n\n${link}`
            };

            transporter.sendMail(mail, (error, info) => {
                if (error) return res.status(500).json({ message: "Email failed" });
                res.json({ success: true, message: "Reset link sent." });
            });
        }
    );
});

app.post('/api/reset-password', (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Invalid request' });

    db.get(`SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?`, [token, Date.now()], (err, user) => {
        if (err) return res.status(500).json({ message: 'DB error' });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ message: 'Hashing error' });

            db.run(`UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`, [hashedPassword, user.id], function(err) {
                if (err) return res.status(500).json({ message: 'Update error' });
                res.json({ success: true, message: 'Password reset successful.' });
            });
        });
    });
});

// Static Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// More Routes...
// ...

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
