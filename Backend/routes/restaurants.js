const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// All routes require SUPERADMIN role
router.use(protect, authorize('SUPERADMIN'));

// ─── GET /api/restaurants ──────────────────────────────────────────────────
// List all restaurants
router.get('/', async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/restaurants ─────────────────────────────────────────────────
// Create a new restaurant (onboard a new client)
router.post('/', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.create(req.body);
    res.status(201).json({ success: true, message: 'Restaurant created', data: restaurant });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/restaurants/:id ─────────────────────────────────────────────
// Get single restaurant by ID
router.get('/:id', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
});

// ─── PUT /api/restaurants/:id ─────────────────────────────────────────────
// Update restaurant (name, theme, features, etc.)
router.put('/:id', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.status(200).json({ success: true, message: 'Restaurant updated', data: restaurant });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/restaurants/:id/theme ────────────────────────────────────
// Update only the theme object (live theme customizer)
router.patch('/:id/theme', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    // Merge theme fields
    Object.assign(restaurant.theme, req.body);
    await restaurant.save();
    res.status(200).json({ success: true, message: 'Theme updated', data: restaurant.theme });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/restaurants/:id/features ─────────────────────────────────
// Update only the features toggles (12-switch Feature & UI Toggle control panel)
router.patch('/:id/features', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    // Merge feature toggle fields
    Object.assign(restaurant.features, req.body);
    await restaurant.save();
    res.status(200).json({ success: true, message: 'Features updated', data: restaurant.features });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/restaurants/:id ─────────────────────────────────────────
// Soft-delete (deactivate) a restaurant
router.delete('/:id', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.status(200).json({ success: true, message: 'Restaurant deactivated' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
