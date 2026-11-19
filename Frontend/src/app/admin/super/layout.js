'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  Shield,
  Store,
  PlusCircle,
  LogOut,
  Home,
  Sliders,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function SuperAdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, isSuperAdmin, logout } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isSuperAdmin)) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, isSuperAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Verifying Super Admin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return null;
  }

  const navItems = [
    {
      name: 'All Restaurants',
      href: '/admin/super',
      icon: Store,
      exact: true,
    },
    {
      name: 'Onboard Restaurant',
      href: '/admin/super/onboarding',
      icon: PlusCircle,
      exact: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col shrink-0">
        <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white">Super Admin</h1>
            <p className="text-xs text-slate-400">Platform Control Hub</p>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Tenant Management
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
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 mb-3">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Super Admin'}</p>
            <p className="text-[11px] text-orange-400 font-mono truncate">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              title="Platform Home"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/admin/super" className="hover:text-white transition">
              Super Admin
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-200 capitalize">
              {pathname === '/admin/super'
                ? 'Overview'
                : pathname.replace('/admin/super/', '').replace('/', ' / ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Atlas DB Connected
            </span>
          </div>
        </header>

        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
