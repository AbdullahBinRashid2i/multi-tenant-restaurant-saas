'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  PlusCircle,
  Search,
  ExternalLink,
  Sliders,
  Paintbrush,
  ToggleLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Users,
} from 'lucide-react';
import api from '../../../lib/api';

export default function SuperAdminDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/restaurants');
      setRestaurants(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await api.put(`/restaurants/${id}`, { isActive: !currentStatus });
      setRestaurants((prev) =>
        prev.map((r) => (r._id === id ? { ...r, isActive: !currentStatus } : r))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = restaurants.filter((r) => r.isActive).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Restaurant Tenants</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage onboarding, live theme styling, and 12-switch feature toggles across all client stores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRestaurants}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition disabled:opacity-50"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/admin/super/onboarding"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/25 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Onboard Restaurant</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Onboarded</p>
            <p className="text-3xl font-extrabold text-white mt-1">{restaurants.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Stores</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Feature Engines</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-1">12 Toggles</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Sliders className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter restaurants by name or slug..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        />
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Restaurant List / Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Fetching tenant restaurants...</p>
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 rounded-2xl border border-slate-800/80 flex flex-col items-center">
          <Store className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No Restaurants Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {search
              ? 'No restaurants match your search query.'
              : 'Get started by onboarding your first client restaurant to the platform.'}
          </p>
          {!search && (
            <Link
              href="/admin/super/onboarding"
              className="mt-5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition"
            >
              Onboard First Restaurant
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => {
            // Count active feature toggles
            const activeToggles = Object.values(restaurant.features || {}).filter(Boolean).length;
            const theme = restaurant.theme || {};

            return (
              <div
                key={restaurant._id}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between transition group shadow-xl"
              >
                <div>
                  {/* Top line: Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-orange-400 transition">
                        {restaurant.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        /restaurant/{restaurant.slug}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleActive(restaurant._id, restaurant.isActive)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition ${
                        restaurant.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                      title="Click to toggle active status"
                    >
                      {restaurant.isActive ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Inactive
                        </>
                      )}
                    </button>
                  </div>

                  {restaurant.description && (
                    <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                      {restaurant.description}
                    </p>
                  )}

                  {/* Brand Theme Palette Preview */}
                  <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>Brand Theme</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {theme.fontFamily?.split(',')[0]} • {theme.borderRadius}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg border border-white/20 shadow-sm"
                        style={{ backgroundColor: theme.primaryColor || '#FF6B35' }}
                        title={`Primary: ${theme.primaryColor || '#FF6B35'}`}
                      />
                      <div
                        className="w-6 h-6 rounded-lg border border-white/20 shadow-sm"
                        style={{ backgroundColor: theme.accentColor || '#FFC107' }}
                        title={`Accent: ${theme.accentColor || '#FFC107'}`}
                      />
                      <div
                        className="w-6 h-6 rounded-lg border border-white/20 shadow-sm"
                        style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
                        title={`Page BG: ${theme.backgroundColor || '#FFFFFF'}`}
                      />
                      <div
                        className="w-6 h-6 rounded-lg border border-white/20 shadow-sm"
                        style={{ backgroundColor: theme.cardBgColor || '#F9F9F9' }}
                        title={`Card BG: ${theme.cardBgColor || '#F9F9F9'}`}
                      />

                      <div className="ml-auto text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {activeToggles}/8 Toggles Active
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/super/restaurants/${restaurant._id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white rounded-xl text-xs font-semibold transition border border-orange-500/20 hover:border-transparent"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Theme & Toggles</span>
                  </Link>

                  <a
                    href={`/restaurant/${restaurant.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Open Live Storefront"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
