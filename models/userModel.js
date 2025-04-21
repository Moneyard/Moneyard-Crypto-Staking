const db = require('../config/dbConfig');
const bcrypt = require('bcrypt');

const User = {
  /**
   * Create a new user with email, password, and optional referral code
   * @param {string} email - User's email
   * @param {string} password - Plain text password
   * @param {string|null} referralCode - Optional referral code from another user
   * @returns {Promise<Object>} Created user data (without password)
   */
  create: async (email, password, referralCode = null) => {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const normalizedEmail = email.toLowerCase().trim();
      const hashedPassword = await bcrypt.hash(password, 10);

      return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO users 
          (email, password, referral_code, created_at) 
          VALUES (?, ?, ?, datetime('now'))`,
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
   * @returns {Promise<Object|null>} User object or null if not found
   */
  findByEmail: async (email) => {
    if (!email) throw new Error('Email is required');

    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, password, referral_code FROM users WHERE email = ?',
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
   * @param {string} password - Plain text password to verify
   * @returns {Promise<boolean>} True if password matches
   */
  verifyPassword: async (email, password) => {
    const user = await User.findByEmail(email);
    if (!user) return false;
    return bcrypt.compare(password, user.password);
  }
};

module.exports = User;