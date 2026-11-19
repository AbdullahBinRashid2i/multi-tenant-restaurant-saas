'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { API_BASE_URL } from '../../../lib/api';
import getSocket from '../../../lib/socket';
import { useAuth } from '../../../context/AuthContext';
import {
  Utensils,
  Clock,
  Search,
  ShoppingBag,
  Star,
  Plus,
  Minus,
  X,
  CreditCard,
  Banknote,
  Sparkles,
  Tag,
  Check,
  AlertCircle,
  ChevronRight,
  Flame,
  ArrowRight,
  CheckCircle2,
  User,
  LogIn,
  LogOut,
  Sliders,
} from 'lucide-react';

export default function RestaurantStorefrontPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, logout, isCustomer, isRestaurantAdmin } = useAuth();

  // Tenant Configuration & Data State
  const [tenant, setTenant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const cartHoverTimeout = useRef(null);

  // Item Customizer Modal State
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [itemQuantity, setItemQuantity] = useState(1);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    paymentMethod: 'COD', // 'COD' | 'CARD'
    cardNumber: '4242 •••• •••• 4242',
    cardExp: '12/28',
    cardCvc: '123',
  });

  // Auto-fill checkout fields if customer is logged in
  useEffect(() => {
    if (user?.name) {
      setCheckoutForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Fetch Tenant Configuration on Load
  const fetchTenantData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/storefront/${slug}`);
      const restaurantData = res.data?.data;
      if (!restaurantData) {
        setError('Restaurant not found');
        return;
      }
      setTenant(restaurantData);

      // Fetch Categories & Menu Items
      const [catRes, itemRes] = await Promise.all([
        api.get(`/categories?restaurantId=${restaurantData._id}`),
        api.get(`/menu-items?restaurantId=${restaurantData._id}`),
      ]);
      setCategories(catRes.data?.data || []);
      setMenuItems(itemRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurant storefront');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchTenantData();
    }
  }, [slug]);

  // Socket.io: Real-Time In-Stock Updates
  useEffect(() => {
    if (!tenant?._id) return;

    const socket = getSocket();
    if (!socket) return;

    // Join restaurant room for real-time stock updates
    socket.emit('joinRestaurant', tenant._id);

    const handleStockUpdated = ({ menuItemId, inStock }) => {
      setMenuItems((prev) =>
        prev.map((item) => (item._id === menuItemId ? { ...item, inStock } : item))
      );
    };

    socket.on('stockUpdated', handleStockUpdated);

    return () => {
      socket.emit('leaveRestaurant', tenant._id);
      socket.off('stockUpdated', handleStockUpdated);
    };
  }, [tenant?._id]);

  // Extract Theme & Features (Dynamic Toggle Engine)
  const theme = tenant?.theme || {
    primaryColor: '#FF6B35',
    accentColor: '#FFC107',
    backgroundColor: '#FFFFFF',
    cardBgColor: '#F9F9F9',
    fontFamily: 'Inter, sans-serif',
    baseFontSize: '16px',
    borderRadius: '8px',
  };

  const features = tenant?.features || {
    cardHoverEnlarge: true,
    enableCartHover: true,
    stickyCategoryBar: true,
    showPromoBanner: true,
    enableSearchFilter: true,
    enableReviews: true,
    showDeliveryTime: true,
    enableMockCardPayment: true,
  };

  // Open Customizer Modal for food item
  const openCustomizer = (item) => {
    if (!item.inStock) return;
    setCustomizingItem(item);
    setItemQuantity(1);
    setSelectedVariant(item.sizeVariants?.[0] || null);
    setSelectedAddons([]);
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!customizingItem) return;

    const basePrice = selectedVariant ? selectedVariant.price : customizingItem.price;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
    const unitPrice = basePrice + addonsTotal;
    const lineTotal = unitPrice * itemQuantity;

    const cartItem = {
      menuItemId: customizingItem._id,
      name: customizingItem.name,
      price: unitPrice,
      quantity: itemQuantity,
      selectedSize: selectedVariant ? selectedVariant.size : '',
      selectedAddons: [...selectedAddons],
      subtotal: lineTotal,
      image: customizingItem.image,
    };

    setCart((prev) => [...prev, cartItem]);
    setCustomizingItem(null);
  };

  // Cart operations
  const updateCartItemQuantity = (index, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      updated[index].subtotal = updated[index].price * newQty;
      return updated;
    });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Cart Hover Preview Handlers (features.enableCartHover)
  const handleCartMouseEnter = () => {
    if (features.enableCartHover) {
      if (cartHoverTimeout.current) clearTimeout(cartHoverTimeout.current);
      setIsCartHovered(true);
    }
  };

  const handleCartMouseLeave = () => {
    if (features.enableCartHover) {
      cartHoverTimeout.current = setTimeout(() => {
        setIsCartHovered(false);
      }, 300);
    }
  };

  // Checkout Submission (POST /api/orders)
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setCheckoutSubmitting(true);
    try {
      const payload = {
        customerInfo: {
          name: checkoutForm.name,
          phone: checkoutForm.phone,
          address: checkoutForm.address,
        },
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          name: c.name,
          price: c.price,
          quantity: c.quantity,
          selectedSize: c.selectedSize,
          selectedAddons: c.selectedAddons,
          subtotal: c.subtotal,
        })),
        totalAmount: cartSubtotal,
        paymentMethod: checkoutForm.paymentMethod,
        restaurantId: tenant._id,
        notes: checkoutForm.notes,
      };

      const res = await api.post('/orders', payload);
      const createdOrder = res.data?.data;

      // Clear cart
      setCart([]);
      setIsCheckoutOpen(false);

      // Redirect to real-time order tracking page
      router.push(`/restaurant/${slug}/order/${createdOrder._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  // Collect all available tags across all menu items
  const allTags = Array.from(
    new Set(menuItems.flatMap((item) => item.tags || []))
  );

  // Filter Menu Items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      (item.categoryId?._id || item.categoryId) === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !selectedTag || (item.tags && item.tags.includes(selectedTag));
    return matchesCategory && matchesSearch && matchesTag;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading restaurant experience...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold">Restaurant Unavailable</h2>
          <p className="text-sm text-slate-400">{error || 'This storefront could not be located.'}</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition"
          >
            Return to Platform Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-slate-900 flex flex-col selection:bg-orange-500 selection:text-white"
      style={{
        backgroundColor: theme.backgroundColor || '#FFFFFF',
        fontFamily: theme.fontFamily || 'Inter, sans-serif',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 0. RESTAURANT ADMIN MANAGEMENT BAR (When Logged In as Store Admin)   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {user && (user.role === 'RESTAURANT' || user.role === 'SUPERADMIN') && (
        <div className="bg-slate-900 text-white text-xs py-2 px-4 sm:px-6 lg:px-8 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Utensils className="w-3 h-3 text-amber-400" />
              {user.role === 'SUPERADMIN' ? 'Platform Super Admin' : 'Store Admin Active'}
            </span>
            <span className="text-slate-300 hidden sm:inline">
              Viewing <strong>{tenant.name}</strong> storefront • Management Shortcuts:
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <Link
              href="/admin/restaurant/menu"
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition flex items-center gap-1 shadow-sm"
            >
              <span>+ Add / Manage Menu Items</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              href="/admin/restaurant"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition flex items-center gap-1 border border-slate-700"
            >
              <span>Live Kitchen Board</span>
            </Link>
            {user.role === 'SUPERADMIN' && (
              <Link
                href={`/admin/super/restaurants/${tenant._id}`}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-orange-400 font-semibold rounded-lg transition flex items-center gap-1 border border-slate-700"
              >
                <Sliders className="w-3 h-3" />
                <span>Edit Theme & Toggles</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. MODULE: PROMOTIONAL HERO BANNER (features.showPromoBanner)        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {features.showPromoBanner && (
        <div
          className="text-white text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 transition"
          style={{ backgroundColor: theme.primaryColor || '#FF6B35' }}
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>🔥 SPECIAL PROMO: Enjoy 20% OFF your first delivery order! Free delivery on orders over $25.</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* RESTAURANT HEADER (Storefront Brand Nav)                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-extrabold text-xl shadow-md"
              style={{
                backgroundColor: theme.primaryColor,
                borderRadius: theme.borderRadius,
              }}
            >
              {tenant.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl text-slate-900 tracking-tight">
                  {tenant.name}
                </h1>
                {/* 2. MODULE: DELIVERY TIME ESTIMATE (features.showDeliveryTime) */}
                {features.showDeliveryTime && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm"
                    style={{
                      backgroundColor: theme.accentColor || '#FFC107',
                      color: '#1a1a1a',
                      borderRadius: theme.borderRadius,
                    }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>25-35 min</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {tenant.description || 'Welcome to our online storefront'}
              </p>
            </div>
          </div>

          {/* Right Header Navigation: Customer Auth & Cart */}
          <div className="flex items-center gap-3">
            {/* Customer Account / Sign In Controls */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="font-bold text-slate-800 leading-tight text-xs">{user.name}</span>
                    <span className="text-[10px] text-slate-500">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/login?redirect=/restaurant/${slug}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Sign In / Register</span>
                  <span className="sm:hidden">Sign In</span>
                </Link>
                <Link
                  href="/login"
                  className="hidden md:inline text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
                >
                  Staff Portal
                </Link>
              </div>
            )}

            {/* Cart Button with Hover Preview & Click Drawer */}
            <div
              className="relative"
              onMouseEnter={handleCartMouseEnter}
              onMouseLeave={handleCartMouseLeave}
            >
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-white font-bold text-sm shadow-md transition transform active:scale-95"
                style={{
                  backgroundColor: theme.primaryColor,
                  borderRadius: theme.borderRadius,
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Cart</span>
                <span className="w-5 h-5 rounded-full bg-white text-slate-900 text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
                {cartSubtotal > 0 && (
                  <span className="font-mono text-xs pl-1 border-l border-white/30">
                    ${cartSubtotal.toFixed(2)}
                  </span>
                )}
              </button>

              {/* 3. UI TOGGLE: CART BUTTON HOVER PREVIEW (features.enableCartHover) */}
              {features.enableCartHover && isCartHovered && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200/90 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
                  style={{ borderRadius: theme.borderRadius }}
                >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">
                    Mini-Cart ({cartCount} items)
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded">
                    Hover Preview
                  </span>
                </div>

                {cart.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Your cart is empty.</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto my-2">
                    {cart.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-start justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.quantity}x {item.name}
                          </p>
                          {item.selectedSize && (
                            <p className="text-[10px] text-slate-500">Size: {item.selectedSize}</p>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-800">
                          ${item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span>Subtotal:</span>
                  <span className="font-mono">${cartSubtotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => {
                    setIsCartHovered(false);
                    setIsCartOpen(true);
                  }}
                  className="w-full mt-3 py-2 text-white text-xs font-bold shadow transition"
                  style={{
                    backgroundColor: theme.primaryColor,
                    borderRadius: theme.borderRadius,
                  }}
                >
                  View Full Cart & Checkout
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full">
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* 4. MODULE: LIVE SEARCH & DIETARY FILTERS (features.enableSearchFilter)*/}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {features.enableSearchFilter && (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food items by name, ingredients, or taste..."
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                style={{ borderRadius: theme.borderRadius }}
              />
            </div>

            {allTags.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0">
                  Filters:
                </span>
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    selectedTag === ''
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Tags
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
                      selectedTag === tag
                        ? 'text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    style={{
                      backgroundColor: selectedTag === tag ? theme.primaryColor : undefined,
                    }}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* 5. UI TOGGLE: STICKY CATEGORY BAR (features.stickyCategoryBar)      */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div
          className={`py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all ${
            features.stickyCategoryBar ? 'sticky top-20 z-30 shadow-sm' : ''
          }`}
        >
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 font-bold whitespace-nowrap transition shadow-sm ${
                selectedCategory === 'ALL'
                  ? 'text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              style={{
                backgroundColor: selectedCategory === 'ALL' ? theme.primaryColor : undefined,
                borderRadius: theme.borderRadius,
              }}
            >
              All Items ({menuItems.length})
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat._id;
              const count = menuItems.filter(
                (m) => (m.categoryId?._id || m.categoryId) === cat._id
              ).length;
              return (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-4 py-2 font-bold whitespace-nowrap transition shadow-sm ${
                    isSelected
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  style={{
                    backgroundColor: isSelected ? theme.primaryColor : undefined,
                    borderRadius: theme.borderRadius,
                  }}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* MENU ITEMS GRID (with cardHoverEnlarge, reviews, live stock)       */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {filteredItems.length === 0 ? (
          <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl flex flex-col items-center">
            <Utensils className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-base font-bold text-slate-800">No Food Items Found</p>
            <p className="text-xs text-slate-500 mt-1">Try selecting another category or clear filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const imageUrl = item.image
                ? item.image.startsWith('http')
                  ? item.image
                  : `${API_BASE_URL}${item.image}`
                : null;

              // 6. UI TOGGLE: FOOD CARD HOVER ENLARGE (features.cardHoverEnlarge)
              // If true, scale(1.03) smoothly with accent border; if false, static
              const hoverStyle = features.cardHoverEnlarge
                ? 'transition-transform duration-200 hover:scale-[1.03] hover:shadow-xl cursor-pointer'
                : 'shadow-md';

              return (
                <div
                  key={item._id}
                  onClick={() => openCustomizer(item)}
                  className={`p-5 border flex flex-col justify-between ${hoverStyle}`}
                  style={{
                    backgroundColor: theme.cardBgColor || '#FFFFFF',
                    borderRadius: theme.borderRadius || '8px',
                    borderColor: features.cardHoverEnlarge ? undefined : '#e2e8f0',
                    fontSize: theme.baseFontSize || '16px',
                  }}
                >
                  <div>
                    {/* Item Image */}
                    {imageUrl ? (
                      <div
                        className="w-full h-44 overflow-hidden mb-3 bg-slate-100 relative"
                        style={{ borderRadius: theme.borderRadius }}
                      >
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {!item.inStock && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-xs font-extrabold text-white bg-red-600 px-3 py-1 rounded-full uppercase tracking-wider">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="w-full h-28 bg-gradient-to-tr from-slate-100 to-slate-200 mb-3 flex items-center justify-center text-slate-400 text-xs font-semibold relative"
                        style={{ borderRadius: theme.borderRadius }}
                      >
                        <span>🍽️ Freshly Prepared</span>
                        {!item.inStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-xs font-extrabold text-white bg-red-600 px-3 py-1 rounded-full uppercase">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Name & Price */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                        {item.name}
                      </h3>
                      <span
                        className="font-extrabold text-base font-mono shrink-0"
                        style={{ color: theme.primaryColor }}
                      >
                        ${item.price?.toFixed(2)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* 7. MODULE: ITEM RATINGS & REVIEWS (features.enableReviews) */}
                    {features.enableReviews && (
                      <div className="flex items-center gap-1.5 mt-2.5 text-xs text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{item.rating || 4.8}</span>
                        <span className="text-slate-400 font-normal">
                          ({item.reviewCount || 42} reviews)
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {item.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        item.inStock ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      ● {item.inStock ? 'Available' : 'Out of Stock'}
                    </span>

                    <button
                      type="button"
                      disabled={!item.inStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        openCustomizer(item);
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: theme.primaryColor,
                        borderRadius: theme.borderRadius,
                      }}
                    >
                      {item.inStock ? '+ Add to Cart' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ITEM CUSTOMIZATION MODAL (Size variants, Add-on modifiers)          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-white border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: theme.borderRadius }}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Customize {customizingItem.name}
                </h3>
                <p className="text-xs text-slate-500">{customizingItem.description}</p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Size Variants Selection */}
            {customizingItem.sizeVariants?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Size Variant
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {customizingItem.sizeVariants.map((variant, idx) => {
                    const isSelected = selectedVariant?.size === variant.size;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-3 border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'border-2 text-slate-900 bg-orange-50/50'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        style={{
                          borderRadius: theme.borderRadius,
                          borderColor: isSelected ? theme.primaryColor : undefined,
                        }}
                      >
                        <span className="font-bold text-xs">{variant.size}</span>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          ${variant.price?.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add-on Modifiers Selection */}
            {customizingItem.addons?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Optional Add-on Modifiers
                </span>
                <div className="space-y-2">
                  {customizingItem.addons.map((addon, idx) => {
                    const isChecked = selectedAddons.some((a) => a.name === addon.name);
                    return (
                      <label
                        key={idx}
                        className={`p-2.5 border cursor-pointer flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-orange-50/40 border-slate-400'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                        style={{ borderRadius: theme.borderRadius }}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAddons([...selectedAddons, addon]);
                              } else {
                                setSelectedAddons(
                                  selectedAddons.filter((a) => a.name !== addon.name)
                                );
                              }
                            }}
                            className="w-4 h-4 text-orange-500 rounded"
                          />
                          <span className="text-xs font-semibold text-slate-800">{addon.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-600">
                          +${addon.price?.toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Add Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <div
                className="flex items-center border border-slate-200 bg-slate-50 p-1"
                style={{ borderRadius: theme.borderRadius }}
              >
                <button
                  type="button"
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  className="p-1.5 hover:bg-white rounded text-slate-600"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 font-bold text-sm text-slate-900">{itemQuantity}</span>
                <button
                  type="button"
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  className="p-1.5 hover:bg-white rounded text-slate-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 px-4 text-white text-xs font-bold shadow-md transition flex items-center justify-between"
                style={{
                  backgroundColor: theme.primaryColor,
                  borderRadius: theme.borderRadius,
                }}
              >
                <span>Add to Cart</span>
                <span className="font-mono text-sm">
                  $
                  {(
                    ((selectedVariant ? selectedVariant.price : customizingItem.price) +
                      selectedAddons.reduce((s, a) => s + (a.price || 0), 0)) *
                    itemQuantity
                  ).toFixed(2)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CART DRAWER (Slide-Over Panel)                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-slate-700" />
                <h3 className="font-extrabold text-lg text-slate-900">Your Basket</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600">
                  {cartCount}
                </span>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-100 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400 space-y-2">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700">Your cart is empty</p>
                  <p className="text-xs">Browse menu items and add them to your order.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="pt-4 first:pt-0 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-900">{item.name}</p>
                      {item.selectedSize && (
                        <p className="text-xs text-slate-500">Size: {item.selectedSize}</p>
                      )}
                      {item.selectedAddons?.length > 0 && (
                        <p className="text-xs text-slate-500">
                          Add-ons: {item.selectedAddons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      <p
                        className="font-mono font-bold text-xs mt-1"
                        style={{ color: theme.primaryColor }}
                      >
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="font-mono font-extrabold text-sm text-slate-900">
                        ${item.subtotal.toFixed(2)}
                      </span>

                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                        <button
                          onClick={() => updateCartItemQuantity(idx, -1)}
                          className="p-1 hover:bg-white rounded text-slate-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(idx, 1)}
                          className="p-1 hover:bg-white rounded text-slate-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer & Checkout Button */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Delivery:</span>
                    <span className="font-mono text-emerald-600 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total:</span>
                    <span className="font-mono" style={{ color: theme.primaryColor }}>
                      ${cartSubtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: theme.primaryColor,
                    borderRadius: theme.borderRadius,
                  }}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. CHECKOUT: SIMULATED COD & MOCK CARD (enableMockCardPayment)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-white border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 my-8"
            style={{ borderRadius: theme.borderRadius }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-xl text-slate-900">Simulated Checkout</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {user ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Ordering as <strong>{user.name}</strong> ({user.email})</span>
                </div>
                <span className="text-[10px] bg-emerald-200/60 font-semibold px-2 py-0.5 rounded">Auto-filled</span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Ordering as Guest.</span>
                </div>
                <Link
                  href={`/login?redirect=/restaurant/${slug}`}
                  className="text-amber-900 font-bold underline hover:text-amber-950 text-xs"
                >
                  Sign In / Register
                </Link>
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={checkoutForm.name}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={checkoutForm.phone}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                  placeholder="e.g. +1 555-019-2834"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  rows="2"
                  required
                  value={checkoutForm.address}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                  placeholder="Street address, Apartment / Suite number, City..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Notes / Kitchen Instructions
                </label>
                <input
                  type="text"
                  value={checkoutForm.notes}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                  placeholder="e.g. Please ring doorbell twice"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>

              {/* Payment Method Selector (features.enableMockCardPayment toggle) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Payment Method
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* COD (always available) */}
                  <label
                    onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: 'COD' })}
                    className={`p-3 border rounded-xl cursor-pointer flex items-center gap-3 transition ${
                      checkoutForm.paymentMethod === 'COD'
                        ? 'border-2 bg-orange-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    style={{
                      borderColor:
                        checkoutForm.paymentMethod === 'COD' ? theme.primaryColor : undefined,
                    }}
                  >
                    <Banknote className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold text-xs text-slate-900">Cash on Delivery</p>
                      <p className="text-[10px] text-slate-500">Pay cash upon arrival</p>
                    </div>
                  </label>

                  {/* Mock Card Payment (controlled by features.enableMockCardPayment) */}
                  {features.enableMockCardPayment && (
                    <label
                      onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: 'CARD' })}
                      className={`p-3 border rounded-xl cursor-pointer flex items-center gap-3 transition ${
                        checkoutForm.paymentMethod === 'CARD'
                          ? 'border-2 bg-orange-50/50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      style={{
                        borderColor:
                          checkoutForm.paymentMethod === 'CARD' ? theme.primaryColor : undefined,
                      }}
                    >
                      <CreditCard className="w-5 h-5 text-blue-500 shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-slate-900">Simulated Card</p>
                        <p className="text-[10px] text-slate-500">Instant mock payment</p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Simulated Card Fields (if CARD selected) */}
                {checkoutForm.paymentMethod === 'CARD' && features.enableMockCardPayment && (
                  <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2 mt-2">
                    <p className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Simulated Credit Card Authorization
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={checkoutForm.cardNumber}
                          onChange={(e) =>
                            setCheckoutForm({ ...checkoutForm, cardNumber: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={checkoutForm.cardExp}
                          onChange={(e) =>
                            setCheckoutForm({ ...checkoutForm, cardExp: e.target.value })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total & Submit */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Order Total Amount:</p>
                  <p className="text-xl font-extrabold font-mono" style={{ color: theme.primaryColor }}>
                    ${cartSubtotal.toFixed(2)}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={checkoutSubmitting}
                  className="px-6 py-3 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                  style={{
                    backgroundColor: theme.primaryColor,
                    borderRadius: theme.borderRadius,
                  }}
                >
                  {checkoutSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Place Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
