const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const speakeasy = require('speakeasy');

const app = express();
const port = process.env.PORT || 3000;
const db = new sqlite3.Database('./moneyard.db');

app.use(bodyParser.json());
app.use(cors());

// ======================= DB Initialization =======================
db.serialize(() => {
  // Create Users Table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      balance REAL DEFAULT 0
    )
  `);

  // Create Deposit Table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      amount REAL,
      network TEXT,
      txId TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Create Staking Table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS stakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      plan TEXT,
      amount REAL,
      status TEXT DEFAULT 'Active',
      startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
});

// ======================= USER AUTHENTICATION =======================
app.post('/signup', (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)`,
    [fullName, email, hashedPassword],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error during signup' });
      }
      res.status(201).json({ success: true });
    }
  );
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, 'secretKey', { expiresIn: '1h' });

    res.json({
      success: true,
      userId: user.id,
      fullName: user.fullName,
      token
    });
  });
});

// ======================= DEPOSIT FUNCTIONALITY =======================
app.post('/api/deposit', (req, res) => {
  const { userId, amount, network, txId } = req.body;

  if (!userId || !amount || !network || !txId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.run(
    `INSERT INTO deposits (userId, amount, network, txId) VALUES (?, ?, ?, ?)`,
    [userId, amount, network, txId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error during deposit' });
      }

      db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Error fetching balance' });
        }

        const updatedBalance = row.balance + amount;

        db.run('UPDATE users SET balance = ? WHERE id = ?', [updatedBalance, userId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error updating balance' });
          }

          res.json({ success: true, balance: updatedBalance });
        });
      });
    }
  );
});

// ======================= STAKING FUNCTIONALITY =======================
app.post('/api/stake', (req, res) => {
  const { userId, plan, amount } = req.body;

  if (!userId || !plan || !amount) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
    if (err || row.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    db.run(
      `INSERT INTO stakes (userId, plan, amount, status) VALUES (?, ?, ?, 'Active')`,
      [userId, plan, amount],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Error during staking' });
        }

        const updatedBalance = row.balance - amount;

        db.run('UPDATE users SET balance = ? WHERE id = ?', [updatedBalance, userId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error updating balance' });
          }

          res.json({ success: true, balance: updatedBalance });
        });
      }
    );
  });
});

// ======================= ACTIVE STAKES =======================
app.get('/api/active-stakes', (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  db.all('SELECT * FROM stakes WHERE userId = ? AND status = "Active"', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching stakes' });
    }

    res.json(rows);
  });
});

// ======================= UNSTAKE FUNCTIONALITY =======================
app.post('/api/unstake/:stakeId', (req, res) => {
  const stakeId = req.params.stakeId;

  db.get('SELECT * FROM stakes WHERE id = ?', [stakeId], (err, stake) => {
    if (err || !stake) {
      return res.status(400).json({ error: 'Stake not found' });
    }

    db.run('UPDATE stakes SET status = "Inactive" WHERE id = ?', [stakeId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error during unstaking' });
      }

      res.json({ success: true });
    });
  });
});

// ======================= USER SUMMARY =======================
app.get('/api/user-summary', (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  db.get('SELECT fullName, balance FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'User not found' });
    }

    res.json({
      fullName: user.fullName,
      balance: user.balance
    });
  });
});

// ======================= START SERVER =======================
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
