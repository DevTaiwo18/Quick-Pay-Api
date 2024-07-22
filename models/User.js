const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
   username: { type: String, required: true },
   email: { type: String, required: true, unique: true },
   password: { type: String, required: true },
   isSubscribed: { type: Boolean, default: true },
   pin: { type: String, required: false },  
   otp: { type: String, required: false },
   otpExpires: { type: Date, required: false },
   date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
