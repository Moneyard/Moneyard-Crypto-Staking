const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  create: async (email, password, referralCode, referredBy) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newReferralCode = generateReferralCode();
    const result = await pool.query(
      'INSERT INTO users (email, password, referral_code, referred_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, hashedPassword, newReferralCode, referredBy]
    );
    return result.rows[0];
  },
  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },
  // Additional methods as needed
};

function generateReferralCode() {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

module.exports = User;
