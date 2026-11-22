const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ─── SUPERADMIN routes: manage restaurant admin accounts ───────────────────

// GET /api/users  – SUPERADMIN: list all users
router.get('/', protect, authorize('SUPERADMIN'), async (req, res, next) => {
  try {
    const { role, restaurantId } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (restaurantId) filter.restaurantId = restaurantId;

    const users = await User.find(filter)
      .populate('restaurantId', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
});

// POST /api/users  – SUPERADMIN: create a Restaurant Admin account
router.post('/', protect, authorize('SUPERADMIN'), async (req, res, next) => {
  try {
    const { name, email, password, restaurantId } = req.body;

    if (!name || !email || !password || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'name, email, password, and restaurantId are required',
      });
    }

    const user = await User.create({ name, email, password, role: 'RESTAURANT', restaurantId });
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ success: true, message: 'Restaurant admin created', data: userObj });
  } catch (error) {
    next(error);
  }
});

// ─── RESTAURANT ADMIN routes: manage Rider accounts ───────────────────────

// POST /api/users/riders  – RESTAURANT: create a rider under own restaurant
router.post(
  '/riders',
  protect,
  authorize('RESTAURANT', 'SUPERADMIN'),
  async (req, res, next) => {
    try {
      const { name, email, password, phone } = req.body;

      // Restaurant admin can only create riders for their own restaurant
      const restaurantId =
        req.user.role === 'SUPERADMIN' ? req.body.restaurantId : req.user.restaurantId;

      if (!restaurantId) {
        return res.status(400).json({ success: false, message: 'restaurantId is required' });
      }

      const rider = await User.create({
        name,
        email,
        password,
        phone: phone || '',
        role: 'RIDER',
        restaurantId,
      });

      const riderObj = rider.toObject();
      delete riderObj.password;

      res.status(201).json({ success: true, message: 'Rider account created', data: riderObj });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/users/riders  – RESTAURANT: list riders for own restaurant
router.get(
  '/riders',
  protect,
  authorize('RESTAURANT', 'SUPERADMIN'),
  async (req, res, next) => {
    try {
      const filter = { role: 'RIDER' };

      if (req.user.role === 'RESTAURANT') {
        filter.restaurantId = req.user.restaurantId;
      } else if (req.query.restaurantId) {
        filter.restaurantId = req.query.restaurantId;
      }

      const riders = await User.find(filter)
        .populate('restaurantId', 'name slug')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, count: riders.length, data: riders });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/users/:id/toggle  – SUPERADMIN/RESTAURANT: activate or deactivate a user
router.patch('/:id/toggle', protect, authorize('SUPERADMIN', 'RESTAURANT'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Restaurant admin can only toggle their own riders
    if (req.user.role === 'RESTAURANT') {
      if (
        user.role !== 'RIDER' ||
        user.restaurantId?.toString() !== req.user.restaurantId?.toString()
      ) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      data: { isActive: user.isActive },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id – SUPERADMIN/RESTAURANT: permanently delete a user account
router.delete('/:id', protect, authorize('SUPERADMIN', 'RESTAURANT'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting own logged-in account
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Prevent deleting Super Admin
    if (user.role === 'SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot delete a Super Admin account' });
    }

    // Restaurant admin can only delete their own riders
    if (req.user.role === 'RESTAURANT') {
      if (
        user.role !== 'RIDER' ||
        user.restaurantId?.toString() !== req.user.restaurantId?.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden – you can only delete riders from your own restaurant',
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `${user.role} account deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
