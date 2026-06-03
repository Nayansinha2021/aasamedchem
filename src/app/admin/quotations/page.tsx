'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { FileText, IndianRupee, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface QuotationItem {
  id: string;
  orderedUnit: string;
  orderedQuantity: string;
  subtotal: string;
  product: {
    sku: string;
    name: string;
  };
}

interface Quotation {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  total: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  items: QuotationItem[];
}

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = React.useState<Quotation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/quotations')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch quotations');
        return res.json();
      })
      .then((data) => {
        setQuotations(data);
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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100/80 text-amber-800 border border-amber-200"><Clock className="w-3.5 h-3.5 mr-1" /> Pending</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100/80 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100/80 text-rose-850 border border-rose-200"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">{status}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">Review Quotations</h2>
          <p className="text-slate-505 mt-1">Audit all generated seller quotations across the platform.</p>
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
        ) : quotations.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-[#eae3d2]/10 rounded-2xl border border-[#eae3d2]/40">
            No quotations found in the system.
          </div>
        ) : (
          <div className="space-y-6">
            {quotations.map((quote) => (
              <div key={quote.id} className="glass-panel rounded-2xl p-6 border border-[#eae3d2]/80 space-y-4 bg-white">
                {/* Meta details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eae3d2]/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Quotation ID & Seller</span>
                    <h3 className="text-sm font-mono font-bold text-slate-700 mt-0.5">{quote.id}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Seller: {quote.user.name} ({quote.user.email})
                    </p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block text-right">Created Date</span>
                      <span className="text-xs text-slate-505 font-semibold">{new Date(quote.createdAt).toLocaleString()}</span>
                    </div>
                    <div>{getStatusBadge(quote.status)}</div>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">Items Summary</span>
                  <div className="divide-y divide-[#eae3d2]/50 bg-[#faf7f2]/50 rounded-xl border border-[#eae3d2]/60 overflow-hidden">
                    {quote.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 text-sm">
                        <div>
                          <p className="font-semibold text-slate-700">{item.product.name}</p>
                          <span className="text-xs text-slate-400 font-mono">{item.product.sku}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-655 font-medium">
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
                    <span className="text-sm text-slate-505 mr-2">Quotation Total:</span>
                    <span className="text-lg font-black text-slate-800 flex items-center">
                      <IndianRupee className="w-4 h-4 mr-0.5 text-slate-400" />
                      {Number(quote.total).toFixed(5)}
                    </span>
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
