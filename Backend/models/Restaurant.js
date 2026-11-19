const mongoose = require('mongoose');

/**
 * Restaurant Schema
 * Managed by Super Admin.
 * Stores brand theme (colors, typography, card styles) and
 * all 12 UI/feature toggles that dynamically control the Next.js storefront.
 */
const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ─── Theme Configuration ───────────────────────────────────────────────
    theme: {
      // Backend field: theme.primaryColor
      // Effect: Sets brand colors for primary buttons, active category tabs, badges, highlights
      primaryColor: {
        type: String,
        default: '#FF6B35',
      },
      // Backend field: theme.accentColor
      // Effect: Accent color for highlights, hover borders, secondary elements
      accentColor: {
        type: String,
        default: '#FFC107',
      },
      // Backend field: theme.backgroundColor
      // Effect: Controls the main page canvas color
      backgroundColor: {
        type: String,
        default: '#FFFFFF',
      },
      // Backend field: theme.cardBgColor
      // Effect: Controls individual food card surface color
      cardBgColor: {
        type: String,
        default: '#F9F9F9',
      },
      // Backend field: theme.fontFamily
      // Effect: Switches between clean sans-serif or classic serif fonts
      fontFamily: {
        type: String,
        default: 'Inter, sans-serif',
      },
      // Backend field: theme.baseFontSize
      // Effect: Scales overall text size
      baseFontSize: {
        type: String,
        default: '16px',
      },
      // Backend field: theme.borderRadius
      // Effect: Adjusts button and food card corners (sharp=0px, rounded=8px, soft=16px)
      borderRadius: {
        type: String,
        default: '8px',
      },
    },

    // ─── Feature & UI Toggle Engine (12 toggles) ──────────────────────────
    features: {
      // Backend field: features.cardHoverEnlarge
      // Effect: If true, hovering enlarges food card (scale 1.03) with accent border; if false, static
      cardHoverEnlarge: {
        type: Boolean,
        default: true,
      },
      // Backend field: features.enableCartHover
      // Effect: If true, hovering cart icon reveals live mini-cart summary; if false, click to open drawer
      enableCartHover: {
        type: Boolean,
        default: true,
      },
      // Backend field: features.stickyCategoryBar
      // Effect: If true, pins the menu category bar to top while scrolling; if false, scrolls with page
      stickyCategoryBar: {
        type: Boolean,
        default: true,
      },
      // Backend field: features.showPromoBanner
      // Effect: If true, displays top promotional banner and discount headline; if false, hides completely
      showPromoBanner: {
        type: Boolean,
        default: true,
      },
      // Backend field: features.enableSearchFilter
      // Effect: If true, shows instant menu search input and dietary filter tags (Spicy, Popular, etc.)
      enableSearchFilter: {
        type: Boolean,
        default: true,
      },
      // Backend field: features.enableReviews
      // Effect: If true, displays star ratings and customer review snippets on food cards and detail modals
      enableReviews: {
        type: Boolean,
        default: true,
      },
      // Backend field: features.showDeliveryTime
      // Effect: If true, displays estimated delivery time badge in restaurant header
      showDeliveryTime: {
        type: Boolean,
        default: true,
      },
      // Backend field: features.enableMockCardPayment
      // Effect: If true, offers COD + Simulated Card checkout; if false, COD only
      enableMockCardPayment: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
