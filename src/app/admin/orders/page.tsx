'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ShoppingCart, IndianRupee, Clock, CheckCircle2, AlertCircle, Ship, Truck, ShieldAlert, RefreshCw } from 'lucide-react';

interface OrderItem {
  id: string;
  orderedUnit: string;
  orderedQuantity: string;
  subtotal: string;
  product: {
    sku: string;
    name: string;
  };
}

interface Order {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Status updating state
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/orders')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
      })
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    setActionError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update order status');
      }

      // Success, refresh list
      fetchOrders();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'PROCESSING':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'SHIPPED':
        return <Ship className="w-4 h-4 text-indigo-500" />;
      case 'DELIVERED':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'CANCELLED':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">Manage Orders</h2>
          <p className="text-slate-505 mt-1">Review orders, transition dispatch status, and trigger auto-inventory rules.</p>
        </div>

        {actionError && (
          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-750 text-xs font-semibold flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-[#eae3d2]/20 rounded-2xl border border-[#eae3d2]/60 animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-700">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-[#eae3d2]/10 rounded-2xl border border-[#eae3d2]/40">
            No orders found in the system.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="glass-panel rounded-2xl p-6 border border-[#eae3d2]/80 space-y-4 bg-white">
                {/* Meta details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eae3d2]/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Order ID & Seller</span>
                    <h3 className="text-sm font-mono font-bold text-slate-700 mt-0.5">{order.id}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Seller: {order.user.name} ({order.user.email})
                    </p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block text-right">Placement Date</span>
                      <span className="text-xs text-slate-500 font-semibold">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>

                    {/* Status update controller */}
                    <div className="flex items-center space-x-2 bg-[#faf7f2] border border-[#eae3d2] rounded-xl p-1 px-3">
                      {getStatusIcon(order.status)}
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className="bg-transparent border-none text-xs text-slate-700 font-semibold py-1 pr-4 outline-none focus:ring-0 cursor-pointer disabled:opacity-50"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                      {updatingId === order.id && <RefreshCw className="w-3 h-3 text-[#b48a5e] animate-spin" />}
                    </div>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">Order Items</span>
                  <div className="divide-y divide-[#eae3d2]/50 bg-[#faf7f2]/50 rounded-xl border border-[#eae3d2]/60 overflow-hidden">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 text-sm">
                        <div>
                          <p className="font-semibold text-slate-700">{item.product.name}</p>
                          <span className="text-xs text-slate-400 font-mono">{item.product.sku}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-650 font-medium">
                            {Number(item.orderedQuantity).toFixed(5)} {item.orderedUnit}
                          </p>
                          <span className="text-xs text-slate-500 font-semibold">₹{Number(item.subtotal).toFixed(5)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer total */}
                <div className="pt-4 border-t border-[#eae3d2]/65 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm text-slate-500 mr-2">Grand Total:</span>
                    <span className="text-lg font-black text-slate-800 flex items-center">
                      <IndianRupee className="w-4 h-4 mr-0.5 text-slate-400" />
                      {Number(order.total).toFixed(5)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 bg-[#faf7f2] p-1.5 px-3 rounded-lg border border-[#eae3d2]">
                    * Status change triggers auto-inventory checks & updates
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
