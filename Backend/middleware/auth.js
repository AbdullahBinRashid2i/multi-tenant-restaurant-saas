const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect middleware
 * Verifies the JWT Bearer token and attaches req.user to the request.
 * Required on all protected routes.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized – no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized – user no longer exists',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized – account is deactivated',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

/**
 * authorize middleware factory
 * Usage: authorize('SUPERADMIN')  or  authorize('RESTAURANT', 'SUPERADMIN')
 * Returns 403 if the authenticated user's role is not in the allowed list.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden – role '${req.user.role}' is not allowed to access this resource`,
      });
    }

    next();
  };
};

/**
 * sameRestaurant middleware
 * Ensures RESTAURANT admins and RIDERS can only access resources
 * that belong to their own restaurantId.
 * Must be used AFTER protect and authorize.
 *
 * Usage: router.get('/orders', protect, authorize('RESTAURANT'), sameRestaurant, handler)
 *
 * Checks req.params.restaurantId OR compares the resource's restaurantId
 * against req.user.restaurantId. SUPERADMIN bypasses this check.
 */
const sameRestaurant = (req, res, next) => {
  if (req.user.role === 'SUPERADMIN') return next();

  const targetRestaurantId =
    req.params.restaurantId || req.body.restaurantId || req.query.restaurantId;

  if (targetRestaurantId) {
    if (
      !req.user.restaurantId ||
      req.user.restaurantId.toString() !== targetRestaurantId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden – you can only access your own restaurant data',
      });
    }
  }

  next();
};

module.exports = { protect, authorize, sameRestaurant };
