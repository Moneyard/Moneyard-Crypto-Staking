const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

app.use(bodyParser.json());

// Mock Database (replace with actual database in production)
const users = []; // Will store user data in memory for simplicity
const tokens = []; // Store generated JWT tokens

// Signup API
app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Please fill in all fields' });
    }

    if (users.find(user => user.email === email)) {
        return res.status(400).json({ error: 'Email already in use' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Failed to hash password' });

        const newUser = { id: uuidv4(), username, email, password: hashedPassword };
        users.push(newUser);

        res.status(201).json({ success: true, message: 'User registered successfully!' });
    });
});

// Login API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(user => user.email === email);
    if (!user) return res.status(400).json({ error: 'User not found' });

    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ error: 'Error comparing passwords' });
        if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ userId: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
        tokens.push(token);

        res.status(200).json({ success: true, userId: user.id, username: user.username, token });
    });
});

// Forgot Password API (mock)
app.post('/api/request-password-reset', (req, res) => {
    const { email } = req.body;
    const user = users.find(user => user.email === email);
    if (!user) return res.status(400).json({ error: 'No user found with that email' });

    // For demo purposes, we just return a success message
    res.status(200).json({ message: 'Password reset link sent' });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
