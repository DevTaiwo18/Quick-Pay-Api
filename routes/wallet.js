const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

// Get wallet details
router.get('/wallet/:accountNumber', walletController.getWallet);

// Update wallet balance
router.put('/wallet/:accountNumber', walletController.updateBalance);

module.exports = router;
