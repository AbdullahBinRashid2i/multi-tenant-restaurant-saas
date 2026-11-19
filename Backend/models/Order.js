const mongoose = require('mongoose');

/**
 * Order Schema
 * Live orders tracked across Customer, Restaurant Admin, and Delivery Rider via Socket.io.
 * Supports COD and mock card payment (controlled by features.enableMockCardPayment).
 */

// Sub-schema for each ordered item (snapshot of menu item at time of order)
const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  // Selected size variant (if any)
  selectedSize: {
    type: String,
    default: '',
  },
  // Selected add-ons (if any)
  selectedAddons: [
    {
      name: String,
      price: Number,
    },
  ],
  // Subtotal for this line item
  subtotal: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    // Customer contact info (no account required)
    customerInfo: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
      },
      phone: {
        type: String,
        required: [true, 'Customer phone is required'],
      },
      address: {
        type: String,
        required: [true, 'Delivery address is required'],
      },
      email: {
        type: String,
        default: '',
      },
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: 'Order must have at least one item',
      },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // COD = Cash on Delivery | CARD = Mock simulated card payment
    // CARD only available when features.enableMockCardPayment = true
    paymentMethod: {
      type: String,
      enum: ['COD', 'CARD'],
      default: 'COD',
    },

    // Payment collection tracking (e.g. COD collection or mock card settlement)
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },

    // ─── Order Status Lifecycle ────────────────────────────────────────────
    // PENDING     → Order placed by customer, awaiting restaurant confirmation
    // CONFIRMED   → Restaurant admin confirmed the order
    // PREPARING   → Kitchen is preparing the order
    // READY       → Ready for pickup by rider (triggers rider dashboard notification)
    // OUT_FOR_DELIVERY → Rider has picked up and is en route
    // DELIVERED   → Rider confirms delivery (COD collection confirmed if applicable)
    // CANCELLED   → Order was cancelled
    status: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PREPARING',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'PENDING',
    },

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant reference is required'],
    },

    // Assigned rider (null until a rider claims the order when status = READY)
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Special instructions from the customer
    notes: {
      type: String,
      default: '',
    },

    // Estimated delivery time in minutes (set by restaurant admin)
    estimatedDeliveryTime: {
      type: Number,
      default: 30,
    },

    // Timestamps for each status transition (for analytics and tracking)
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient order queries
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ riderId: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
