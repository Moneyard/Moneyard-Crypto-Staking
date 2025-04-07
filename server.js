const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');  // Used for session management
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'secret',  // Change this to something more secure
  resave: false,
  saveUninitialized: true
}));

// SQLite database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) return console.error('Failed to connect to DB:', err);
    console.log('Connected to SQLite database.');
});

// Create transactions table if not exists
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

// Create withdrawals table if not exists
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

// Static pages
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');  // Redirect to dashboard if already logged in
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Show login/sign up
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');  // Redirect to login if not authenticated
    }
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.redirect('/');  // Redirect to login if not an admin or not authenticated
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));  // Show admin panel if admin
});

// API Routes (for simplicity, these remain the same, ensuring you call them after logging in)
// Your API routes for deposit, withdrawal, transactions, etc., would remain unchanged.

// Log in (This is an example, you should validate the user credentials properly)
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // In a real app, you'd fetch the user from the DB and validate the password
    if (username === 'admin' && password === 'admin') {  // Example check
        req.session.user = { username, isAdmin: true };  // Storing user data in session
        return res.redirect('/dashboard');  // Redirect to dashboard after successful login
    } else if (username === 'user' && password === 'user') {  // Non-admin user login
        req.session.user = { username, isAdmin: false };
        return res.redirect('/dashboard');
    }
    res.status(401).json({ error: 'Invalid credentials' });  // Invalid login credentials
});

// Log out
app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');  // Redirect to login after logout
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
