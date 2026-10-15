// config/razorpay.js
// Exports a single Razorpay instance so we never construct it more than once.
// The secret stays server-side only; only KEY_ID is ever sent to the client.

const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;
