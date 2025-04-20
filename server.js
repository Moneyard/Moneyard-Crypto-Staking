const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.static(path.join(__dirname, 'Public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());

// ====== ROOT ROUTE ======
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// ====== DASHBOARD ROUTE ======
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'dashboard.html'));
});

// ====== DATABASE SETUP ======
const dbPath = './moneyard.db';
if (!fs.existsSync(dbPath)) fs.closeSync(fs.openSync(dbPath, 'w'));
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('SQLite connection failed:', err.message);
  console.log('Connected to SQLite at', dbPath);
});

// ====== CREATE TABLES ======
db.serialize(() => {
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

  db.run(`CREATE TABLE IF NOT EXISTS deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    network TEXT,
    tx_id TEXT,
    status TEXT DEFAULT 'pending',
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

  db.run(`CREATE TABLE IF NOT EXISTS stakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    plan TEXT,
    amount REAL,
    apy REAL,
    lock_period INTEGER,
    start_date TIMESTAMP,
    status TEXT DEFAULT 'active',
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    lesson_id TEXT,
    progress INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    last_updated TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// ====== USER ROUTES ======

app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;

  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (!passwordRegex.test(password)) return res.status(400).json({
    error: 'Password must contain lowercase, uppercase, number, and be 5+ characters'
  });

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (user) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword], function (err) {
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

    res.json({ success: true, userId: user.id, username: user.email });
  });
});

app.post('/api/deposit', (req, res) => {
  const { userId, amount, network, txId } = req.body;
  if (!userId || !amount || !network || !txId) return res.status(400).json({ error: 'All fields required' });

  const now = new Date().toISOString();
  db.run(`INSERT INTO deposits (user_id, amount, network, tx_id, status, date)
          VALUES (?, ?, ?, ?, 'pending', ?)`,
    [userId, amount, network, txId, now],
    function (err) {
      if (err) return res.status(500).json({ error: 'Deposit failed' });
      res.json({ success: true, message: 'Deposit submitted for approval' });
    });
});

app.get('/api/deposits', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  db.all(`SELECT * FROM deposits WHERE user_id = ? ORDER BY date DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load deposits' });
    res.json(rows);
  });
});

app.get('/api/balance', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ balance: row.balance });
  });
});

app.get('/api/stake-plans', (req, res) => {
  res.json([
    { strategy: 'Stable Growth', apy: 8 },
    { strategy: 'Yield Farming', apy: 15 },
    { strategy: 'Liquidity Mining', apy: 22 }
  ]);
});

app.post('/api/stake', (req, res) => {
  const { userId, amount, plan, lockPeriod } = req.body;
  const plans = {
    'Stable Growth': 8,
    'Yield Farming': 15,
    'Liquidity Mining': 22
  };
  const apy = plans[plan];
  if (!userId || !amount || !plan || !lockPeriod || !apy) return res.status(400).json({ error: 'Invalid data' });

  const now = new Date().toISOString();
  db.run(`INSERT INTO stakes (user_id, plan, amount, apy, lock_period, start_date)
          VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, plan, amount, apy, lockPeriod, now],
    function (err) {
      if (err) return res.status(500).json({ error: 'Staking failed' });
      db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, userId], (err) => {
        if (err) return res.status(500).json({ error: 'Balance update failed' });
        res.json({ success: true, message: 'Staked successfully' });
      });
    });
});

app.get('/api/stakes', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  db.all(`SELECT * FROM stakes WHERE user_id = ? AND status = 'active' ORDER BY start_date DESC`,
    [userId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to load stakes' });
      res.json(rows);
    });
});

app.post('/api/unstake', (req, res) => {
  const { stakeId } = req.body;
  if (!stakeId) return res.status(400).json({ error: 'Missing stakeId' });

  db.run("UPDATE stakes SET status = 'completed' WHERE id = ?", [stakeId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to unstake' });
    res.json({ success: true, message: 'Unstaked successfully' });
  });
});

// ====== ADMIN ROUTES ======

app.get('/api/admin/users', (req, res) => {
  db.all("SELECT id, email, balance FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    res.json(rows);
  });
});

app.get('/admin/deposits/pending', (req, res) => {
  db.all(`SELECT * FROM deposits WHERE status = 'pending'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch pending deposits' });
    res.json({ pendingDeposits: rows });
  });
});

app.get('/admin/deposits/processed', (req, res) => {
  db.all(`SELECT * FROM deposits WHERE status IN ('approved', 'rejected')`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch processed deposits' });
    res.json({ processedDeposits: rows });
  });
});

// ====== ADMIN WITHDRAWAL APPROVAL ======
app.post('/admin/withdrawals/approve/:id', (req, res) => {
  const withdrawalId = req.params.id;

  db.get("SELECT * FROM withdrawals WHERE id = ?", [withdrawalId], (err, withdrawal) => {
    if (err || !withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

    db.run("UPDATE withdrawals SET status = 'approved' WHERE id = ?", [withdrawalId], function (err) {
      if (err) return res.status(500).json({ error: 'Approval failed' });
      res.json({ success: true, message: 'Withdrawal approved' });
    });
  });
});

app.post('/admin/withdrawals/reject/:id', (req, res) => {
  const withdrawalId = req.params.id;

  db.get("SELECT * FROM withdrawals WHERE id = ?", [withdrawalId], (err, withdrawal) => {
    if (err || !withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

    db.run("UPDATE withdrawals SET status = 'rejected' WHERE id = ?", [withdrawalId], function (err) {
      if (err) return res.status(500).json({ error: 'Rejection failed' });

      // Refund balance
      db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [withdrawal.amount, withdrawal.user_id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to refund user balance' });
        res.json({ success: true, message: 'Withdrawal rejected and balance refunded' });
      });
    });
  });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
