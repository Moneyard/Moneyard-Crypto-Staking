const db = require('../config/dbConfig'); // Import SQLite database config
const bcrypt = require('bcrypt'); // Use bcrypt for password hashing

const User = {
  // Create a new user
  create: async (email, password, referralCode, referredBy) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newReferralCode = generateReferralCode();

    return new Promise((resolve, reject) => {
      // Insert the new user into the SQLite database
      db.run('INSERT INTO users (email, password, referral_code, referred_by) VALUES (?, ?, ?, ?)', 
        [email, hashedPassword, newReferralCode, referredBy], 
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ email, referralCode: newReferralCode });
          }
        });
    });
  },

  // Find a user by email
  findByEmail: async (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Additional methods as needed
};

// Generate a random referral code
function generateReferralCode() {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

module.exports = User;
