const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const seedSuperAdmin = require('../scripts/seed');

/**
 * Helper: generate a signed JWT for a user
 */
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '7d',
  });
};

// ─── POST /api/auth/register ───────────────────────────────────────────────
// Public – register a new customer account
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'CUSTOMER',
      restaurantId: null,
    });

    const token = signToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────
// Public – authenticate any role (SUPERADMIN, RESTAURANT, RIDER, CUSTOMER)
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'superadmin@platform.com').toLowerCase().trim();

    // If logging in as the Super Admin and user is not yet in MongoDB Atlas, auto-seed now!
    if (cleanEmail === superAdminEmail) {
      const existingSuperAdmin = await User.findOne({ email: superAdminEmail });
      if (!existingSuperAdmin) {
        console.log('⚡ Super Admin not found on login attempt, auto-seeding now...');
        await seedSuperAdmin();
      }
    }

    // Explicitly select password (it has select: false in schema)
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const token = signToken(user._id);

    // Strip password before sending
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
// Protected – returns the currently authenticated user's profile
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('restaurantId', 'name slug');
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────
// Protected – client-side token removal (stateless JWT, just confirms logout)
router.post('/logout', protect, (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
