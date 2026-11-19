'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../../lib/api';
import getSocket from '../../../../../lib/socket';
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
  ArrowLeft,
  ChevronRight,
  ChefHat,
  PackageCheck,
  Check,
  ShoppingBag,
} from 'lucide-react';

export default function OrderTrackingPage() {
  const { slug, orderId } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Order details
  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Real-time Socket.io status updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !orderId) return;

    // Join order room
    socket.emit('joinOrder', orderId);

    const handleStatusUpdated = ({ status }) => {
      setOrder((prev) => (prev ? { ...prev, status } : prev));
      // Re-fetch to get updated rider details or history
      fetchOrder();
    };

    socket.on('orderStatusUpdated', handleStatusUpdated);

    return () => {
      socket.emit('leaveOrder', orderId);
      socket.off('orderStatusUpdated', handleStatusUpdated);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Connecting to live order tracker...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold">Order Not Found</h2>
          <p className="text-sm text-slate-400">{error || 'Could not find the requested order.'}</p>
          <Link
            href={`/restaurant/${slug}`}
            className="inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition"
          >
            Back to Storefront
          </Link>
        </div>
      </div>
    );
  }

  const restaurant = order.restaurantId || {};
  const theme = restaurant.theme || {};
  const primaryColor = theme.primaryColor || '#FF6B35';
  const borderRadius = theme.borderRadius || '8px';

  // Lifecycle steps
  const steps = [
    { key: 'PENDING', label: 'Order Placed', desc: 'Received by kitchen', icon: Clock },
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Kitchen confirmed order', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Preparing', desc: 'Chefs are cooking your food', icon: ChefHat },
    { key: 'READY', label: 'Ready for Pickup', desc: 'Packaged & waiting for driver', icon: PackageCheck },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Driver is on the way', icon: Bike },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your meal!', icon: Check },
  ];

  const statusOrder = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  const currentStepIndex = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div
      className="min-h-screen text-slate-900 py-10 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: theme.backgroundColor || '#F8FAFC',
        fontFamily: theme.fontFamily || 'Inter, sans-serif',
      }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-2">
          <Link
            href={`/restaurant/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {restaurant.name || 'Storefront'}</span>
          </Link>

          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700 font-semibold">
            Order #{order._id.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* Status Tracker Card */}
        <div
          className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-lg space-y-6"
          style={{ borderRadius }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Status Tracker
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {isCancelled
                  ? 'Order Cancelled'
                  : order.status === 'DELIVERED'
                  ? 'Order Delivered!'
                  : order.status === 'OUT_FOR_DELIVERY'
                  ? 'Your Food is on the Way!'
                  : 'Preparing Your Order'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Estimated arrival: ~{order.estimatedDeliveryTime || 30} minutes from placement
              </p>
            </div>

            <div className="self-start sm:self-auto flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: primaryColor, borderRadius }}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Stepper Visualization */}
          {!isCancelled ? (
            <div className="relative py-2">
              <div className="space-y-6">
                {steps.map((st, idx) => {
                  const Icon = st.icon;
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={st.key} className="flex items-start gap-4 relative group">
                      {/* Vertical line connecting steps */}
                      {idx < steps.length - 1 && (
                        <div
                          className={`absolute left-5 top-10 w-0.5 h-10 transition-colors duration-300 ${
                            currentStepIndex > idx ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}

                      {/* Step Circle */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-md ${
                          isCompleted
                            ? 'text-white'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                        style={{
                          backgroundColor: isCompleted ? primaryColor : undefined,
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Label & Description */}
                      <div className="pt-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold ${
                              isCompleted ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {st.label}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 animate-pulse">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{st.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              This order was cancelled by the restaurant.
            </div>
          )}

          {/* Assigned Delivery Rider Banner */}
          {order.riderId && (
            <div
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
              style={{ borderRadius }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">
                    Driver: {order.riderId.name || 'Assigned Driver'}
                  </p>
                  <p className="text-xs text-slate-500">Contact: {order.riderId.phone || 'N/A'}</p>
                </div>
              </div>

              {order.riderId.phone && (
                <a
                  href={`tel:${order.riderId.phone}`}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
                  style={{ backgroundColor: primaryColor, borderRadius }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Rider</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Order Details & Summary Card */}
        <div
          className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-lg space-y-6"
          style={{ borderRadius }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Order Summary</h3>
            <span className="text-xs text-slate-500">
              Placed {new Date(order.createdAt).toLocaleDateString()} at{' '}
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Items Breakdown */}
          <div className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-3 flex items-start justify-between text-sm">
                <div>
                  <p className="font-semibold text-slate-900">
                    <span className="font-extrabold mr-2" style={{ color: primaryColor }}>
                      {item.quantity}x
                    </span>
                    {item.name}
                  </p>
                  {item.selectedSize && (
                    <p className="text-xs text-slate-500">Size: {item.selectedSize}</p>
                  )}
                  {item.selectedAddons?.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Add-ons: {item.selectedAddons.map((a) => a.name).join(', ')}
                    </p>
                  )}
                </div>
                <span className="font-mono font-semibold text-slate-800">
                  ${item.subtotal?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals & Payment */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span className="font-mono">${order.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Delivery Fee</span>
              <span className="font-mono text-emerald-600 font-semibold">FREE</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Amount</span>
              <span className="font-mono" style={{ color: primaryColor }}>
                ${order.totalAmount?.toFixed(2)}
              </span>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Payment Method:</span>
              <div className="flex items-center gap-1.5 font-bold">
                {order.paymentMethod === 'CARD' ? (
                  <span className="text-blue-600 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    Simulated Card (Settled)
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5" />
                    Cash on Delivery {order.isPaid ? '(Paid)' : '(Uncollected)'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="pt-4 border-t border-slate-100 space-y-1 text-xs text-slate-600">
            <p className="font-bold text-slate-900">Delivery Information</p>
            <p>Customer: {order.customerInfo?.name}</p>
            <p>Phone: {order.customerInfo?.phone}</p>
            <p>Address: {order.customerInfo?.address}</p>
            {order.notes && <p className="italic text-slate-500">Note: &ldquo;{order.notes}&rdquo;</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
