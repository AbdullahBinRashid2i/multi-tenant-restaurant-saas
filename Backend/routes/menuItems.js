const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');

// ─── GET /api/menu-items ───────────────────────────────────────────────────
// Public – storefront fetches menu items by restaurantId (and optional categoryId)
router.get('/', async (req, res, next) => {
  try {
    const { restaurantId, categoryId, inStock } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurantId query param is required' });
    }

    const filter = { restaurantId, isActive: true };
    if (categoryId) filter.categoryId = categoryId;
    if (inStock !== undefined) filter.inStock = inStock === 'true';

    const items = await MenuItem.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/menu-items/:id ───────────────────────────────────────────────
// Public – single menu item detail
router.get('/:id', async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('categoryId', 'name');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/menu-items ──────────────────────────────────────────────────
// RESTAURANT admin creates a menu item with optional image upload
router.post(
  '/',
  protect,
  authorize('RESTAURANT', 'SUPERADMIN'),
  upload.single('image'),
  async (req, res, next) => {
    try {
      const restaurantId =
        req.user.role === 'SUPERADMIN' ? req.body.restaurantId : req.user.restaurantId;

      if (!restaurantId) {
        return res.status(400).json({ success: false, message: 'restaurantId is required' });
      }

      // Build the item data
      const itemData = { ...req.body, restaurantId };

      // If a file was uploaded, store the relative path
      if (req.file) {
        itemData.image = `/uploads/${req.file.filename}`;
      }

      // Parse JSON fields if sent as strings (multipart form)
      if (typeof itemData.addons === 'string') {
        try { itemData.addons = JSON.parse(itemData.addons); } catch { itemData.addons = []; }
      }
      if (typeof itemData.sizeVariants === 'string') {
        try { itemData.sizeVariants = JSON.parse(itemData.sizeVariants); } catch { itemData.sizeVariants = []; }
      }
      if (typeof itemData.tags === 'string') {
        try { itemData.tags = JSON.parse(itemData.tags); } catch { itemData.tags = []; }
      }

      const item = await MenuItem.create(itemData);
      res.status(201).json({ success: true, message: 'Menu item created', data: item });
    } catch (error) {
      next(error);
    }
  }
);

// ─── PUT /api/menu-items/:id ───────────────────────────────────────────────
// RESTAURANT admin updates a menu item
router.put(
  '/:id',
  protect,
  authorize('RESTAURANT', 'SUPERADMIN'),
  upload.single('image'),
  async (req, res, next) => {
    try {
      const item = await MenuItem.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
      }

      if (
        req.user.role === 'RESTAURANT' &&
        (!req.user.restaurantId ||
          item.restaurantId.toString() !== req.user.restaurantId.toString())
      ) {
        return res.status(403).json({ success: false, message: 'Forbidden – not your restaurant' });
      }

      const updateData = { ...req.body };

      if (req.file) {
        updateData.image = `/uploads/${req.file.filename}`;
      }

      // Parse JSON fields if sent as strings
      if (typeof updateData.addons === 'string') {
        try { updateData.addons = JSON.parse(updateData.addons); } catch { delete updateData.addons; }
      }
      if (typeof updateData.sizeVariants === 'string') {
        try { updateData.sizeVariants = JSON.parse(updateData.sizeVariants); } catch { delete updateData.sizeVariants; }
      }
      if (typeof updateData.tags === 'string') {
        try { updateData.tags = JSON.parse(updateData.tags); } catch { delete updateData.tags; }
      }

      const updated = await MenuItem.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      }).populate('categoryId', 'name');

      res.status(200).json({ success: true, message: 'Menu item updated', data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// ─── PATCH /api/menu-items/:id/stock ──────────────────────────────────────
// RESTAURANT admin toggles In Stock / Out of Stock
// This change must be broadcast via Socket.io to update the live storefront
router.patch('/:id/stock', protect, authorize('RESTAURANT', 'SUPERADMIN'), async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    if (
      req.user.role === 'RESTAURANT' &&
      (!req.user.restaurantId ||
        item.restaurantId.toString() !== req.user.restaurantId.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden – not your restaurant' });
    }

    item.inStock = !item.inStock;
    await item.save();

    // Emit real-time stock update to all clients viewing this restaurant
    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant:${item.restaurantId}`).emit('stockUpdated', {
        menuItemId: item._id,
        inStock: item.inStock,
        restaurantId: item.restaurantId,
      });
    }

    res.status(200).json({
      success: true,
      message: `Item marked as ${item.inStock ? 'In Stock' : 'Out of Stock'}`,
      data: { inStock: item.inStock },
    });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/menu-items/:id ────────────────────────────────────────────
// RESTAURANT admin soft-deletes a menu item
router.delete('/:id', protect, authorize('RESTAURANT', 'SUPERADMIN'), async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    if (
      req.user.role === 'RESTAURANT' &&
      (!req.user.restaurantId ||
        item.restaurantId.toString() !== req.user.restaurantId.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden – not your restaurant' });
    }

    await MenuItem.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
