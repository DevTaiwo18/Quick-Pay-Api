const Wallet = require('../models/wallet'); 

// Get wallet details by account number
exports.getWallet = async (req, res) => {
    const { accountNumber } = req.params;

    try {
        const wallet = await Wallet.findOne({ accountNumber });
        if (!wallet) {
            return res.status(404).json({ msg: 'Wallet not found' });
        }

        res.json(wallet);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Update wallet balance
exports.updateBalance = async (req, res) => {
    const { accountNumber } = req.params;
    const { amount } = req.body;

    try {
        const wallet = await Wallet.findOne({ accountNumber });
        if (!wallet) {
            return res.status(404).json({ msg: 'Wallet not found' });
        }

        wallet.customerBalance += amount;
        await wallet.save();
        res.json(wallet);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
