const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== PATH CONFIGURATION ======
const publicPath = path.join(__dirname, 'Public');

// Check if Public directory exists
if (!fs.existsSync(publicPath)) {
  console.error(`ERROR: Public directory not found at ${publicPath}`);
  console.log('Creating Public directory...');
  try {
    fs.mkdirSync(publicPath);
    // Create basic index.html if it doesn't exist
    const defaultHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Moneyard App</title>
      </head>
      <body>
        <h1>Welcome to Moneyard</h1>
        <p>Application is running</p>
      </body>
      </html>
    `;
    fs.writeFileSync(path.join(publicPath, 'index.html'), defaultHtml);
    console.log('Created default index.html');
  } catch (err) {
    console.error('Failed to create Public directory:', err);
    process.exit(1);
  }
}

// ====== STATIC FILE SERVING ======
app.use(express.static(publicPath, {
  extensions: ['html'],
  fallthrough: false // Return 404 if file not found
}));

// ====== ROUTE HANDLING ======
// Handle SPA (Single Page Application) routes
const spaRoutes = ['/dashboard', '/login', '/signup', '/stake', '/withdraw', '/deposit'];
app.get(spaRoutes, (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <h1>404 - File Not Found</h1>
      <p>index.html not found in Public directory</p>
      <p>Current directory: ${__dirname}</p>
    `);
  }
});

// ====== ERROR HANDLING ======
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    path: err.path || 'Not specified',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Public directory: ${publicPath}`);
  console.log(`Try accessing: http://localhost:${PORT}`);
});