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

// API: Get pending withdrawals
app.get('/admin/withdrawals', (req, res) => {
    db.all("SELECT * FROM withdrawals WHERE status = 'pending'", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ withdrawals: rows });
    });
});

// Admin API: Approve withdrawal
app.post('/admin/approve-withdrawal', (req, res) => {
    const { withdrawalId } = req.body;

    db.run("UPDATE withdrawals SET status = 'approved' WHERE id = ?", [withdrawalId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Withdrawal approved successfully.' });
    });
});

// Admin API: Reject withdrawal
app.post('/admin/reject-withdrawal', (req, res) => {
    const { withdrawalId } = req.body;

    db.run("UPDATE withdrawals SET status = 'rejected' WHERE id = ?", [withdrawalId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Withdrawal rejected successfully.' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
