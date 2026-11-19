const mongoose = require('mongoose');

/**
 * MenuItem Schema
 * Managed by Restaurant Admin.
 * Products displayed on the public storefront.
 * Supports optional add-ons (modifiers) and size variants.
 */

// Sub-schema for add-on modifiers (e.g., Extra Cheese, Extra Sauce)
const addonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Sub-schema for size variants (e.g., Small, Medium, Large)
const sizeVariantSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    // Stored as a local file path (uploaded via Multer)
    image: {
      type: String,
      default: '',
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant reference is required'],
    },
    // Real-time In Stock / Out of Stock toggle
    // Immediately updates the public storefront when changed
    inStock: {
      type: Boolean,
      default: true,
    },
    // Optional dietary/filter tags (e.g., 'Spicy', 'Popular', 'Vegan')
    tags: {
      type: [String],
      default: [],
    },
    // Optional add-on modifiers (e.g., Extra Cheese +$1.00)
    addons: {
      type: [addonSchema],
      default: [],
    },
    // Optional size variants (e.g., Large +$2.00)
    sizeVariants: {
      type: [sizeVariantSchema],
      default: [],
    },
    // Average star rating (populated from reviews if features.enableReviews = true)
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient storefront queries
menuItemSchema.index({ restaurantId: 1, categoryId: 1 });
menuItemSchema.index({ restaurantId: 1, inStock: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
