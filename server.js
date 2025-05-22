require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// --- Signup ---
app.post('/api/signup', async (req, res) => {
  const { email, password, refCode } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Missing email or password' });

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, password_hash, referral_code) VALUES ($1, $2, $3)',
      [email, hashedPassword, refCode || null]
    );

    res.json({ success: true, message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

// --- Login ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Missing email or password' });

  try {
    const userRes = await pool.query('SELECT id, password_hash FROM users WHERE email=$1', [email]);
    if (userRes.rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const user = userRes.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// --- Deposit ---
app.post('/api/deposit', authenticateToken, async (req, res) => {
  const { amount, method, txId } = req.body;
  if (!amount || !method || !txId) return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    await pool.query(
      'INSERT INTO deposits (user_id, amount, method, tx_id, status) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, amount, method, txId, 'pending']
    );
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, status) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'deposit', amount, 'pending']
    );
    res.json({ success: true, message: 'Deposit submitted' });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ success: false, message: 'Server error during deposit' });
  }
});

// --- Withdraw ---
app.post('/api/withdraw', authenticateToken, async (req, res) => {
  const { amount, password } = req.body;
  if (!amount || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    const userRes = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const validPass = await bcrypt.compare(password, userRes.rows[0].password_hash);
    if (!validPass) return res.status(400).json({ success: false, message: 'Invalid password' });

    const deposits = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM deposits WHERE user_id=$1 AND status=$2', [req.user.id, 'approved']);
    const withdrawals = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM withdrawals WHERE user_id=$1 AND status=$2', [req.user.id, 'approved']);
    const balance = parseFloat(deposits.rows[0].total) - parseFloat(withdrawals.rows[0].total);

    if (amount > balance) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    await pool.query('INSERT INTO withdrawals (user_id, amount, status) VALUES ($1, $2, $3)', [req.user.id, amount, 'pending']);
    await pool.query('INSERT INTO transactions (user_id, type, amount, status) VALUES ($1, $2, $3, $4)', [req.user.id, 'withdrawal', amount, 'pending']);

    res.json({ success: true, message: 'Withdrawal submitted' });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ success: false, message: 'Server error during withdrawal' });
  }
});

// --- User Summary ---
app.get('/api/user/summary', authenticateToken, async (req, res) => {
  try {
    const deposits = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM deposits WHERE user_id=$1 AND status=$2', [req.user.id, 'approved']);
    const withdrawals = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM withdrawals WHERE user_id=$1 AND status=$2', [req.user.id, 'approved']);
    const balance = parseFloat(deposits.rows[0].total) - parseFloat(withdrawals.rows[0].total);

    res.json({
      success: true,
      balance,
      totalDeposits: parseFloat(deposits.rows[0].total),
      totalWithdrawals: parseFloat(withdrawals.rows[0].total)
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching summary' });
  }
});

// --- Transaction History ---
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const txs = await pool.query(
      'SELECT type, amount, status, created_at FROM transactions WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, transactions: txs.rows });
  } catch (err) {
    console.error('Transactions error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching transactions' });
  }
});

// --- Admin endpoints (no auth yet) ---
app.get('/api/admin/withdrawals', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.id, u.email, w.amount, w.status, w.created_at
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `);
    res.json({ success: true, withdrawals: result.rows });
  } catch (err) {
    console.error('Admin fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/admin/withdrawals/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE withdrawals SET status = $1 WHERE id = $2', ['approved', id]);
    await pool.query('UPDATE transactions SET status = $1 WHERE type = $2 AND user_id = (SELECT user_id FROM withdrawals WHERE id = $3) AND amount = (SELECT amount FROM withdrawals WHERE id = $3)', ['approved', 'withdrawal', id]);
    res.json({ success: true, message: 'Withdrawal approved' });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ success: false, message: 'Server error approving withdrawal' });
  }
});

app.post('/api/admin/withdrawals/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE withdrawals SET status = $1 WHERE id = $2', ['rejected', id]);
    await pool.query('UPDATE transactions SET status = $1 WHERE type = $2 AND user_id = (SELECT user_id FROM withdrawals WHERE id = $3) AND amount = (SELECT amount FROM withdrawals WHERE id = $3)', ['rejected', 'withdrawal', id]);
    res.json({ success: true, message: 'Withdrawal rejected' });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ success: false, message: 'Server error rejecting withdrawal' });
  }
});

// --- Serve static frontend ---
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// --- Serve index.html for root ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Initialize tables if they don't exist ---
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        referral_code VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS deposits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        amount NUMERIC(12, 2) NOT NULL,
        method VARCHAR(100),
        tx_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        amount NUMERIC(12, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Start the server
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
