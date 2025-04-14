// Importing required dependencies
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Initialize the Express app
const app = express();
const port = process.env.PORT || 3000;

// Body-parser middleware to handle POST request data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// SQLite database initialization
let db = new sqlite3.Database('./moneyard.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create necessary tables (if not already created)
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT, password TEXT, created_at TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS deposits (id INTEGER PRIMARY KEY, user_id INTEGER, amount REAL, timestamp TEXT)');
});

// Sample route for user registration
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const stmt = db.prepare('INSERT INTO users (email, password, created_at) VALUES (?, ?, ?)');
  stmt.run(email, hashedPassword, new Date().toISOString(), function (err) {
    if (err) {
      return res.status(500).send({ message: 'Error registering user.' });
    }
    res.status(201).send({ message: 'User registered successfully.' });
  });
  stmt.finalize();
});

// Sample route for user login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err || !row) {
      return res.status(404).send({ message: 'User not found.' });
    }

    const passwordMatch = bcrypt.compareSync(password, row.password);
    if (!passwordMatch) {
      return res.status(401).send({ message: 'Invalid password.' });
    }
    
    res.status(200).send({ message: 'Login successful.' });
  });
});

// Sample route for sending a confirmation email
app.post('/send-confirmation', (req, res) => {
  const { email } = req.body;
  
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com', // Use your email here
      pass: 'your-email-password'    // Use your email password or OAuth credentials here
    }
  });
  
  let mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Account Confirmation',
    text: 'Please confirm your email address to complete the registration process.'
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send({ message: 'Error sending confirmation email.' });
    }
    res.status(200).send({ message: 'Confirmation email sent.' });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
