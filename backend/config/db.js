// config/db.js
// Establishes and exports the MongoDB connection.
// We fail fast on startup so misconfiguration is obvious rather than silent.

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern driver handles deprecation warnings internally; no extra options needed.
    });
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    // Exit so nodemon / pm2 can restart and alert us — better than silent failure.
    process.exit(1);
  }
};

module.exports = connectDB;
