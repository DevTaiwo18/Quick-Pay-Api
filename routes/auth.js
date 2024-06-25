const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Register
router.post(
   '/register',
   [
      check('username', 'Username is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
   ],
   authController.register
);

// Create PIN
router.post('/create-pin', authMiddleware, authController.createPin);

// Login
router.post(
   '/login',
   [
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Password is required').exists()
   ],
   authController.login
);

// Request password reset (generate OTP)
router.post(
   '/request-password-reset',
   [
      check('email', 'Please include a valid email').isEmail()
   ],
   authController.requestPasswordReset
);

// Confirm OTP
router.post(
   '/confirm-otp',
   [
      check('email', 'Please include a valid email').isEmail(),
      check('otp', 'OTP is required').not().isEmpty()
   ],
   authController.confirmOtp
);

// Create new password
router.post(
   '/create-new-password',
   [
      check('userId', 'User ID is required').not().isEmpty(),
      check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
   ],
   authController.createNewPassword
);

router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
