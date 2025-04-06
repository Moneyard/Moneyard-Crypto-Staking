const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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

// Create users table
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        withdraw_password TEXT
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

// Create withdrawals table
db.run(`
    CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL,
        wallet_address TEXT,
        status TEXT,
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

// API: Handle withdrawal request
app.post('/request-withdrawal', (req, res) => {
    const { userId, amount, walletAddress, password } = req.body;

    if (!userId || !amount || !walletAddress || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate withdraw password
    db.get('SELECT withdraw_password FROM users WHERE id = ?', [userId], (err, row) => {
        if (err || !row) return res.status(400).json({ error: 'User not found' });

        if (row.withdraw_password !== password) {
            return res.status(403).json({ error: 'Incorrect withdrawal password' });
        }

        // Log withdrawal request
        db.run(
            `INSERT INTO withdrawals (user_id, amount, wallet_address, status, date)
             VALUES (?, ?, ?, "pending", datetime("now"))`,
            [userId, amount, walletAddress],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Withdrawal request submitted for review' });
            }
        );
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
