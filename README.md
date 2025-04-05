# Moneyard-Crypto-Staking

A crypto staking platform with user authentication, deposits, withdrawals, referral rewards, and a dashboard. This platform allows users to register, log in, make deposits, withdraw, and earn rewards based on their referrals.

## Features

- **User Authentication**: Sign up and login using email and password.
- **Referral System**: Users can refer others and earn rewards.
- **Crypto Staking**: Users can deposit and withdraw cryptocurrencies.
- **Dashboard**: A user-friendly dashboard displaying transactions and staking information.

## Project Structure

```plaintext
/Moneyard-Crypto-Staking
  /config
    - dbConfig.js      (Database configuration)
  /controllers
    - authController.js (Handles user authentication logic)
  /models
    - userModel.js      (Handles database interactions for users)
    - transactionModel.js (Handles database interactions for transactions)
  /routes
    - authRoutes.js     (Defines authentication routes)
    - dashboardRoutes.js (Defines dashboard routes)
  .env                  (Environment variables)
  .gitignore            (Git ignore rules)
  Procfile              (Heroku start command)
  README.md             (Project documentation)
  /public
    - index.html        (Frontend page for the platform)
  package.json          (Project dependencies and scripts)
  server.js             (Backend API and static file serving)
