'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import getSocket from '../../lib/socket';
import {
  Bike,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  RefreshCw,
  PackageCheck,
  Navigation,
  Check,
  BellRing,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function RiderDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ready'); // 'ready' | 'active' | 'history'

  const [readyOrders, setReadyOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [readyAlert, setReadyAlert] = useState(null);

  const restaurantId = user?.restaurantId?._id || user?.restaurantId;

  // Fetch Ready Orders & Active Deliveries
  const fetchAllOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const [readyRes, myRes] = await Promise.all([
        api.get('/orders?status=READY'),
        api.get('/orders/rider/my-orders'),
      ]);

      // Ready orders are those not yet assigned to any rider
      const unassignedReady = (readyRes.data?.data || []).filter((o) => !o.riderId);
      setReadyOrders(unassignedReady);

      const assigned = myRes.data?.data || [];
      setMyOrders(assigned);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load delivery queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [restaurantId]);

  // Socket.io Real-time Dispatch
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !restaurantId) return;

    socket.emit('joinRiderRoom', restaurantId);

    const handleOrderReady = (order) => {
      setReadyOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)]);
      setReadyAlert(order);
      setTimeout(() => setReadyAlert(null), 8000);
    };

    const handleStatusUpdated = ({ orderId, status, riderId }) => {
      // If someone else claimed it, remove from ready
      if (status === 'OUT_FOR_DELIVERY' && riderId !== user?._id) {
        setReadyOrders((prev) => prev.filter((o) => o._id !== orderId));
      }
    };

    socket.on('orderReady', handleOrderReady);
    socket.on('orderStatusUpdated', handleStatusUpdated);

    return () => {
      socket.off('orderReady', handleOrderReady);
      socket.off('orderStatusUpdated', handleStatusUpdated);
    };
  }, [restaurantId, user?._id]);

  // Claim Order (PATCH /api/orders/:id/assign-rider)
  const handleClaimOrder = async (orderId) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/orders/${orderId}/assign-rider`);
      setSuccess('Order claimed! Switched to Out for Delivery.');

      // Update local state
      setReadyOrders((prev) => prev.filter((o) => o._id !== orderId));
      setActiveTab('active');
      fetchAllOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim delivery order');
    }
  };

  // Complete Order & Confirm COD Collection (PATCH /api/orders/:id/status)
  const handleCompleteDelivery = async (orderId, isCod) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/orders/${orderId}/status`, {
        status: 'DELIVERED',
        isPaid: true,
      });

      setSuccess(
        isCod
          ? 'Delivery completed and Cash on Delivery (COD) collection confirmed!'
          : 'Delivery completed successfully!'
      );
      fetchAllOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete delivery');
    }
  };

  const activeDeliveries = myOrders.filter((o) => o.status === 'OUT_FOR_DELIVERY');
  const deliveredHistory = myOrders.filter((o) => o.status === 'DELIVERED');
  const totalDeliveredCash = deliveredHistory.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Real-time Order Ready Pop-up Alert */}
      {readyAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border-2 border-emerald-500 text-emerald-300 flex items-center justify-between shadow-2xl animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <BellRing className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-white">⚡ NEW ORDER READY FOR PICKUP!</p>
              <p className="text-xs text-emerald-200">
                Order #{readyAlert._id.slice(-6).toUpperCase()} • {readyAlert.customerInfo?.name} (
                ${readyAlert.totalAmount?.toFixed(2)})
              </p>
            </div>
          </div>
          <button
            onClick={() => handleClaimOrder(readyAlert._id)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg transition"
          >
            Claim Now
          </button>
        </div>
      )}

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

      {/* Rider Status Metric Bar */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('ready')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === 'ready'
              ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Ready Queue</span>
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1">{readyOrders.length}</p>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === 'active'
              ? 'bg-orange-600/20 border-orange-500 text-white shadow-lg shadow-orange-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider">My Active</span>
            <Bike className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1">{activeDeliveries.length}</p>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === 'history'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Delivered</span>
            <Check className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-1">{deliveredHistory.length}</p>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: READY FOR PICKUP QUEUE                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ready' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Ready for Pickup</h2>
              <p className="text-xs text-slate-400">
                Orders packaged by kitchen waiting for a driver to claim
              </p>
            </div>
            <button
              onClick={fetchAllOrders}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Checking kitchen dispatch...</p>
            </div>
          ) : readyOrders.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col items-center">
              <PackageCheck className="w-10 h-10 text-slate-600 mb-2" />
              <p className="font-bold text-white text-sm">No Orders Waiting for Pickup</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                As soon as the kitchen marks an order as READY, it will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {readyOrders.map((order) => {
                const shortId = order._id.slice(-6).toUpperCase();
                const isCod = order.paymentMethod === 'COD';

                return (
                  <div
                    key={order._id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition shadow-xl space-y-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-white">#{shortId}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                            Ready for Pickup
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Placed by <span className="text-white font-semibold">{order.customerInfo?.name}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-base font-extrabold text-emerald-400">
                          ${order.totalAmount?.toFixed(2)}
                        </span>
                        <div className="text-[10px] font-semibold mt-0.5">
                          {isCod ? (
                            <span className="text-amber-400 flex items-center gap-1 justify-end">
                              <Banknote className="w-3 h-3" />
                              COD Delivery
                            </span>
                          ) : (
                            <span className="text-blue-400 flex items-center gap-1 justify-end">
                              <CreditCard className="w-3 h-3" />
                              Card (Pre-paid)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Destination */}
                    <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs space-y-1">
                      <p className="text-slate-400 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-200">{order.customerInfo?.address}</span>
                      </p>
                      {order.notes && (
                        <p className="text-amber-300 text-[11px] italic pt-1 border-t border-slate-800">
                          Note: &ldquo;{order.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Claim Button */}
                    <button
                      onClick={() => handleClaimOrder(order._id)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
                    >
                      <Bike className="w-4 h-4" />
                      <span>Claim Delivery (Start Route)</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: MY ACTIVE DELIVERIES                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">My Active Deliveries</h2>
              <p className="text-xs text-slate-400">
                Orders you have claimed that are currently out for delivery
              </p>
            </div>
            <button
              onClick={fetchAllOrders}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col items-center">
              <Bike className="w-10 h-10 text-slate-600 mb-2" />
              <p className="font-bold text-white text-sm">No Active Deliveries</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Switch to the &ldquo;Ready Queue&rdquo; tab to claim an order waiting for pickup.
              </p>
              <button
                onClick={() => setActiveTab('ready')}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition"
              >
                View Ready Orders
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {activeDeliveries.map((order) => {
                const shortId = order._id.slice(-6).toUpperCase();
                const isCod = order.paymentMethod === 'COD';
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  order.customerInfo?.address || ''
                )}`;

                return (
                  <div
                    key={order._id}
                    className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border-2 border-orange-500/40 shadow-2xl space-y-5"
                  >
                    {/* Top Status & Amount */}
                    <div className="flex items-start justify-between gap-2 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-lg text-white">#{shortId}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20">
                            Out for Delivery
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Delivery for <span className="font-bold text-white">{order.customerInfo?.name}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-xl font-extrabold text-emerald-400">
                          ${order.totalAmount?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Customer Action Bar: One-Tap Call & Navigation */}
                    <div className="grid grid-cols-2 gap-3">
                      {order.customerInfo?.phone && (
                        <a
                          href={`tel:${order.customerInfo.phone}`}
                          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                        >
                          <Phone className="w-4 h-4 text-emerald-400" />
                          <span>Call Customer</span>
                        </a>
                      )}

                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                      >
                        <Navigation className="w-4 h-4 text-blue-400" />
                        <span>Navigate in Maps</span>
                      </a>
                    </div>

                    {/* Delivery Address Details */}
                    <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1.5">
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">
                        Dropoff Address:
                      </p>
                      <p className="text-white font-medium flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                        <span>{order.customerInfo?.address}</span>
                      </p>
                      {order.notes && (
                        <p className="text-amber-300 text-[11px] italic pt-1 border-t border-slate-800">
                          Customer Note: &ldquo;{order.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Ordered Items Summary */}
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Package Contents:
                      </p>
                      <div className="divide-y divide-slate-800/60 max-h-32 overflow-y-auto">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="py-1 flex justify-between">
                            <span>
                              {item.quantity}x {item.name}{' '}
                              {item.selectedSize && `(${item.selectedSize})`}
                            </span>
                            <span className="font-mono text-slate-400">
                              ${item.subtotal?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cash-on-Delivery (COD) Collection Alert */}
                    {isCod ? (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-300 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-200">
                          <Banknote className="w-4 h-4 text-amber-400" />
                          <span>CASH ON DELIVERY (COD) COLLECTION</span>
                        </div>
                        <p className="text-xs">
                          Please collect exactly{' '}
                          <span className="font-extrabold text-white font-mono text-sm">
                            ${order.totalAmount?.toFixed(2)}
                          </span>{' '}
                          cash from the customer before completing delivery.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-400" />
                        <span>Pre-paid via Card. No cash collection required.</span>
                      </div>
                    )}

                    {/* Complete Delivery Action */}
                    <button
                      onClick={() => handleCompleteDelivery(order._id, isCod)}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isCod ? 'Confirm Delivery & COD Collected' : 'Mark as Delivered'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: DELIVERED HISTORY                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Delivered History</h2>
              <p className="text-xs text-slate-400">
                Completed delivery log and cash collection record
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Total Handled: ${totalDeliveredCash.toFixed(2)}
            </span>
          </div>

          {deliveredHistory.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col items-center">
              <Check className="w-10 h-10 text-slate-600 mb-2" />
              <p className="font-bold text-white text-sm">No Delivered Orders Yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Completed deliveries will be logged here for your shift summary.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveredHistory.map((order) => {
                const shortId = order._id.slice(-6).toUpperCase();
                const isCod = order.paymentMethod === 'COD';
                return (
                  <div
                    key={order._id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">#{shortId}</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Delivered
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {order.customerInfo?.name} • {order.customerInfo?.address}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-white">
                        ${order.totalAmount?.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        {isCod ? 'Cash Collected' : 'Card'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
