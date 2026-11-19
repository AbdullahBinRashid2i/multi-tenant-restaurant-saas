'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  Utensils,
  Store,
  Layers,
  Bike,
  LogOut,
  Home,
  ChevronRight,
  ExternalLink,
  Wifi,
  WifiOff,
} from 'lucide-react';
import getSocket from '../../../lib/socket';

export default function RestaurantAdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, isRestaurantAdmin, isSuperAdmin, logout } = useAuth();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (!isRestaurantAdmin && !isSuperAdmin))) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, isRestaurantAdmin, isSuperAdmin, router]);

  // Connect socket and listen to status
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (socket.connected) {
      setSocketConnected(true);
    }

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // If user has a restaurantId, join room
    const restId = user?.restaurantId?._id || user?.restaurantId;
    if (restId) {
      socket.emit('joinRestaurant', restId);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Restaurant Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (!isRestaurantAdmin && !isSuperAdmin)) {
    return null;
  }

  const restaurantName =
    user?.restaurantId?.name || (isSuperAdmin ? 'Super Admin Preview' : 'My Restaurant');
  const restaurantSlug = user?.restaurantId?.slug;

  const navItems = [
    {
      name: 'Live Order Board',
      href: '/admin/restaurant',
      icon: Utensils,
      exact: true,
    },
    {
      name: 'Menu & Categories',
      href: '/admin/restaurant/menu',
      icon: Layers,
      exact: false,
    },
    {
      name: 'Delivery Riders',
      href: '/admin/restaurant/riders',
      icon: Bike,
      exact: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col shrink-0">
        <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="truncate">
            <h1 className="font-bold text-sm text-white truncate">{restaurantName}</h1>
            <p className="text-xs text-blue-400">Restaurant Admin</p>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Operations & Logistics
          </p>
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live Socket & User Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
            <span className="text-slate-400">Socket.io Dispatch:</span>
            {socketConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Wifi className="w-3.5 h-3.5" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                Connecting
              </span>
            )}
          </div>

          <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-blue-400 font-mono truncate">{user?.email}</p>
          </div>

          <div className="flex gap-2">
            {restaurantSlug && (
              <a
                href={`/restaurant/${restaurantSlug}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                title="View Live Storefront"
              >
                <span>Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Home"
            >
              <Home className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-white font-semibold">{restaurantName}</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-300 capitalize">
              {pathname === '/admin/restaurant'
                ? 'Live Order Board'
                : pathname.replace('/admin/restaurant/', '')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Real-Time Kitchen Feed
            </span>
          </div>
        </header>

        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
