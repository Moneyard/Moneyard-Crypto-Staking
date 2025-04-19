// ======== ADD THESE NEW REQUIRES AT TOP ========
const nodemailer = require('nodemailer');
const pdf = require('html-pdf');
const fs = require('fs').promises;
const crypto = require('crypto');

// ======== EMAIL CONFIG (ADD AFTER DB SETUP) ========
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: true,
  port: 587,
  secure: false
});

// ======== ENHANCED DEPOSIT SYSTEM ========

// Modified Deposit Endpoint (now with pending status)
app.post('/api/deposit', async (req, res) => {
  const { userId, amount, network, txId } = req.body;
  
  try {
    const now = new Date().toISOString();
    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO transactions 
              (user_id, type, amount, network, tx_id, status, date)
              VALUES (?, 'deposit', ?, ?, ?, 'pending', ?)`,
        [userId, amount, network, txId, now],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Get user email for notification
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT email FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Send deposit received email
    await transporter.sendMail({
      from: 'Moneyard <noreply@moneyard.com>',
      to: user.email,
      subject: 'Deposit Received - Pending Approval',
      html: `
        <h3>Your deposit is being reviewed</h3>
        <p>Amount: $${amount}</p>
        <p>Network: ${network}</p>
        <p>We'll notify you once approved.</p>
      `
    });

    res.json({ success: true, message: 'Deposit submitted for approval' });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Deposit processing failed' });
  }
});

// ======== ENHANCED ADMIN APPROVAL ========
app.post('/api/admin/approve-deposit', async (req, res) => {
  const { transactionId } = req.body;

  try {
    // Start transaction
    await new Promise((resolve, reject) => db.run('BEGIN TRANSACTION', (err) => err ? reject(err) : resolve()));

    // 1. Get transaction details
    const tx = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM transactions WHERE id = ? AND status = 'pending'`, 
        [transactionId], (err, row) => err ? reject(err) : resolve(row));
    });

    if (!tx) throw new Error('Transaction not found or already processed');

    // 2. Update transaction status
    await new Promise((resolve, reject) => {
      db.run(`UPDATE transactions SET status = 'approved' WHERE id = ?`, 
        [transactionId], (err) => err ? reject(err) : resolve());
    });

    // 3. Update user balance
    await new Promise((resolve, reject) => {
      db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, 
        [tx.amount, tx.user_id], (err) => err ? reject(err) : resolve());
    });

    // 4. Get user details
    const user = await new Promise((resolve, reject) => {
      db.get(`SELECT email FROM users WHERE id = ?`, 
        [tx.user_id], (err, row) => err ? reject(err) : resolve(row));
    });

    // 5. Generate PDF receipt
    const receiptHtml = `
      <h1>Moneyard Deposit Receipt</h1>
      <p>Transaction ID: ${tx.id}</p>
      <p>Amount: $${tx.amount}</p>
      <p>Date: ${new Date(tx.date).toLocaleString()}</p>
      <p>Status: Approved</p>
    `;
    
    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(receiptHtml).toBuffer((err, buffer) => {
        err ? reject(err) : resolve(buffer);
      });
    });

    // 6. Send approval email with PDF
    await transporter.sendMail({
      from: 'Moneyard <noreply@moneyard.com>',
      to: user.email,
      subject: 'Deposit Approved',
      html: `
        <h3>Your deposit has been approved!</h3>
        <p>Amount: $${tx.amount}</p>
        <p>New balance: $${(await getBalance(tx.user_id)).balance}</p>
      `,
      attachments: [{
        filename: `receipt-${tx.id}.pdf`,
        content: pdfBuffer
      }]
    });

    // Commit transaction
    await new Promise((resolve, reject) => db.run('COMMIT', (err) => err ? reject(err) : resolve()));
    res.json({ success: true });

  } catch (error) {
    await new Promise((resolve, reject) => db.run('ROLLBACK', (err) => err ? reject(err) : resolve()));
    console.error('Approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function
function getBalance(userId) {
  return new Promise((resolve, reject) => {
    db.get("SELECT balance FROM users WHERE id = ?", [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// ======== SECURITY IMPROVEMENTS ========
// Add these middleware after other middleware
app.use((req, res, next) => {
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  });
  return limiter(req, res, next);
});

app.use((req, res, next) => {
  // Basic request validation
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
});

// ======== NEW PACKAGES TO INSTALL ========
// Run: npm install html-pdf nodemailer rate-limiter-flexible