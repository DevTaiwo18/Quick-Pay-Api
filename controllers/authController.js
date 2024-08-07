﻿const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const BlacklistedToken = require('../models/BlacklistedToken');
const path = require('path');
const axios = require('axios');
const Wallet = require('../models/wallet');

const transporter = nodemailer.createTransport({
   service: 'Gmail',
   auth: { user: 'adeyemitaiwo24434@gmail.com', pass: 'oapuimxcoqlelhoc' }
});

const sendEmail = async (to, subject, template, context) => {
   try {
      const emailTemplate = await ejs.renderFile(path.join(__dirname, '../emails', template), context);
      const mailOptions = { to, subject, html: emailTemplate };
      transporter.sendMail(mailOptions, (error) => {
         if (error) console.error(`Failed to send ${subject} email:`, error);
      });
   } catch (err) {
      console.error('Failed to render email template:', err);
   }
};

exports.register = async (req, res) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }

   const { username, email, password } = req.body;

   try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ msg: 'User already exists' });

      user = new User({ username, email, password, isSubscribed: true });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      // Generate Wallet for User
      const accountNumber = generateAccountNumber();

      const monnifyResponse = await axios.post('https://api.monnify.com/api/v1/bank-transfer/reserved-accounts', {
         accountReference: `Quick-Pay-${user._id}`,
         accountName: `Quick-Pay-${username}`,
         currencyCode: 'NGN',
         contractCode: process.env.MONNIFY_CONTRACT_CODE,
         customerEmail: email,
         customerName: username,
         getAllAvailableBanks: true
      }, {
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`
         }
      });

      const newWallet = new Wallet({
         customerName: username,
         customerBalance: 0,
         accountNumber: accountNumber
      });

      await newWallet.save();

      if (user.isSubscribed) {
         await sendEmail(
            user.email,
            'Welcome to Quick-Pay',
            'welcome.ejs',
            {
               username,
               unsubscribe_link: `https://quick-pay-api.onrender.com/api/v1/unsubscribe/${user._id}`
            }
         );
      }

      res.json({
         token,
         navigateTo: 'createPin',
         user,
         wallet: newWallet,
         monnifyResponse: monnifyResponse.data
      });
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
   }
};

const generateAccountNumber = () => {
   return Math.floor(Math.random() * 1000000000);
};



// Create PIN
exports.createPin = async (req, res) => {
   const { pin } = req.body;
   const userId = req.user.id;

   try {
      // Generate salt and hash the PIN
      const salt = await bcrypt.genSalt(10);
      const hashedPin = await bcrypt.hash(pin.toString(), salt); // Ensure pin is hashed as string

      let user = await User.findById(userId);
      if (!user) return res.status(400).json({ msg: 'User not found' });

      // Store the hashed PIN in the database
      user.pin = hashedPin;
      await user.save();

      res.json({ msg: 'PIN created successfully' });
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
   }
};

// Login user
exports.login = async (req, res) => {
   const { email, password } = req.body;

   try {
      let user = await User.findOne({ email });
      if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

      const payload = { user: { id: user.id } };
      jwt.sign(payload, process.env.jwtSecret, { expiresIn: '5 days' }, (err, token) => {
         if (err) throw err;
         res.json({ token, user });
      });
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
   }
};

// Request password reset (generate OTP)
exports.requestPasswordReset = async (req, res) => {
   const { email } = req.body;

   try {
      let user = await User.findOne({ email });
      if (!user) return res.status(400).json({ msg: 'User not found' });

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      await user.save();

      await sendEmail(user.email, 'Password Reset OTP', 'otp.ejs', { otp });
      res.json({ msg: 'OTP sent', navigateTo: 'confirmOtp' });
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
   }
};

// Confirm OTP and navigate to create new password page
exports.confirmOtp = async (req, res) => {
   const { email, otp } = req.body;

   try {
      let user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
      if (!user) return res.status(400).json({ msg: 'Invalid or expired OTP' });

      res.json({ msg: 'OTP confirmed', navigateTo: 'createNewPassword', userId: user._id });
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
   }
};

// Create new password
exports.createNewPassword = async (req, res) => {
   const { userId, newPassword } = req.body;

   try {
      let user = await User.findById(userId);
      if (!user) return res.status(400).json({ msg: 'User not found' });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      res.json({ msg: 'Password reset successfully' });
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
   }
};

// Logout user
exports.logout = async (req, res) => {
   const { token } = req.body;
   if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
   }

   try {
      const decoded = jwt.verify(token, process.env.jwtSecret);
      const expiresAt = new Date(decoded.exp * 1000);

      const blacklistedToken = new BlacklistedToken({
         token,
         expiresAt
      });

      await blacklistedToken.save();

      res.json({ msg: 'Logout successful' });
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
   }
};
