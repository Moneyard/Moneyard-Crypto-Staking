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

// PostgreSQL pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
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
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Insert user
    const insertUser = await pool.query(
      'INSERT INTO users (email, password_hash, referral_code) VALUES ($1, $2, $3) RETURNING id',
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
    if (userRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const user = userRes.rows[0];
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(400).json({ success: false, message: 'Invalid email or password' });

    // Create JWT
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
  if (!amount || !method || !txId) {
    return res.status(400).json({ success: false, message: 'Missing deposit fields' });
  }

  try {
    await pool.query(
      'INSERT INTO deposits (user_id, amount, method, tx_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, amount, method, txId]
    );

    // Also insert into transactions table
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, status) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'deposit', amount, 'pending']
    );

    res.json({ success: true, message: 'Deposit request received' });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ success: false, message: 'Server error during deposit' });
  }
});

// --- Withdraw ---
app.post('/api/withdraw', authenticateToken, async (req, res) => {
  const { amount, password } = req.body;
  if (!amount || !password) return res.status(400).json({ success: false, message: 'Missing withdrawal fields' });

  try {
    // Verify user password
    const userRes = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const validPass = await bcrypt.compare(password, userRes.rows[0].password_hash);
    if (!validPass) return res.status(400).json({ success: false, message: 'Invalid password' });

    // Check balance (sum deposits - sum withdrawals)
    const depositSum = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM deposits WHERE user_id=$1 AND status=\'approved\'', [req.user.id]);
    const withdrawalSum = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM withdrawals WHERE user_id=$1 AND status=\'approved\'', [req.user.id]);
    const balance = parseFloat(depositSum.rows[0].total) - parseFloat(withdrawalSum.rows[0].total);

    if (amount > balance) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    // Insert withdrawal request
    await pool.query(
      'INSERT INTO withdrawals (user_id, amount) VALUES ($1, $2)',
      [req.user.id, amount]
    );

    // Also insert into transactions
    await pool.query(
      'INSERT INTO transactions (user_id, type, amount, status) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'withdrawal', amount, 'pending']
    );

    res.json({ success: true, message: 'Withdrawal request received' });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ success: false, message: 'Server error during withdrawal' });
  }
});

// --- User summary ---
app.get('/api/user/summary', authenticateToken, async (req, res) => {
  try {
    const depositSum = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM deposits WHERE user_id=$1 AND status=\'approved\'', [req.user.id]);
    const withdrawalSum = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM withdrawals WHERE user_id=$1 AND status=\'approved\'', [req.user.id]);
    const balance = parseFloat(depositSum.rows[0].total) - parseFloat(withdrawalSum.rows[0].total);

    res.json({
      success: true,
      balance,
      totalDeposits: parseFloat(depositSum.rows[0].total),
      totalWithdrawals: parseFloat(withdrawalSum.rows[0].total)
    });
  } catch (err) {
    console.error('User summary error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching summary' });
  }
});

// --- Transaction history ---
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

// --- Admin: list withdrawal requests ---
app.get('/api/admin/withdrawals', async (req, res) => {
  // In production, add proper admin authentication here
  try {
    const wds = await pool.query(
      'SELECT w.id, u.email, w.amount, w.status, w.created_at FROM withdrawals w JOIN users u ON w.user_id = u.id ORDER BY w.created_at DESC'
    );
    res.json({ success: true, withdrawals: wds.rows });
  } catch (err) {
    console.error('Admin withdrawals error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching withdrawals' });
  }
});

// --- Admin: approve or reject withdrawal ---
app.post('/api/admin/withdrawals/:id/approve', async (req, res) => {
  // Add admin auth in production
  const { id } = req.params;
  try {
    await pool.query('UPDATE withdrawals SET status = $1 WHERE id = $2', ['approved', id]);
    await pool.query('UPDATE transactions SET status = $1 WHERE id = $2 AND type = $3', ['approved', id, 'withdrawal']);
    res.json({ success: true, message: 'Withdrawal approved' });
  } catch (err) {
    console.error('Approve withdrawal error:', err);
    res.status(500).json({ success: false, message: 'Server error approving withdrawal' });
  }
});

app.post('/api/admin/withdrawals/:id/reject', async (req, res) => {
  // Add admin auth in production
  const { id } = req.params;
  try {
    await pool.query('UPDATE withdrawals SET status = $1 WHERE id = $2', ['rejected', id]);
    await pool.query('UPDATE transactions SET status = $1 WHERE id = $2 AND type = $3', ['rejected', id, 'withdrawal']);
    res.json({ success: true, message: 'Withdrawal rejected' });
  } catch (err) {
    console.error('Reject withdrawal error:', err);
    res.status(500).json({ success: false, message: 'Server error rejecting withdrawal' });
  }
});

// --- Server start ---
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
