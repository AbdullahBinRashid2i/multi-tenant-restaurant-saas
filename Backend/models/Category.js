const mongoose = require('mongoose');

/**
 * Category Schema
 * Managed by Restaurant Admin to organize menu sections.
 * Scoped to a specific restaurant via restaurantId.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant reference is required'],
    },
    // Controls display order of categories on the storefront
    sortOrder: {
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

// Compound index to ensure category name is unique per restaurant
categorySchema.index({ name: 1, restaurantId: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
