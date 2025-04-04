require('dotenv').config();
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
