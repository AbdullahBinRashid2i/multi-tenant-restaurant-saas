'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Utensils, Shield, Store, Bike, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import api from '../lib/api';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [slugInput, setSlugInput] = useState('');

  useEffect(() => {
    // Optionally fetch public list of restaurants if available
    api
      .get('/restaurants')
      .then((res) => {
        if (res.data?.data) {
          setRestaurants(res.data.data.filter((r) => r.isActive));
        }
      })
      .catch(() => {
        // Superadmin endpoint requires auth, fallback gracefully
      });
  }, []);

  const handleGoStore = (e) => {
    e.preventDefault();
    if (slugInput.trim()) {
      router.push(`/restaurant/${slugInput.trim().toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">DynamicSaaS</span>
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full ml-2 font-mono">
                Multi-Tenant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">
                  Hi, <span className="font-semibold text-white">{user?.name}</span> ({user?.role})
                </span>
                {user?.role === 'SUPERADMIN' && (
                  <Link
                    href="/admin/super"
                    className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-xs font-semibold transition"
                  >
                    Super Admin Portal
                  </Link>
                )}
                {user?.role === 'RESTAURANT' && (
                  <Link
                    href="/admin/restaurant"
                    className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold transition"
                  >
                    Restaurant Portal
                  </Link>
                )}
                {user?.role === 'RIDER' && (
                  <Link
                    href="/rider"
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold transition"
                  >
                    Rider Portal
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/20 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Single Codebase • Multi-Tenant Architecture • Dynamic UI Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          One Platform. Infinite Customized{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400">
            Restaurant Web Apps.
          </span>
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
          Powered by Next.js, Express, MongoDB Atlas, and Socket.io. Dynamic brand themes, 12-switch feature engine,
          role-based access control, and live delivery dispatch.
        </p>

        {/* Storefront Direct Jump */}
        <form onSubmit={handleGoStore} className="mt-10 flex items-center gap-2 max-w-md w-full bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-2xl">
          <span className="text-slate-500 text-sm pl-3 font-mono">/restaurant/</span>
          <input
            type="text"
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder="burger-house"
            className="flex-1 bg-transparent border-0 text-white placeholder-slate-600 focus:outline-none text-sm font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
          >
            Visit Store
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 4 Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-5xl text-left">
          {/* Card 1: Super Admin */}
          <Link
            href="/admin/super"
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-900 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition">
                Super Admin Portal
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Onboard client restaurants, configure live brand themes (colors, typography, border radius), and toggle the 12 UI feature switches.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-orange-400">
              <span>Open Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Card 2: Restaurant Admin */}
          <Link
            href="/admin/restaurant"
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                Restaurant Admin
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Manage categories, food items, add-on modifiers, size variants, instant in-stock toggles, rider accounts, and incoming orders.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-blue-400">
              <span>Open Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Card 3: Delivery Rider */}
          <Link
            href="/rider"
            className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Bike className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition">
                Delivery Rider
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Mobile-optimized view for orders ready for pickup, claiming deliveries, updating status to Out for Delivery and Delivered with COD collection.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <span>Open Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
