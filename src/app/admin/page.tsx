'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Package, FileText, ShoppingCart, Shield, ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  stats: {
    totalProducts: number;
    totalInventory: string;
    totalQuotations: number;
    totalOrders: number;
  };
  recentQuotations: any[];
  recentOrders: any[];
}

export default function AdminDashboard() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/dashboard/admin')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load admin dashboard data');
        return res.json();
      })
      .then((data) => {
        setData(data);
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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-800 border border-amber-200"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case 'APPROVED':
      case 'PROCESSING':
      case 'DELIVERED':
      case 'SHIPPED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> {status}</span>;
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100/80 text-rose-800 border border-rose-200"><AlertCircle className="w-3 h-3 mr-1" /> {status}</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">{status}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Admin Control Center</h2>
            <p className="text-slate-500 mt-1">Platform overview, inventory monitoring, and transaction approvals.</p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Active</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-[#eae3d2]/20 rounded-2xl border border-[#eae3d2]/60"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-700">
            {error}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Products */}
              <div className="glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden bg-white">
                <div className="absolute top-6 right-6 p-3 rounded-xl bg-[#b48a5e]/10 text-[#b48a5e]">
                  <Package className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Total Products</p>
                <h3 className="text-4xl font-extrabold text-slate-850 mt-4">{data?.stats.totalProducts}</h3>
                <Link href="/admin/products" className="inline-flex items-center text-xs font-semibold text-[#b48a5e] hover:text-[#9e7950] mt-6 group">
                  Manage Catalog <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Inventory */}
              <div className="glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden bg-white">
                <div className="absolute top-6 right-6 p-3 rounded-xl bg-[#8f80b4]/10 text-[#8f80b4]">
                  <Package className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Stock Items</p>
                <h3 className="text-4xl font-extrabold text-slate-850 mt-4 truncate">
                  {Number(data?.stats.totalInventory).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </h3>
                <span className="text-xs text-slate-500 mt-6 block">Units/Grams/mL overall</span>
              </div>

              {/* Quotations */}
              <div className="glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden bg-white">
                <div className="absolute top-6 right-6 p-3 rounded-xl bg-[#a67c52]/10 text-[#a67c52]">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">All Quotations</p>
                <h3 className="text-4xl font-extrabold text-slate-850 mt-4">{data?.stats.totalQuotations}</h3>
                <Link href="/admin/quotations" className="inline-flex items-center text-xs font-semibold text-[#a67c52] hover:text-[#8f6943] mt-6 group">
                  Review Quotations <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Orders */}
              <div className="glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden bg-white">
                <div className="absolute top-6 right-6 p-3 rounded-xl bg-emerald-100/60 text-emerald-800">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">All Orders</p>
                <h3 className="text-4xl font-extrabold text-slate-850 mt-4">{data?.stats.totalOrders}</h3>
                <Link href="/admin/orders" className="inline-flex items-center text-xs font-semibold text-emerald-800 hover:text-emerald-700 mt-6 group">
                  Manage Orders <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Tables section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Quotations */}
              <div className="glass-panel rounded-2xl p-6 bg-white border border-[#eae3d2]">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-bold text-slate-800">Recent Quotations (All Sellers)</h4>
                  <Link href="/admin/quotations" className="text-xs font-semibold text-[#b48a5e] hover:text-[#9e7950]">View All</Link>
                </div>
                {data?.recentQuotations && data.recentQuotations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#eae3d2] text-slate-500 text-xs font-semibold">
                          <th className="pb-3">Seller</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-right">Total</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eae3d2]/60 text-sm text-slate-700">
                        {data.recentQuotations.map((quote) => (
                          <tr key={quote.id} className="hover:bg-[#faf7f2]/50">
                            <td className="py-4">
                              <p className="font-semibold text-slate-800">{quote.user.name}</p>
                              <span className="text-xs text-slate-500">{quote.user.email}</span>
                            </td>
                            <td className="py-4 text-xs text-slate-500">{new Date(quote.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 text-right font-semibold text-slate-800">₹{Number(quote.total).toFixed(2)}</td>
                            <td className="py-4 text-right">{getStatusBadge(quote.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-sm">No quotations found.</div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="glass-panel rounded-2xl p-6 bg-white border border-[#eae3d2]">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-bold text-slate-800">Recent Orders (All Sellers)</h4>
                  <Link href="/admin/orders" className="text-xs font-semibold text-emerald-800 hover:text-emerald-700">View All</Link>
                </div>
                {data?.recentOrders && data.recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#eae3d2] text-slate-500 text-xs font-semibold">
                          <th className="pb-3">Seller</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-right">Total</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eae3d2]/60 text-sm text-slate-700">
                        {data.recentOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-[#faf7f2]/50">
                            <td className="py-4">
                              <p className="font-semibold text-slate-800">{order.user.name}</p>
                              <span className="text-xs text-slate-500">{order.user.email}</span>
                            </td>
                            <td className="py-4 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="py-4 text-right font-semibold text-slate-800">₹{Number(order.total).toFixed(2)}</td>
                            <td className="py-4 text-right">{getStatusBadge(order.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-sm">No orders found.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
