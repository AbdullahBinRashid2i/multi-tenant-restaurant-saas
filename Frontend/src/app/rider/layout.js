'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Bike,
  Store,
  Wifi,
  WifiOff,
  LogOut,
  Home,
  Phone,
  User,
} from 'lucide-react';
import getSocket from '../../lib/socket';

export default function RiderLayout({ children }) {
  const router = useRouter();
  const { user, loading, isAuthenticated, isRider, isSuperAdmin, logout } = useAuth();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (!isRider && !isSuperAdmin))) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, isRider, isSuperAdmin, router]);

  // Connect socket to rider room
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (socket.connected) setSocketConnected(true);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const restId = user?.restaurantId?._id || user?.restaurantId;
    if (restId) {
      socket.emit('joinRiderRoom', restId);
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
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Rider Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (!isRider && !isSuperAdmin)) {
    return null;
  }

  const restaurantName =
    user?.restaurantId?.name || (isSuperAdmin ? 'Super Admin Preview' : 'Partner Restaurant');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Mobile-Friendly Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-white">Rider Dispatch</h1>
                {socketConnected ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Wifi className="w-3 h-3" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <WifiOff className="w-3 h-3" />
                    Connecting
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Store className="w-3 h-3 text-slate-500" />
                <span>{restaurantName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-white">{user?.name}</p>
              {user?.phone && (
                <p className="text-[10px] text-emerald-400 font-mono">{user.phone}</p>
              )}
            </div>

            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Platform Home"
            >
              <Home className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 pb-20">{children}</main>
    </div>
  );
}
