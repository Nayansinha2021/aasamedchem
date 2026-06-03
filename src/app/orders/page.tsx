'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ShoppingCart, IndianRupee, Clock, CheckCircle2, AlertCircle, Ship, Truck } from 'lucide-react';

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
  items: OrderItem[];
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
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
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-800 border border-amber-200"><Clock className="w-3.5 h-3.5 mr-1" /> Pending Approval</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-800 border border-blue-200"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Processing</span>;
      case 'SHIPPED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100/80 text-indigo-850 border border-indigo-200"><Ship className="w-3.5 h-3.5 mr-1" /> Shipped</span>;
      case 'DELIVERED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200"><Truck className="w-3.5 h-3.5 mr-1" /> Delivered</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100/80 text-rose-800 border border-rose-200"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">{status}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">My Orders</h2>
          <p className="text-slate-505 mt-1">Track the status and delivery timeline of your purchase orders.</p>
        </div>

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
            No purchase orders placed yet.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="glass-panel rounded-2xl p-6 border border-[#eae3d2]/80 space-y-4 bg-white">
                {/* Meta details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eae3d2]/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Order ID</span>
                    <h3 className="text-sm font-mono font-bold text-slate-700 mt-0.5">{order.id}</h3>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block text-right">Placement Date</span>
                      <span className="text-xs text-slate-500 font-semibold">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
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
                <div className="pt-4 border-t border-[#eae3d2]/60 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm text-slate-500 mr-2">Grand Total Paid:</span>
                    <span className="text-lg font-black text-slate-800 flex items-center">
                      <IndianRupee className="w-4 h-4 mr-0.5 text-slate-400" />
                      {Number(order.total).toFixed(5)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 italic">Pre-tax system pricing</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
