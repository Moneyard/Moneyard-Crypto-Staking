const db = require('../config/dbConfig'); // Import SQLite database config

const Transaction = {
  // Create a new transaction
  create: async (userId, amount, type) => {
    return new Promise((resolve, reject) => {
      // Insert the transaction into the SQLite database
      db.run('INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)', 
        [userId, amount, type], 
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID, // SQLite returns the last inserted ID
              user_id: userId,
              amount,
              type
            });
          }
        });
    });
  },

  // Find transactions by user ID
  findByUserId: async (userId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM transactions WHERE user_id = ?', [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Additional methods as needed
};

module.exports = Transaction;
