const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

// ─── GET /api/categories ───────────────────────────────────────────────────
// Public (storefront reads categories by restaurantId query param)
// Or RESTAURANT admin reads their own categories
router.get('/', async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurantId query param is required' });
    }

    const categories = await Category.find({ restaurantId, isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/categories ──────────────────────────────────────────────────
// RESTAURANT admin creates a category for their restaurant
router.post('/', protect, authorize('RESTAURANT', 'SUPERADMIN'), async (req, res, next) => {
  try {
    const restaurantId =
      req.user.role === 'SUPERADMIN' ? req.body.restaurantId : req.user.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }

    const category = await Category.create({ ...req.body, restaurantId });
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    next(error);
  }
});

// ─── PUT /api/categories/:id ───────────────────────────────────────────────
// RESTAURANT admin updates their own category
router.put('/:id', protect, authorize('RESTAURANT', 'SUPERADMIN'), async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Scope check for RESTAURANT role
    if (
      req.user.role === 'RESTAURANT' &&
      (!req.user.restaurantId ||
        category.restaurantId.toString() !== req.user.restaurantId.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden – not your restaurant' });
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: 'Category updated', data: updated });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/categories/:id ───────────────────────────────────────────
// RESTAURANT admin soft-deletes their own category
router.delete('/:id', protect, authorize('RESTAURANT', 'SUPERADMIN'), async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (
      req.user.role === 'RESTAURANT' &&
      (!req.user.restaurantId ||
        category.restaurantId.toString() !== req.user.restaurantId.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden – not your restaurant' });
    }

    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
