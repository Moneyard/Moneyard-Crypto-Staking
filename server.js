const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with a secure key

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SQLite database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) return console.error('Failed to connect to DB:', err);
    console.log('Connected to SQLite database.');
});

// Create users table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        refcode TEXT
    )
`);

// Static page routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API: Sign Up
app.post('/signup', (req, res) => {
    const { username, password, refcode } = req.body;

    // Hash the password before saving
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Failed to hash password' });

        // Save user to the database
        db.run(
            `INSERT INTO users (username, password, refcode) VALUES (?, ?, ?)`,
            [username, hashedPassword, refcode],
            function (err) {
                if (err) return res.status(500).json({ error: 'Failed to sign up user' });
                res.json({ message: 'Sign up successful' });
            }
        );
    });
});

// API: Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Fetch user from the database
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(400).json({ error: 'User not found' });

        // Compare the hashed password
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) return res.status(500).json({ error: 'Failed to compare password' });
            if (!result) return res.status(400).json({ error: 'Invalid password' });

            // Generate JWT token
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

            // Send response with token
            res.json({ message: 'Login successful', token });
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
