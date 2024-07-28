const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletSchema = new Schema({
    customerName: {
        type: String,
        required: true,
    },
    customerBalance: {
        type: Number,
        default: 0,
        required: true,
    },
    accountNumber: {
        type: Number,
        required: true,
        unique: true,
    },
}, {
    timestamps: true,
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
