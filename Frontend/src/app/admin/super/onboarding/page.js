'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store,
  Paintbrush,
  Sliders,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import api from '../../../../lib/api';

export default function OnboardRestaurantPage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Info & Admin, 2: Theme & Toggles
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Restaurant Basics
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');

  // 2. Initial Restaurant Admin User
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // 3. Theme Configuration (Section 3 Table)
  const [theme, setTheme] = useState({
    primaryColor: '#FF6B35',
    accentColor: '#FFC107',
    backgroundColor: '#FFFFFF',
    cardBgColor: '#F9F9F9',
    fontFamily: 'Inter, sans-serif',
    baseFontSize: '16px',
    borderRadius: '8px',
  });

  // 4. 12 Feature & UI Toggles (Section 3 Table)
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

  // Auto generate slug from name
  const handleNameChange = (val) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleToggle = (key) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create Restaurant
      const resPayload = {
        name,
        slug: slug.trim().toLowerCase(),
        description,
        logo,
        theme,
        features,
      };

      const restaurantRes = await api.post('/restaurants', resPayload);
      const createdRestaurant = restaurantRes.data?.data;

      // 2. Optionally create the initial Restaurant Admin user if provided
      if (adminEmail && adminPassword) {
        try {
          await api.post('/users', {
            name: adminName || `${name} Manager`,
            email: adminEmail,
            password: adminPassword,
            restaurantId: createdRestaurant._id,
          });
        } catch (adminErr) {
          console.error('Failed to create admin user:', adminErr);
          // Don't fail the whole onboarding if restaurant was created, but warn
        }
      }

      setSuccess(`Restaurant "${name}" successfully onboarded!`);
      setTimeout(() => {
        router.push(`/admin/super/restaurants/${createdRestaurant._id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to onboard restaurant');
      setLoading(false);
    }
  };

  const toggleDetails = [
    {
      key: 'cardHoverEnlarge',
      label: 'UI – Food Card Hover Enlarge',
      desc: 'Hovering over a food card smoothly enlarges it (scale(1.03)) with an accent border; if false, cards stay static.',
    },
    {
      key: 'enableCartHover',
      label: 'UI – Cart Button Hover Preview',
      desc: 'Hovering over the cart icon reveals a live mini-cart summary; if false, users click to open the cart drawer.',
    },
    {
      key: 'stickyCategoryBar',
      label: 'UI – Sticky Category Bar',
      desc: 'Pins the menu category bar to the top of the screen while scrolling; if false, it scrolls with the page.',
    },
    {
      key: 'showPromoBanner',
      label: 'Module – Promotional Hero Banner',
      desc: 'Displays the top promotional banner and discount headline; if false, hides it completely.',
    },
    {
      key: 'enableSearchFilter',
      label: 'Module – Live Search & Filters',
      desc: 'Shows the instant menu search input and dietary filter tags (e.g., Spicy, Popular).',
    },
    {
      key: 'enableReviews',
      label: 'Module – Item Ratings & Reviews',
      desc: 'Displays star ratings and customer review snippets on food cards and detail modals.',
    },
    {
      key: 'showDeliveryTime',
      label: 'Module – Delivery Time Estimate',
      desc: 'Displays the estimated delivery time badge in the restaurant header.',
    },
    {
      key: 'enableMockCardPayment',
      label: 'Checkout – Mock Card Payment',
      desc: 'Offers both Cash on Delivery (COD) and Simulated Card checkout; if false, enables COD only.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/super"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Restaurants</span>
        </Link>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Onboard New Restaurant</h2>
        <p className="text-sm text-slate-400 mt-1">
          Set up client profile, default brand theme, initial 12-switch UI feature toggles, and branch manager credentials.
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Storefront Profile */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">1. Restaurant Identity</h3>
              <p className="text-xs text-slate-400">Basic brand information and public URL slug</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Bella Italia Bistro"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                URL Slug (/restaurant/[slug]) *
              </label>
              <div className="flex items-center bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 focus-within:ring-2 focus-within:ring-orange-500">
                <span className="text-slate-500 text-xs font-mono select-none">/restaurant/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                  placeholder="bella-italia"
                  className="w-full py-2.5 pl-1 bg-transparent border-0 text-white placeholder-slate-500 text-sm font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Short Description / Slogan
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Authentic hand-tossed artisan pizzas and pasta since 1998"
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Section 2: Initial Restaurant Admin Account */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">2. Branch Manager Account</h3>
              <p className="text-xs text-slate-400">Login credentials for the restaurant owner to manage daily operations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Manager Name
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Marco Rossi"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Manager Email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. manager@bellaitalia.com"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Manager Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Brand Theme Customization */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">3. Initial Brand Theme</h3>
              <p className="text-xs text-slate-400">Colors, typography, and card radius (can be fine-tuned later)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Color
              </label>
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-xl p-2">
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-xl p-2">
                <input
                  type="color"
                  value={theme.accentColor}
                  onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={theme.accentColor}
                  onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                  className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Canvas Background
              </label>
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-xl p-2">
                <input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={theme.backgroundColor}
                  onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                  className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Card Background
              </label>
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-xl p-2">
                <input
                  type="color"
                  value={theme.cardBgColor}
                  onChange={(e) => setTheme({ ...theme, cardBgColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={theme.cardBgColor}
                  onChange={(e) => setTheme({ ...theme, cardBgColor: e.target.value })}
                  className="w-full bg-transparent text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Font Family
              </label>
              <select
                value={theme.fontFamily}
                onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Base Font Size
              </label>
              <select
                value={theme.baseFontSize}
                onChange={(e) => setTheme({ ...theme, baseFontSize: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none"
              >
                <option value="14px">Compact (14px)</option>
                <option value="16px">Standard (16px)</option>
                <option value="18px">Large (18px)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
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

        {/* Section 4: 12-Switch Feature & UI Toggle Engine */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">4. Feature & UI Toggle Engine</h3>
                <p className="text-xs text-slate-400">Enable or disable specific storefront modules and interactive behaviors</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFeatures({
                    cardHoverEnlarge: true,
                    enableCartHover: true,
                    stickyCategoryBar: true,
                    showPromoBanner: true,
                    enableSearchFilter: true,
                    enableReviews: true,
                    showDeliveryTime: true,
                    enableMockCardPayment: true,
                  })
                }
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                All On
              </button>
              <button
                type="button"
                onClick={() =>
                  setFeatures({
                    cardHoverEnlarge: false,
                    enableCartHover: false,
                    stickyCategoryBar: false,
                    showPromoBanner: false,
                    enableSearchFilter: false,
                    enableReviews: false,
                    showDeliveryTime: false,
                    enableMockCardPayment: false,
                  })
                }
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                All Off
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {toggleDetails.map((t) => (
              <div
                key={t.key}
                onClick={() => handleToggle(t.key)}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between gap-4 ${
                  features[t.key]
                    ? 'bg-orange-500/10 border-orange-500/30 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-200">{t.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      features.{t.key}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{t.desc}</p>
                </div>

                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition flex-shrink-0 ${
                    features[t.key] ? 'bg-orange-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/admin/super"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Onboarding Client...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Complete Onboarding</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
