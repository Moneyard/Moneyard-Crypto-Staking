const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// JWT secret key (use a stronger one in production)
const JWT_SECRET = 'your_secret_key';

// Connect SQLite DB
const db = new sqlite3.Database('./moneyard.db', (err) => {
    if (err) console.error("DB Error:", err);
    else console.log("Connected to SQLite DB.");
});

// Create users table with fullName
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
`);

// Signup
app.post('/api/signup', async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
        "INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)",
        [fullName, email, hashedPassword],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: 'Email already exists' });
            }

            const userId = this.lastID;
            const token = jwt.sign({ id: userId }, JWT_SECRET);
            res.json({ success: true, token, fullName });
        }
    );
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET);
        res.json({ success: true, token, fullName: user.fullName });
    });
});

// Middleware to protect routes
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Token required' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.userId = decoded.id;
        next();
    });
};

// Get current user's full name
app.get('/api/user', verifyToken, (req, res) => {
    db.get("SELECT fullName FROM users WHERE id = ?", [req.userId], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found' });
        res.json({ fullName: user.fullName });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
