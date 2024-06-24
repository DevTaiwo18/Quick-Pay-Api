const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const transporter = nodemailer.createTransport({
   service: 'Gmail',
   auth: { user: 'adeyemitaiwo24434@gmail.com', pass: 'oapuimxcoqlelhoc' }
});

// Register user and navigate to create PIN page
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

      const payload = { user: { id: user.id } };
      jwt.sign(payload, process.env.jwtSecret, { expiresIn: '5 days' }, async (err, token) => {
         if (err) throw err;

         // Send welcome email
         if (user.isSubscribed) {
            const emailTemplate = await ejs.renderFile(
               path.join(__dirname, '../emails', 'welcome.ejs'),
               {
                  username,
                  unsubscribe_link: `https://quick-pay-api.onrender.com/api/v1/unsubscribe/${user.id}`
               }
            );
            const mailOptions = {
               to: user.email,
               subject: 'Welcome to Quick-Pay',
               html: emailTemplate
            };

            transporter.sendMail(mailOptions, (error) => {
               if (error) console.error('Failed to send welcome email:', error);
            });
         }

         res.json({ token, navigateTo: 'createPin', user });
      });
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
   }
};

// Create PIN
exports.createPin = async (req, res) => {
   const { pin } = req.body; 
   console.log(pin);
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
      user.otpExpires = Date.now() + 10 * 60 * 1000;

      await user.save();

      const emailTemplate = await ejs.renderFile(path.join(__dirname, '../emails', 'otp.ejs'), { otp });
      const mailOptions = {
         to: user.email,
         subject: 'Password Reset OTP',
         html: emailTemplate
      };

      transporter.sendMail(mailOptions, (error) => {
         if (error) return res.status(500).json({ msg: 'Failed to send OTP' });
         res.json({ msg: 'OTP sent', navigateTo: 'confirmOtp' });
      });
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
