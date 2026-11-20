const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // Return active connection if already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If currently connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    return new Promise((resolve, reject) => {
      mongoose.connection.once('connected', () => resolve(mongoose.connection));
      mongoose.connection.once('error', (err) => reject(err));
    });
  }

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_saas';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Only exit in standalone CLI/dev mode, never crash serverless function worker
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
