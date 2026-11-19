'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import {
  Bike,
  UserPlus,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  RefreshCw,
  Key,
  Shield,
} from 'lucide-react';

export default function RestaurantRidersPage() {
  const { user } = useAuth();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New Rider form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [creating, setCreating] = useState(false);

  const restaurantId = user?.restaurantId?._id || user?.restaurantId;

  const fetchRiders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/riders');
      setRiders(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [restaurantId]);

  const handleCreateRider = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/users/riders', {
        ...form,
        restaurantId,
      });
      setSuccess(`Delivery Rider "${form.name}" created successfully!`);
      setForm({ name: '', email: '', password: '', phone: '' });
      fetchRiders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create rider account');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleRider = async (riderId) => {
    try {
      const res = await api.patch(`/users/${riderId}/toggle`);
      const updatedStatus = res.data?.data?.isActive;
      setRiders((prev) =>
        prev.map((r) => (r._id === riderId ? { ...r, isActive: updatedStatus } : r))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update rider status');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Delivery Rider Fleet</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Create and manage delivery staff accounts linked to your restaurant branch for live order dispatch
          </p>
        </div>

        <button
          onClick={fetchRiders}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* Notices */}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create Rider Account Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Rider Account</h3>
              <p className="text-xs text-slate-400">Add a delivery staff driver to your branch</p>
            </div>
          </div>

          <form onSubmit={handleCreateRider} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Alex Henderson"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number (for customer delivery calls) *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. +1 555-019-2834"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Login Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="rider@restaurant.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {creating ? 'Creating Rider...' : 'Provision Rider Account'}
            </button>
          </form>
        </div>

        {/* Right Column: Fleet List (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Active Riders ({riders.length})</h3>
              <p className="text-xs text-slate-400">Riders log in to claim READY orders and update progress</p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading fleet staff...</p>
            </div>
          ) : riders.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col items-center">
              <Bike className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-bold text-white">No Riders Created Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Use the form on the left to add your first delivery rider.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {riders.map((rider) => (
                <div
                  key={rider._id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-4 transition hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-white">{rider.name}</p>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-semibold ${
                            rider.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {rider.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {rider.email}
                        </span>
                        {rider.phone && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {rider.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Active status */}
                  <button
                    onClick={() => handleToggleRider(rider._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      rider.isActive
                        ? 'bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {rider.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
