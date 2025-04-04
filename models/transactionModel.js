const pool = require('../config/db');

const Transaction = {
  create: async (userId, amount, type) => {
    const result = await pool.query(
      'INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, $3) RETURNING *',
      [userId, amount, type]
    );
    return result.rows[0];
  },
  findByUserId: async (userId) => {
    const result = await pool.query('SELECT * FROM transactions WHERE user_id = $1', [userId]);
    return result.rows;
  },
  // Additional methods as needed
};

module.exports = Transaction;
