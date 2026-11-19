const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { protect, authorize } = require('../middleware/auth');

// ─── POST /api/orders ──────────────────────────────────────────────────────
// Public – customer places an order (no auth required)
router.post('/', async (req, res, next) => {
  try {
    const { customerInfo, items, totalAmount, paymentMethod, restaurantId, notes } = req.body;

    if (!customerInfo || !items || !totalAmount || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'customerInfo, items, totalAmount, and restaurantId are required',
      });
    }

    // Validate paymentMethod against restaurant's enableMockCardPayment toggle
    if (paymentMethod === 'CARD') {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant || !restaurant.features.enableMockCardPayment) {
        return res.status(400).json({
          success: false,
          message: 'Card payment is not enabled for this restaurant',
        });
      }
    }

    const isPaid = paymentMethod === 'CARD';
    const order = await Order.create({
      customerInfo,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      isPaid,
      paidAt: isPaid ? new Date() : null,
      restaurantId,
      notes: notes || '',
      statusHistory: [{ status: 'PENDING', timestamp: new Date() }],
    });

    // Emit real-time new order event to Restaurant Admin dashboard
    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant:${restaurantId}`).emit('newOrder', order);
    }

    res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/orders ───────────────────────────────────────────────────────
// RESTAURANT / RIDER: get orders for their restaurant (live order board / ready queue)
// SUPERADMIN: get all orders (with optional restaurantId filter)
router.get('/', protect, authorize('RESTAURANT', 'RIDER', 'SUPERADMIN'), async (req, res, next) => {
  try {
    const filter = {};
    const { status, restaurantId: qRestaurantId } = req.query;

    if (req.user.role === 'RESTAURANT' || req.user.role === 'RIDER') {
      filter.restaurantId = req.user.restaurantId;
    } else if (qRestaurantId) {
      filter.restaurantId = qRestaurantId;
    }

    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('riderId', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/orders/:id ───────────────────────────────────────────────────
// Public – customer tracks their order by ID
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('riderId', 'name phone')
      .populate('restaurantId', 'name slug theme features');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/orders/:id/status ─────────────────────────────────────────
// Update order status (RESTAURANT admin or RIDER depending on transition)
// Status lifecycle: PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
router.patch(
  '/:id/status',
  protect,
  authorize('RESTAURANT', 'RIDER', 'SUPERADMIN'),
  async (req, res, next) => {
    try {
      const { status } = req.body;

      const validStatuses = [
        'PENDING', 'CONFIRMED', 'PREPARING', 'READY',
        'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // RESTAURANT admin: can only update orders for their own restaurant
      if (
        req.user.role === 'RESTAURANT' &&
        (!req.user.restaurantId ||
          order.restaurantId.toString() !== req.user.restaurantId.toString())
      ) {
        return res.status(403).json({ success: false, message: 'Forbidden – not your restaurant' });
      }

      // RIDER: can only update status to OUT_FOR_DELIVERY or DELIVERED
      // and only for orders assigned to them
      if (req.user.role === 'RIDER') {
        if (!['OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
          return res.status(403).json({
            success: false,
            message: 'Riders can only update status to Out for Delivery or Delivered',
          });
        }
        if (order.riderId?.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden – this order is not assigned to you',
          });
        }
      }

      order.status = status;
      if (req.body.isPaid !== undefined) {
        order.isPaid = Boolean(req.body.isPaid);
        if (order.isPaid && !order.paidAt) {
          order.paidAt = new Date();
        }
      } else if (status === 'DELIVERED' && order.paymentMethod === 'COD') {
        // Rider confirms COD payment collection upon delivery
        order.isPaid = true;
        order.paidAt = new Date();
      }
      order.statusHistory.push({ status, timestamp: new Date(), updatedBy: req.user._id });
      await order.save();

      // Emit real-time status update
      const io = req.app.get('io');
      if (io) {
        // Notify restaurant admin board
        io.to(`restaurant:${order.restaurantId}`).emit('orderStatusUpdated', {
          orderId: order._id,
          status: order.status,
          restaurantId: order.restaurantId,
        });

        // Notify customer's order tracker
        io.to(`order:${order._id}`).emit('orderStatusUpdated', {
          orderId: order._id,
          status: order.status,
        });

        // If status is READY, notify rider dashboard
        if (status === 'READY') {
          io.to(`riders:${order.restaurantId}`).emit('orderReady', order);
        }
      }

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        data: { status: order.status, orderId: order._id },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── PATCH /api/orders/:id/assign-rider ───────────────────────────────────
// RIDER claims a READY order
router.patch(
  '/:id/assign-rider',
  protect,
  authorize('RIDER'),
  async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (order.status !== 'READY') {
        return res.status(400).json({
          success: false,
          message: 'Only READY orders can be claimed',
        });
      }

      if (order.riderId) {
        return res.status(409).json({
          success: false,
          message: 'Order already assigned to a rider',
        });
      }

      // Rider must belong to the same restaurant
      if (
        !req.user.restaurantId ||
        order.restaurantId.toString() !== req.user.restaurantId.toString()
      ) {
        return res.status(403).json({ success: false, message: 'Forbidden – not your restaurant' });
      }

      order.riderId = req.user._id;
      order.status = 'OUT_FOR_DELIVERY';
      order.statusHistory.push({
        status: 'OUT_FOR_DELIVERY',
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
      await order.save();

      // Emit real-time events
      const io = req.app.get('io');
      if (io) {
        io.to(`restaurant:${order.restaurantId}`).emit('orderStatusUpdated', {
          orderId: order._id,
          status: order.status,
          riderId: req.user._id,
        });
        io.to(`order:${order._id}`).emit('orderStatusUpdated', {
          orderId: order._id,
          status: order.status,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Order claimed – Out for Delivery',
        data: { orderId: order._id, status: order.status, riderId: order.riderId },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/orders/rider/my-orders ──────────────────────────────────────
// RIDER: get their active orders
router.get('/rider/my-orders', protect, authorize('RIDER'), async (req, res, next) => {
  try {
    const orders = await Order.find({
      riderId: req.user._id,
      status: { $in: ['OUT_FOR_DELIVERY', 'DELIVERED'] },
    })
      .populate('restaurantId', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
