const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Create transactions table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        amount REAL,
        network TEXT,
        tx_id TEXT,
        status TEXT,
        date TEXT
    )
`);

// Create withdrawals table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL,
        wallet_address TEXT,
        password TEXT,
        status TEXT DEFAULT 'pending',
        date TEXT
    )
`);

// Static page routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API: User Signup
app.post('/signup', (req, res) => {
    const { username, password, refcode } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Error hashing password' });

        db.run(
            `INSERT INTO users (username, password, refcode) VALUES (?, ?, ?)`,
            [username, hashedPassword, refcode || null],
            function (err) {
                if (err) return res.status(500).json({ error: 'Error registering user' });
                res.status(201).json({ message: 'User registered successfully' });
            }
        );
    });
});

// API: User Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(404).json({ error: 'User not found' });

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Error comparing passwords' });
            if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

            // Generate a JWT token
            const token = jwt.sign({ userId: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
            res.json({ message: 'Login successful', token });
        });
    });
});

// Deposit wallet addresses (example)
const walletAddresses = {
    TRC20: "TXYZ1234567890TRONADDRESS",
    BEP20: "0x1234567890BNBADDRESS"
};

// API: Get deposit address
app.post('/get-deposit-address', (req, res) => {
    const { userId, network } = req.body;

    if (!walletAddresses[network]) {
        return res.status(400).json({ error: 'Invalid network selected' });
    }

    res.json({ address: walletAddresses[network] });
});

// API: Log deposit
app.post('/log-deposit', (req, res) => {
    const { userId, amount, network, txId } = req.body;

    if (amount < 15 || amount > 1000) {
        return res.status(400).json({ error: 'Amount must be between 15 and 1000 USDT' });
    }

    db.run(
        `INSERT INTO transactions (user_id, type, amount, network, tx_id, status, date)
         VALUES (?, "deposit", ?, ?, ?, "pending", datetime("now"))`,
        [userId, amount, network, txId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Deposit logged, pending confirmation' });
        }
    );
});

// Additional API routes as before...
// Admin APIs, transaction history, etc.

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
