'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store,
  Paintbrush,
  Sliders,
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Star,
  Clock,
  CreditCard,
  Search,
  Eye,
} from 'lucide-react';
import api from '../../../../../lib/api';

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('theme'); // 'theme' | 'features' | 'admins'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Editable theme state
  const [theme, setTheme] = useState({
    primaryColor: '#FF6B35',
    accentColor: '#FFC107',
    backgroundColor: '#FFFFFF',
    cardBgColor: '#F9F9F9',
    fontFamily: 'Inter, sans-serif',
    baseFontSize: '16px',
    borderRadius: '8px',
  });

  // Editable feature toggle state (12 switches)
  const [features, setFeatures] = useState({
    cardHoverEnlarge: true,
    enableCartHover: true,
    stickyCategoryBar: true,
    showPromoBanner: true,
    enableSearchFilter: true,
    enableReviews: true,
    showDeliveryTime: true,
    enableMockCardPayment: true,
  });

  // Admin users state
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [adminLoading, setAdminLoading] = useState(false);

  const fetchRestaurant = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/restaurants/${id}`);
      const data = res.data?.data;
      if (data) {
        setRestaurant(data);
        if (data.theme) setTheme({ ...data.theme });
        if (data.features) setFeatures({ ...data.features });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get(`/users?restaurantId=${id}`);
      setAdmins(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRestaurant();
      fetchAdmins();
    }
  }, [id]);

  // Save Theme (calls PATCH /api/restaurants/:id/theme)
  const handleSaveTheme = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/restaurants/${id}/theme`, theme);
      setSuccess('Theme updated successfully! Changes will reflect immediately on the storefront.');
      if (restaurant) setRestaurant({ ...restaurant, theme: res.data?.data || theme });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  // Save Features (calls PATCH /api/restaurants/:id/features)
  const handleSaveFeatures = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/restaurants/${id}/features`, features);
      setSuccess('Feature toggles updated successfully! Next.js storefront will sync on reload.');
      if (restaurant) setRestaurant({ ...restaurant, features: res.data?.data || features });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  // Create Restaurant Admin user
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setError('');
    try {
      await api.post('/users', {
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password,
        restaurantId: id,
      });
      setSuccess(`Admin account for ${newAdmin.name} created!`);
      setNewAdmin({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setAdminLoading(false);
    }
  };

  const toggleFeature = (key) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllFeatures = (val) => {
    setFeatures({
      cardHoverEnlarge: val,
      enableCartHover: val,
      stickyCategoryBar: val,
      showPromoBanner: val,
      enableSearchFilter: val,
      enableReviews: val,
      showDeliveryTime: val,
      enableMockCardPayment: val,
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading restaurant configuration...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Restaurant Not Found</h3>
        <Link
          href="/admin/super"
          className="mt-4 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/super"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white">{restaurant.name}</h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  restaurant.isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {restaurant.isActive ? 'Active Store' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              URL: /restaurant/{restaurant.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/restaurant/${restaurant.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <Eye className="w-4 h-4 text-orange-400" />
            <span>Open Public Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition ${
            activeTab === 'theme'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Paintbrush className="w-4 h-4" />
          <span>Live Theme Customizer</span>
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition ${
            activeTab === 'features'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>12-Switch Feature & UI Toggle Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition ${
            activeTab === 'admins'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Branch Admins ({admins.length})</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: LIVE THEME CUSTOMIZER                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'theme' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Brand Visual Theme</h3>
                <p className="text-xs text-slate-400">
                  Customizes colors, typography, and card shapes for this restaurant
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveTheme}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-500/25 transition disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Theme</span>
              </button>
            </div>

            {/* Colors Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                1. Palette Colors
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Primary Color */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">theme.primaryColor</span>
                    <span className="text-[11px] font-mono text-slate-400">{theme.primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Used for primary buttons, active category tabs, badges, and accents.
                  </p>
                </div>

                {/* Accent Color */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">theme.accentColor</span>
                    <span className="text-[11px] font-mono text-slate-400">{theme.accentColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={theme.accentColor}
                      onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Used for card hover enlargement borders, discount highlights, ratings.
                  </p>
                </div>

                {/* Page Background */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">theme.backgroundColor</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {theme.backgroundColor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.backgroundColor}
                      onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={theme.backgroundColor}
                      onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Controls the main page canvas color of the storefront.
                  </p>
                </div>

                {/* Card Background */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">theme.cardBgColor</span>
                    <span className="text-[11px] font-mono text-slate-400">{theme.cardBgColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.cardBgColor}
                      onChange={(e) => setTheme({ ...theme, cardBgColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={theme.cardBgColor}
                      onChange={(e) => setTheme({ ...theme, cardBgColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Controls the surface color of individual food item cards.
                  </p>
                </div>
              </div>
            </div>

            {/* Typography & Shape Section */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                2. Typography & Corner Styles
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    theme.fontFamily
                  </label>
                  <select
                    value={theme.fontFamily}
                    onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                  >
                    <optgroup label="Modern Sans-Serif">
                      <option value="Inter, sans-serif">Clean Sans (Inter)</option>
                      <option value="'Roboto', sans-serif">Crisp Neutral (Roboto)</option>
                      <option value="'Poppins', sans-serif">Modern Rounded (Poppins)</option>
                      <option value="'Montserrat', sans-serif">Geometric Bold (Montserrat)</option>
                      <option value="'Lato', sans-serif">Friendly Neutral (Lato)</option>
                    </optgroup>
                    <optgroup label="Classic & Luxury Serif">
                      <option value="'Playfair Display', serif">Editorial Luxury (Playfair Display)</option>
                      <option value="'Merriweather', serif">Warm Literary (Merriweather)</option>
                      <option value="'Cinzel', serif">Royal Classical (Cinzel)</option>
                    </optgroup>
                    <optgroup label="Display & Handwritten">
                      <option value="'Oswald', sans-serif">Punchy Condensed (Oswald)</option>
                      <option value="'Pacifico', cursive">Artisan Handwritten (Pacifico)</option>
                    </optgroup>
                    <optgroup label="System">
                      <option value="system-ui, sans-serif">System Native</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    theme.baseFontSize
                  </label>
                  <select
                    value={theme.baseFontSize}
                    onChange={(e) => setTheme({ ...theme, baseFontSize: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                  >
                    <option value="14px">Compact (14px)</option>
                    <option value="16px">Standard (16px)</option>
                    <option value="18px">Large (18px)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Edge Roundness
                    </label>
                    <span className="text-[11px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      {theme.borderRadius || '8px'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono text-slate-500">0px</span>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      step="1"
                      value={parseInt(theme.borderRadius, 10) || 0}
                      onChange={(e) => setTheme({ ...theme, borderRadius: `${e.target.value}px` })}
                      className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="text-[10px] font-mono text-slate-500">32px</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { label: 'Sharp', val: '0px' },
                      { label: 'Subtle', val: '6px' },
                      { label: 'Round', val: '12px' },
                      { label: 'Soft', val: '18px' },
                      { label: 'Pill', val: '26px' },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setTheme({ ...theme, borderRadius: preset.val })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition ${
                          theme.borderRadius === preset.val
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Preset Themes */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Quick Palette Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setTheme({
                      primaryColor: '#FF6B35',
                      accentColor: '#FFC107',
                      backgroundColor: '#FFFFFF',
                      cardBgColor: '#F9F9F9',
                      fontFamily: 'Inter, sans-serif',
                      baseFontSize: '16px',
                      borderRadius: '8px',
                    })
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium"
                >
                  Warm Flame (Default)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTheme({
                      primaryColor: '#059669',
                      accentColor: '#10B981',
                      backgroundColor: '#F0FDF4',
                      cardBgColor: '#FFFFFF',
                      fontFamily: 'Inter, sans-serif',
                      baseFontSize: '16px',
                      borderRadius: '16px',
                    })
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium"
                >
                  Fresh Greens
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTheme({
                      primaryColor: '#B91C1C',
                      accentColor: '#F59E0B',
                      backgroundColor: '#FEF2F2',
                      cardBgColor: '#FFFFFF',
                      fontFamily: "'Playfair Display', serif",
                      baseFontSize: '16px',
                      borderRadius: '0px',
                    })
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium"
                >
                  Classic Pizzeria (Serif & Sharp)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTheme({
                      primaryColor: '#6366F1',
                      accentColor: '#EC4899',
                      backgroundColor: '#0F172A',
                      cardBgColor: '#1E293B',
                      fontFamily: "'Poppins', sans-serif",
                      baseFontSize: '16px',
                      borderRadius: '16px',
                    })
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium"
                >
                  Midnight Neon (Dark)
                </button>
              </div>
            </div>
          </div>

          {/* Live Storefront Interactive Preview Column (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-24 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <h4 className="text-sm font-bold text-white">Live Storefront Preview</h4>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-semibold">
                Dynamic Engine
              </span>
            </div>

            {/* Simulated Storefront Card Canvas */}
            <div
              className="p-5 border transition-all duration-300 shadow-md text-slate-800"
              style={{
                backgroundColor: theme.backgroundColor,
                fontFamily: theme.fontFamily,
                borderRadius: theme.borderRadius,
              }}
            >
              {/* Simulated Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-4">
                <div>
                  <h5 className="font-bold text-base text-slate-900">{restaurant.name}</h5>
                  <p className="text-[11px] text-slate-500">Live Custom Theme Render</p>
                </div>
                {features.showDeliveryTime && (
                  <span
                    className="text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 text-white shadow-sm"
                    style={{
                      backgroundColor: theme.primaryColor,
                      borderRadius: theme.borderRadius,
                    }}
                  >
                    <Clock className="w-3 h-3" />
                    25-35 min
                  </span>
                )}
              </div>

              {/* Category Bar Simulation */}
              <div className="flex items-center gap-1.5 pb-3 overflow-x-auto text-xs">
                <span
                  className="px-3 py-1 font-semibold text-white shadow-sm cursor-pointer"
                  style={{
                    backgroundColor: theme.primaryColor,
                    borderRadius: theme.borderRadius,
                  }}
                >
                  All Items
                </span>
                <span
                  className="px-3 py-1 font-medium bg-slate-200/80 text-slate-700"
                  style={{ borderRadius: theme.borderRadius }}
                >
                  Burgers
                </span>
                <span
                  className="px-3 py-1 font-medium bg-slate-200/80 text-slate-700"
                  style={{ borderRadius: theme.borderRadius }}
                >
                  Drinks
                </span>
              </div>

              {/* Sample Food Item Card */}
              <div
                className={`p-4 border border-slate-200/80 transition-all duration-300 shadow-sm mt-3 ${
                  features.cardHoverEnlarge ? 'hover:scale-[1.03] cursor-pointer' : ''
                }`}
                style={{
                  backgroundColor: theme.cardBgColor,
                  borderRadius: theme.borderRadius,
                  fontSize: theme.baseFontSize,
                }}
              >
                <div className="w-full h-24 bg-gradient-to-r from-orange-200 to-amber-200 rounded-lg mb-3 flex items-center justify-center text-slate-700 text-xs font-semibold">
                  <span>🍔 Delicious Signature Dish</span>
                </div>

                <div className="flex items-start justify-between">
                  <h6 className="font-bold text-sm text-slate-900">Artisan Master Burger</h6>
                  <span className="font-extrabold text-sm text-slate-900">$12.99</span>
                </div>

                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  Double prime beef patty, caramelized onions, crisp lettuce & signature secret sauce.
                </p>

                {features.enableReviews && (
                  <div className="flex items-center gap-1 text-xs text-amber-500 mt-2 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>4.9 (128 reviews)</span>
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 font-bold">● In Stock</span>
                  <button
                    type="button"
                    className="px-3 py-1 text-xs font-semibold text-white shadow-sm transition"
                    style={{
                      backgroundColor: theme.primaryColor,
                      borderRadius: theme.borderRadius,
                    }}
                  >
                    + Add to Cart
                  </button>
                </div>
              </div>

              {/* Features Active Summary */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Font: {theme.fontFamily.split(',')[0]}</span>
                <span>Radius: {theme.borderRadius}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: 12-SWITCH FEATURE & UI TOGGLE CONTROL PANEL                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'features' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">12-Switch Feature & UI Toggle Engine</h3>
              <p className="text-xs text-slate-400">
                Turn on/off individual visual modules and interactive storefront behaviors in real time
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAllFeatures(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              >
                Enable All
              </button>
              <button
                type="button"
                onClick={() => toggleAllFeatures(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              >
                Disable All
              </button>

              <button
                type="button"
                onClick={handleSaveFeatures}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-500/25 transition disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Feature Toggles</span>
              </button>
            </div>
          </div>

          {/* The 12-Switch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. cardHoverEnlarge */}
            <div
              onClick={() => toggleFeature('cardHoverEnlarge')}
              className={`p-5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-4 ${
                features.cardHoverEnlarge
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">UI – Food Card Hover Enlarge</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    features.cardHoverEnlarge
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If true, hovering over a food card smoothly enlarges it (scale(1.03)) with an accent border; if false, cards stay static.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className={features.cardHoverEnlarge ? 'text-orange-400' : 'text-slate-500'}>
                    ● {features.cardHoverEnlarge ? 'Smooth Scale Active' : 'Static Cards'}
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 ${
                  features.cardHoverEnlarge ? 'bg-orange-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </div>
            </div>

            {/* 2. enableCartHover */}
            <div
              onClick={() => toggleFeature('enableCartHover')}
              className={`p-5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-4 ${
                features.enableCartHover
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">UI – Cart Button Hover Preview</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    features.enableCartHover
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If true, hovering over the cart icon reveals a live mini-cart summary; if false, users click to open the cart drawer.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className={features.enableCartHover ? 'text-orange-400' : 'text-slate-500'}>
                    ● {features.enableCartHover ? 'Hover Dropdown Preview' : 'Click to Open Drawer'}
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 ${
                  features.enableCartHover ? 'bg-orange-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </div>
            </div>

            {/* 3. stickyCategoryBar */}
            <div
              onClick={() => toggleFeature('stickyCategoryBar')}
              className={`p-5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-4 ${
                features.stickyCategoryBar
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">UI – Sticky Category Bar</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    features.stickyCategoryBar
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If true, pins the menu category bar to the top of the screen while scrolling; if false, it scrolls with the page.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className={features.stickyCategoryBar ? 'text-orange-400' : 'text-slate-500'}>
                    ● {features.stickyCategoryBar ? 'Pinned to Top' : 'Scrolls with Page'}
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 ${
                  features.stickyCategoryBar ? 'bg-orange-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </div>
            </div>

            {/* 4. showPromoBanner */}
            <div
              onClick={() => toggleFeature('showPromoBanner')}
              className={`p-5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-4 ${
                features.showPromoBanner
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Module – Promotional Hero Banner</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    features.showPromoBanner
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If true, displays the top promotional banner and discount headline; if false, hides it completely.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className={features.showPromoBanner ? 'text-orange-400' : 'text-slate-500'}>
                    ● {features.showPromoBanner ? 'Banner Visible' : 'Banner Hidden'}
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 ${
                  features.showPromoBanner ? 'bg-orange-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </div>
            </div>

            {/* 5. enableSearchFilter */}
            <div
              onClick={() => toggleFeature('enableSearchFilter')}
              className={`p-5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-4 ${
                features.enableSearchFilter
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Module – Live Search & Filters</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    features.enableSearchFilter
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If true, shows the instant menu search input and dietary filter tags (e.g., Spicy, Popular).
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className={features.enableSearchFilter ? 'text-orange-400' : 'text-slate-500'}>
                    ● {features.enableSearchFilter ? 'Search & Tags Active' : 'Search Hidden'}
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 ${
                  features.enableSearchFilter ? 'bg-orange-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </div>
            </div>

            {/* 6. enableReviews */}
            <div
              onClick={() => toggleFeature('enableReviews')}
              className={`p-5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-4 ${
                features.enableReviews
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Module – Item Ratings & Reviews</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    features.enableReviews
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If true, displays star ratings and customer review snippets on food cards and detail modals.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className={features.enableReviews ? 'text-orange-400' : 'text-slate-500'}>
                    ● {features.enableReviews ? 'Ratings Displayed' : 'Ratings Hidden'}
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 ${
                  features.enableReviews ? 'bg-orange-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </div>
            </div>

            {/* 7. showDeliveryTime */}
            <div
              onClick={() => toggleFeature('showDeliveryTime')}
              className={`p-5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-4 ${
                features.showDeliveryTime
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Module – Delivery Time Estimate</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    features.showDeliveryTime
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If true, displays the estimated delivery time badge in the restaurant header.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className={features.showDeliveryTime ? 'text-orange-400' : 'text-slate-500'}>
                    ● {features.showDeliveryTime ? 'Header ETA Badge Active' : 'ETA Hidden'}
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 ${
                  features.showDeliveryTime ? 'bg-orange-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </div>
            </div>

            {/* 8. enableMockCardPayment */}
            <div
              onClick={() => toggleFeature('enableMockCardPayment')}
              className={`p-5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-4 ${
                features.enableMockCardPayment
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Checkout – Mock Card Payment</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    features.enableMockCardPayment
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If true, offers both Cash on Delivery (COD) and Simulated Card checkout; if false, enables COD only.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className={features.enableMockCardPayment ? 'text-orange-400' : 'text-slate-500'}>
                    ● {features.enableMockCardPayment ? 'COD + Mock Card' : 'Cash on Delivery (COD) Only'}
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 ${
                  features.enableMockCardPayment ? 'bg-orange-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: RESTAURANT ADMINS                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Create New Admin Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <h3 className="text-base font-bold text-white">Create Restaurant Admin</h3>
            <p className="text-xs text-slate-400">
              Grant manager credentials for this restaurant branch
            </p>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="e.g. Marco Rossi"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="manager@restaurant.com"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50"
              >
                {adminLoading ? 'Creating...' : 'Create Admin Account'}
              </button>
            </form>
          </div>

          {/* Admin List (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Current Branch Staff ({admins.length})</h3>

            {admins.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No staff accounts have been created for this restaurant yet.
              </p>
            ) : (
              <div className="space-y-3">
                {admins.map((adm) => (
                  <div
                    key={adm._id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-xs text-white">{adm.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{adm.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">
                        {adm.role}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          adm.isActive ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                        title={adm.isActive ? 'Active' : 'Deactivated'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
