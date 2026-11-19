'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import getSocket from '../../../lib/socket';
import api from '../../../lib/api';
import {
  Utensils,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Bike,
  CreditCard,
  Banknote,
  RefreshCw,
  ChefHat,
  PackageCheck,
  XCircle,
  BellRing,
  Filter,
} from 'lucide-react';

export default function RestaurantOrdersBoard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  const restaurantId = user?.restaurantId?._id || user?.restaurantId;

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/orders');
      setOrders(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [restaurantId]);

  // Socket.io Real-time Event Subscription
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !restaurantId) return;

    socket.emit('joinRestaurant', restaurantId);

    const handleNewOrder = (order) => {
      // Prepend the new order
      setOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)]);
      setNewOrderAlert(order);
      setTimeout(() => setNewOrderAlert(null), 8000);
    };

    const handleStatusUpdated = ({ orderId, status, riderId }) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status, ...(riderId && { riderId }) } : o))
      );
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderStatusUpdated', handleStatusUpdated);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderStatusUpdated', handleStatusUpdated);
    };
  }, [restaurantId]);

  // Update Status API call
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const statusCategories = [
    { key: 'ALL', label: 'All Orders' },
    { key: 'PENDING', label: 'Incoming (Pending)' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PREPARING', label: 'Kitchen (Preparing)' },
    { key: 'READY', label: 'Ready for Pickup' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CONFIRMED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'PREPARING':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'READY':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'OUT_FOR_DELIVERY':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner for Real-Time Incoming Order */}
      {newOrderAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 border-2 border-orange-500 text-orange-300 flex items-center justify-between shadow-2xl animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <BellRing className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-white">⚡ NEW INCOMING ORDER!</p>
              <p className="text-xs text-orange-200">
                Order #{newOrderAlert._id.slice(-6).toUpperCase()} by {newOrderAlert.customerInfo?.name} • ${newOrderAlert.totalAmount?.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleUpdateStatus(newOrderAlert._id, 'CONFIRMED')}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg transition"
          >
            Accept Now
          </button>
        </div>
      )}

      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Live Incoming Order Board</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time kitchen dispatch powered by Socket.io. Mark orders ready to alert delivery riders.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
        {statusCategories.map((cat) => {
          const count =
            cat.key === 'ALL'
              ? orders.length
              : orders.filter((o) => o.status === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setStatusFilter(cat.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                statusFilter === cat.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  statusFilter === cat.key ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Order Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Listening for live orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/30 rounded-2xl border border-slate-800/80 flex flex-col items-center">
          <Utensils className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No Orders in this View</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {statusFilter === 'ALL'
              ? 'New orders placed by customers on the public storefront will appear here live.'
              : `No orders are currently in "${statusFilter}" state.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const shortId = order._id.slice(-6).toUpperCase();
            const createdAtDate = new Date(order.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order._id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition space-y-4"
              >
                {/* Header: Order ID, Time & Status Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-white">#{shortId}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {createdAtDate}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-extrabold text-lg text-emerald-400">
                        ${order.totalAmount?.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1 justify-end text-[11px] font-medium mt-0.5">
                        {order.paymentMethod === 'CARD' ? (
                          <span className="text-blue-400 flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            Card (Paid)
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Banknote className="w-3 h-3" />
                            COD {order.isPaid ? '(Collected)' : '(Pending)'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1.5">
                    <p className="font-bold text-white">{order.customerInfo?.name}</p>
                    <p className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{order.customerInfo?.phone}</span>
                    </p>
                    <p className="text-slate-400 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{order.customerInfo?.address}</span>
                    </p>
                    {order.notes && (
                      <p className="text-amber-300 text-[11px] bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 italic">
                        Note: &ldquo;{order.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Ordered Items ({order.items?.length || 0}):
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between py-1 border-b border-slate-800/60 last:border-0"
                        >
                          <div>
                            <span className="font-bold text-white mr-1.5">{item.quantity}x</span>
                            <span className="text-slate-200">{item.name}</span>
                            {item.selectedSize && (
                              <span className="text-[10px] text-slate-400 ml-1">
                                ({item.selectedSize})
                              </span>
                            )}
                            {item.selectedAddons?.length > 0 && (
                              <p className="text-[10px] text-slate-500">
                                + {item.selectedAddons.map((a) => a.name).join(', ')}
                              </p>
                            )}
                          </div>
                          <span className="text-slate-400 font-mono text-xs">
                            ${item.subtotal?.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rider Assignment Info */}
                  {order.riderId && (
                    <div className="mt-4 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="font-semibold text-white">
                            Rider: {order.riderId.name || 'Assigned'}
                          </p>
                          {order.riderId.phone && (
                            <p className="text-[11px] text-blue-300">{order.riderId.phone}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                        En Route
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Action Buttons */}
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'CONFIRMED')}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'CANCELLED')}
                          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'PREPARING')}
                        className="col-span-2 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/20"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Send to Kitchen (Start Preparing)</span>
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'READY')}
                        className="col-span-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Mark Ready for Pickup (Alert Riders)</span>
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <div className="col-span-2 text-center py-2 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <Bike className="w-4 h-4 animate-pulse" />
                        <span>Ready for Pickup — Waiting for Rider to Claim</span>
                      </div>
                    )}

                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <div className="col-span-2 text-center py-2 px-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <Bike className="w-4 h-4" />
                        <span>Out for Delivery — Handled by Rider</span>
                      </div>
                    )}

                    {order.status === 'DELIVERED' && (
                      <div className="col-span-2 text-center py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Order Completed & Delivered</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
