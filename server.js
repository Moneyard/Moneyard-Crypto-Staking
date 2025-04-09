const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) return console.error('DB connection error:', err);
    console.log('Connected to SQLite database');
});

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        amount REAL,
        network TEXT,
        tx_id TEXT,
        status TEXT DEFAULT 'pending',
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL,
        wallet_address TEXT,
        password TEXT,
        status TEXT DEFAULT 'pending',
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// API Endpoints
app.get('/user/assets-summary', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    db.serialize(() => {
        const summary = { totalDeposits: 0, earnings: 0, pendingWithdrawals: 0 };
        
        db.get(
            `SELECT SUM(amount) AS totalDeposits FROM transactions 
             WHERE user_id = ? AND type = 'deposit' AND status = 'confirmed'`,
            [userId],
            (err, depositRow) => {
                if (err) return res.status(500).json({ error: err.message });
                summary.totalDeposits = depositRow.totalDeposits || 0;

                db.get(
                    `SELECT SUM(amount * 0.08) AS earnings FROM transactions 
                     WHERE user_id = ? AND type = 'deposit' AND status = 'confirmed'`,
                    [userId],
                    (err, earningsRow) => {
                        if (err) return res.status(500).json({ error: err.message });
                        summary.earnings = earningsRow.earnings || 0;

                        db.get(
                            `SELECT SUM(amount) AS pendingWithdrawals FROM withdrawals 
                             WHERE user_id = ? AND status = 'pending'`,
                            [userId],
                            (err, withdrawalRow) => {
                                if (err) return res.status(500).json({ error: err.message });
                                summary.pendingWithdrawals = withdrawalRow.pendingWithdrawals || 0;
                                summary.totalValue = summary.totalDeposits + summary.earnings - summary.pendingWithdrawals;
                                
                                res.json(summary);
                            }
                        );
                    }
                );
            }
        );
    });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));