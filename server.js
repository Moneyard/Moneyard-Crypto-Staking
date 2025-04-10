const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Set up the email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service (this is an example)
    auth: {
        user: 'your-email@gmail.com',  // Replace with your email
        pass: 'your-email-password'    // Replace with your email password or app password
    }
});

// Route to handle forgot password requests
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;

    // Generate a unique reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const expirationTime = Date.now() + 3600000; // Token expires in 1 hour

    // Store the token and expiration in the database (add your own user table logic)
    db.run(
        `UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE email = ?`,
        [resetToken, expirationTime, email],
        function(err) {
            if (err) return res.status(500).json({ message: "Error updating user" });

            // Send the reset email
            const resetLink = `https://your-app-url.com/reset-password?token=${resetToken}`;
            const mailOptions = {
                from: 'your-email@gmail.com',
                to: email,
                subject: 'Password Reset',
                text: `Click the link below to reset your password:\n\n${resetLink}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).json({ message: "Error sending email" });
                }
                res.json({ success: true, message: "Password reset link sent" });
            });
        }
    );
});

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SQLite database setup - Adjusted for Heroku's dynamic file system
const db = new sqlite3.Database(process.env.DATABASE_URL || './database.sqlite', (err) => {
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

// Function to update user balance after deposit confirmation
async function updateUserBalance(userId, amount) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// API: Confirm deposit and update balance
app.post('/confirm-deposit', (req, res) => {
    const { userId, txId, amount } = req.body;

    // Verify transaction (example: check transaction status or process the deposit)
    db.run(
        `UPDATE transactions SET status = 'confirmed' WHERE user_id = ? AND tx_id = ?`,
        [userId, txId],
        async function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // After confirming the transaction, update the user's balance
            try {
                await updateUserBalance(userId, amount);
                res.json({ message: 'Deposit confirmed, balance updated.' });
            } catch (error) {
                res.status(500).json({ error: 'Failed to update user balance.' });
            }
        }
    );
});

// API: Get transaction history for the logged-in user
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

// API: Get user summary (total deposits and balance)
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
            const balance = totalDeposit * 0.9; // Example calculation

            res.json({ totalDeposit, balance });
        }
    );
});

// New API: Get full assets summary for the Assets page
app.get('/user/assets-summary', (req, res) => {
    const userId = req.query.userId || 1;

    db.serialize(() => {
        // Consider only confirmed deposits
        db.get(
            `SELECT SUM(amount) as totalDeposits FROM transactions WHERE user_id = ? AND type = 'deposit' AND status = 'confirmed'`,
            [userId],
            (err, depositRow) => {
                if (err) return res.status(500).json({ error: err.message });

                db.get(
                    `SELECT SUM(amount) as pendingWithdrawals FROM withdrawals WHERE user_id = ? AND status = 'pending'`,
                    [userId],
                    (err, withdrawalRow) => {
                        if (err) return res.status(500).json({ error: err.message });

                        const deposits = depositRow?.totalDeposits || 0;
                        const earnings = deposits * 0.1; // Example: 10% earnings rate
                        const pendingWithdrawals = withdrawalRow?.pendingWithdrawals || 0;
                        const totalValue = deposits + earnings - pendingWithdrawals;

                        res.json({
                            totalDeposits: deposits,
                            earnings,
                            pendingWithdrawals,
                            totalValue
                        });
                    }
                );
            }
        );
    });
});

// Admin API: Get pending withdrawals
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

// Admin Routes
app.get('/admin/get-withdrawals', (req, res) => {
    db.all('SELECT * FROM transactions WHERE type = "withdrawal" ORDER BY date DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ withdrawals: rows });
    });
});

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
