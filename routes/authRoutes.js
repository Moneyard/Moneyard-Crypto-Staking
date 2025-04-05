const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// User registration route
router.post('/signup', authController.signup);

// User login route
router.post('/login', authController.login);

module.exports = router;
