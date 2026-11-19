const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Handles Authentication & RBAC.
 * restaurantId is null for Super Admins and links Admins/Riders to their restaurant.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries by default
    },
    // Role-Based Access Control
    // SUPERADMIN: Platform owner – manages restaurants, themes, toggles
    // RESTAURANT: Restaurant admin – manages menu, orders, riders
    // RIDER:      Delivery staff – manages delivery status updates
    // CUSTOMER:   Customer account
    role: {
      type: String,
      enum: ['SUPERADMIN', 'RESTAURANT', 'RIDER', 'CUSTOMER'],
      default: 'RESTAURANT',
    },
    // null for SUPERADMIN; references Restaurant for RESTAURANT and RIDER roles
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Rider-specific: phone number for delivery contact
    phone: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Hash password before saving ──────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: compare passwords ───────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
