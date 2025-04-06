const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));  // Serve static files from the 'public' folder
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve the index.html file when visiting the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the dashboard page (example)
app.get('/dashboard', (req, res) => {
    res.send('<h1>Welcome to your Dashboard!</h1>');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
