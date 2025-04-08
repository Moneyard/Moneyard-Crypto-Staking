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

// Create users table (for balance tracking)
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        balance REAL DEFAULT 0
    )
`);

// Create transactions table
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

// API: Request withdrawal
app.post('/request-withdrawal', (req, res) => {
    const { userId, amount, walletAddress } = req.body;

    if (!userId || !amount || !walletAddress) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (amount < 10) {
        return res.status(400).json({ error: 'Minimum withdrawal is 10 USDT' });
    }

    db.get(
        `SELECT SUM(amount) as totalDeposits FROM transactions WHERE user_id = ? AND type = 'deposit'`,
        [userId],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });

            const totalDeposit = row?.totalDeposits || 0;
            const balance = totalDeposit * 0.9;

            if (amount > balance) {
                return res.status(400).json({ error: 'Insufficient balance' });
            }

            db.run(
                `INSERT INTO withdrawals (user_id, amount, wallet_address, status, date)
                 VALUES (?, ?, ?, 'pending', datetime('now'))`,
                [userId, amount, walletAddress],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });

                    db.run(
                        `INSERT INTO transactions (user_id, type, amount, network, tx_id, status, date)
                         VALUES (?, 'withdrawal', ?, '', '', 'pending', datetime('now'))`,
                        [userId, amount],
                        (err) => {
                            if (err) return res.status(500).json({ error: err.message });

                            res.json({ message: 'Withdrawal request submitted and pending approval' });
                        }
                    );
                }
            );
        }
    );
});

// API: Get transaction history
app.get('/get-transaction-history', (req, res) => {
    const userId = req.query.userId || 1;

    db.all(
        `SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`,
        [userId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ transactions: rows });
        }
    );
});

// API: Get user summary
app.get('/user-summary', (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
    }

    db.get(
        `SELECT SUM(amount) AS totalDeposit FROM transactions WHERE user_id = ? AND type = 'deposit'`,
        [userId],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            const totalDeposit = row?.totalDeposit || 0;
            const balance = totalDeposit * 0.9;

            res.json({ totalDeposit, balance });
        }
    );
});

// Admin: Get pending withdrawals
app.get('/admin/withdrawals', (req, res) => {
    db.all("SELECT * FROM withdrawals WHERE status = 'pending'", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ withdrawals: rows });
    });
});

// Admin: Approve withdrawal
app.post('/admin/approve-withdrawal', (req, res) => {
    const { withdrawalId } = req.body;

    db.run("UPDATE withdrawals SET status = 'approved' WHERE id = ?", [withdrawalId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Withdrawal approved successfully.' });
    });
});

// Admin: Reject withdrawal
app.post('/admin/reject-withdrawal', (req, res) => {
    const { withdrawalId } = req.body;

    db.run("UPDATE withdrawals SET status = 'rejected' WHERE id = ?", [withdrawalId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Withdrawal rejected successfully.' });
    });
});

// Admin: Get all withdrawals for admin dashboard
app.get('/admin/get-withdrawals', (req, res) => {
    db.all('SELECT * FROM transactions WHERE type = "withdrawal" ORDER BY date DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ withdrawals: rows });
    });
});

// Admin: Update withdrawal status manually
app.post('/admin/update-withdrawal', (req, res) => {
    const { id, status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    db.run(
        'UPDATE transactions SET status = ? WHERE id = ?',
        [status, id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: `Withdrawal ${status}` });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
