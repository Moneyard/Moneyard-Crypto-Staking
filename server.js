// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Initialize Express app
const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to parse JSON bodies
app.use(express.json());

// API Routes
app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/dashboard', dashboardRoutes);

// Test Supabase connection (optional)
app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('your_table_name').select('*');
  if (error) {
    return res.status(500).json({ error: 'Database connection failed', details: error });
  }
  res.status(200).json({ data });
});

// Set up server to listen on specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
