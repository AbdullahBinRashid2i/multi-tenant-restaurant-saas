const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

/**
 * Public storefront routes — no auth required.
 * The Next.js storefront fetches the TenantConfiguration from here.
 */

// ─── GET /api/storefront/:slug ─────────────────────────────────────────────
// Returns the full restaurant config (theme + features) for the storefront.
// The frontend dynamically applies all UI toggles from this response.
router.get('/:slug', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: req.params.slug.toLowerCase(),
      isActive: true,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found or is currently unavailable',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        logo: restaurant.logo,
        // TenantConfiguration: theme & feature toggles consumed by Next.js storefront
        theme: restaurant.theme,
        features: restaurant.features,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
