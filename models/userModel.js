const db = require('../config/dbConfig');
const bcrypt = require('bcrypt');

const User = {
  /**
   * Create a new user
   * @param {string} email - User's email
   * @param {string} password - Plain text password
   * @param {string|null} referralCode - Optional referral code
   * @returns {Promise<Object>} Created user data
   */
  create: async (email, password, referralCode = null) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const normalizedEmail = email.toLowerCase().trim();
      const hashedPassword = await bcrypt.hash(password, 10);

      return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO users 
          (email, password, referral_code) 
          VALUES (?, ?, ?)`,
          [normalizedEmail, hashedPassword, referralCode],
          function(err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                reject(new Error('Email already exists'));
              } else {
                reject(err);
              }
            } else {
              resolve({
                id: this.lastID,
                email: normalizedEmail,
                balance: 0, // Default value matches your schema
                referralCode
              });
            }
          }
        );
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find user by email
   * @param {string} email - User's email
   * @returns {Promise<Object|null>} User object or null
   */
  findByEmail: async (email) => {
    if (!email) throw new Error('Email is required');

    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, email, password, balance, referral_code 
         FROM users WHERE email = ?`,
        [email.toLowerCase().trim()],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        }
      );
    });
  },

  /**
   * Verify user password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<boolean>} True if password matches
   */
  verifyPassword: async (email, password) => {
    const user = await User.findByEmail(email);
    if (!user) return false;
    return bcrypt.compare(password, user.password);
  },

  /**
   * Update user balance
   * @param {number} userId - User ID
   * @param {number} amount - Amount to add/subtract
   * @returns {Promise<boolean>} True if update succeeded
   */
  updateBalance: async (userId, amount) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [amount, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }
};

module.exports = User;