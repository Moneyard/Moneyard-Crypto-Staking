const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// DB Initialization
const dbPath = './moneyard.db';
if (!fs.existsSync(dbPath)) {
    fs.closeSync(fs.openSync(dbPath, 'w'));
}
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error('DB Error:', err);
    console.log('Connected to SQLite:', dbPath);
});

// Tables
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

db.run(`
  CREATE TABLE IF NOT EXISTS stakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    plan TEXT,
    amount REAL,
    apy REAL,
    lock_period INTEGER,
    start_date TIMESTAMP,
    status TEXT DEFAULT 'active',
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

// Signup
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;

    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            error: 'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and be at least 5 characters' 
        });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (user) return res.status(400).json({ error: 'Email already in use' });

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run("INSERT INTO users (email, password) VALUES (?, ?)", 
            [email, hashedPassword], 
            function(err) {
                if (err) return res.status(500).json({ error: 'Failed to register user' });
                res.json({ success: true, userId: this.lastID });
            }
        );
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid email or user not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        res.json({ 
            success: true, 
            userId: user.id,
            username: user.email
        });
    });
});

// Deposit Funds
app.post('/api/deposit', (req, res) => {
    const { userId, amount, network, txId } = req.body;
    if (!userId || !amount || !network || !txId) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const now = new Date().toISOString();

    db.run(`
        INSERT INTO transactions (user_id, type, amount, network, tx_id, status, date)
        VALUES (?, 'deposit', ?, ?, ?, 'confirmed', ?)`,
        [userId, amount, network, txId, now],
        function (err) {
            if (err) return res.status(500).json({ error: 'Deposit failed' });

            db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId], (err) => {
                if (err) return res.status(500).json({ error: 'Failed to update balance' });

                // Fetch updated balance after deposit
                db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
                    if (err || !row) return res.status(500).json({ error: 'Failed to retrieve updated balance' });

                    res.json({ success: true, message: 'Deposit confirmed and balance updated', updatedBalance: row.balance });
                });
            });
        }
    );
});

// View deposit history
app.get('/api/deposits', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    db.all(`SELECT * FROM transactions WHERE user_id = ? AND type = 'deposit' ORDER BY date DESC`, 
        [userId], 
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to load deposits' });
            res.json(rows);
        }
    );
});

// Get user balance
app.get('/api/balance', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'User not found' });

        res.json({ balance: row.balance });
    });
});

// Withdraw Funds
app.post('/api/withdraw', (req, res) => {
    const { userId, amount, walletAddress, password } = req.body;
    if (!userId || !amount || !walletAddress || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    db.get("SELECT * FROM users WHERE id = ?", [userId], async (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User not found' });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ error: 'Invalid password' });

        if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

        const now = new Date().toISOString();

        db.run(`INSERT INTO withdrawals (user_id, amount, wallet_address, password, date) 
                VALUES (?, ?, ?, ?, ?)`, 
            [userId, amount, walletAddress, password, now], 
            function(err) {
                if (err) return res.status(500).json({ error: 'Withdrawal request failed' });

                db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, 
                    [amount, userId], 
                    (err) => {
                        if (err) return res.status(500).json({ error: 'Balance deduction failed' });
                        res.json({ success: true, message: 'Withdrawal request submitted' });
                    }
                );
            }
        );
    });
});

// Get withdrawal history
app.get('/api/withdrawals', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    db.all(`SELECT * FROM withdrawals WHERE user_id = ? ORDER BY date DESC`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch withdrawals' });
        res.json(rows);
    });
});

// Get stake plans
app.get('/api/stake-plans', (req, res) => {
    const plans = [
        { strategy: 'Stable Growth', apy: 8 },
        { strategy: 'Yield Farming', apy: 15 },
        { strategy: 'Liquidity Mining', apy: 22 }
    ];
    res.json(plans);
});

// Serve frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
