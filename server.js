const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_secret_here';

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) return console.error('Database connection error:', err);
    console.log('Connected to SQLite database');
});

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        refcode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        network TEXT,
        tx_id TEXT UNIQUE,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// Auth Middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Enhanced Signup Endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password, refcode } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
            `INSERT INTO users (username, email, password, refcode) 
             VALUES (?, ?, ?, ?)`,
            [username, email, hashedPassword, refcode],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ error: 'Username or email already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                
                const token = jwt.sign(
                    { userId: this.lastID, username }, 
                    JWT_SECRET, 
                    { expiresIn: '1h' }
                );
                
                res.status(201).json({ 
                    message: 'User created successfully',
                    token,
                    user: { id: this.lastID, username, email }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Enhanced Login Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!user) return res.status(404).json({ error: 'User not found' });

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { userId: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, username: user.username, email: user.email }
            });
        }
    );
});

// Password Reset Endpoint
app.post('/api/reset-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both passwords are required' });
        }

        db.get(
            'SELECT password FROM users WHERE id = ?',
            [userId],
            async (err, user) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                
                const validPassword = await bcrypt.compare(currentPassword, user.password);
                if (!validPassword) {
                    return res.status(401).json({ error: 'Current password is incorrect' });
                }

                const hashedPassword = await bcrypt.hash(newPassword, 10);
                
                db.run(
                    'UPDATE users SET password = ? WHERE id = ?',
                    [hashedPassword, userId],
                    (err) => {
                        if (err) return res.status(500).json({ error: 'Password update failed' });
                        res.json({ message: 'Password updated successfully' });
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add other endpoints (deposits, transactions, etc.) below...

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});