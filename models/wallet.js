const mongoose = require('mongoose');
const { Schema } = mongoose;

const accountSchema = new Schema({
    bankCode: String,
    bankName: String,
    accountNumber: String,
    accountName: String
}, { _id: false });

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
        type: String, 
        required: true,
        unique: true,
    },
    contractCode: {
        type: String,
    },
    accountReference: {
        type: String,
    },
    accountName: {
        type: String,
    },
    currencyCode: {
        type: String,
    },
    customerEmail: {
        type: String,
    },
    collectionChannel: {
        type: String,
    },
    reservationReference: {
        type: String,
    },
    reservedAccountType: {
        type: String,
    },
    status: {
        type: String,
    },
    createdOn: {
        type: Date,
    },
    restrictPaymentSource: {
        type: Boolean,
    },
    accounts: [accountSchema], 
}, {
    timestamps: true,
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
