/**
 * Startup Seed Script
 * Automatically creates the default Super Admin account if none exists.
 *
 * Credentials: superadmin@platform.com / admin123
 *
 * Usage:
 *   node scripts/seed.js        (run standalone)
 *   OR called automatically from server.js / auth.js on startup
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedSuperAdmin = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@platform.com').toLowerCase();
    const password = process.env.SUPERADMIN_PASSWORD || 'admin123';

    // Check if this specific SUPERADMIN email already exists
    const existingSuperAdmin = await User.findOne({ email });

    if (existingSuperAdmin) {
      console.log('✅ Super Admin already exists:', existingSuperAdmin.email);
      return existingSuperAdmin;
    }

    // Create the default Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email,
      password, // Will be hashed by the pre-save hook
      role: 'SUPERADMIN',
      restaurantId: null,
    });

    console.log('🌱 Default Super Admin created:');
    console.log('   Email   :', superAdmin.email);
    console.log('   Password:', password);
    console.log('   Role    :', superAdmin.role);

    return superAdmin;
  } catch (error) {
    console.error('❌ Seed error:', error.message);
  }
};

// If run directly (node scripts/seed.js), disconnect after seeding
if (require.main === module) {
  seedSuperAdmin().then(() => {
    console.log('Seed complete. Disconnecting…');
    mongoose.disconnect();
    process.exit(0);
  });
}

module.exports = seedSuperAdmin;
