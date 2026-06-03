'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Activity, Clock, ShieldAlert, User, Database, ShoppingBag, FileCheck } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/logs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch system logs');
        return res.json();
      })
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'PRODUCT_CREATE':
      case 'PRODUCT_UPDATE':
      case 'PRODUCT_DELETE':
        return <Database className="w-4 h-4 text-amber-500" />;
      case 'ORDER_CREATE':
      case 'ORDER_STATUS_UPDATE':
        return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'QUOTATION_CREATE':
        return <FileCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'PRODUCT_CREATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">CREATE PRODUCT</span>;
      case 'PRODUCT_UPDATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-50 text-yellow-800 border border-yellow-250 text-[10px] font-bold">UPDATE PRODUCT</span>;
      case 'PRODUCT_DELETE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">DELETE PRODUCT</span>;
      case 'ORDER_CREATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-205 text-[10px] font-bold">ORDER CONVERTED</span>;
      case 'ORDER_STATUS_UPDATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">ORDER FULFILLMENT</span>;
      case 'QUOTATION_CREATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-250 text-[10px] font-bold">QUOTE REQUEST</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-50 text-slate-800 border border-slate-250 text-[10px] font-bold">{action}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800">System Audit Logs</h2>
            <p className="text-slate-550 mt-1">Audit log records documenting transaction creation, stock changes, and catalogs.</p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Auditing Active</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#eae3d2]/20 rounded-2xl border border-[#eae3d2]/60"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-700">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-[#eae3d2]/10 rounded-2xl border border-[#eae3d2]/40">
            No activity logs registered.
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-[#eae3d2] shadow-md bg-white overflow-hidden divide-y divide-[#eae3d2]/60">
            {logs.map((log) => (
              <div key={log.id} className="p-5 hover:bg-[#faf7f2]/30 transition flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-sm">
                <div className="flex items-start space-x-4">
                  <div className="p-2.5 rounded-xl bg-[#faf7f2] border border-[#eae3d2]/80 mt-0.5">
                    {getActionIcon(log.action)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="text-xs font-mono text-slate-400">ID: {log.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-slate-700 mt-2 font-medium text-sm leading-relaxed">{log.details}</p>
                    <div className="flex items-center text-xs text-slate-500 mt-2 space-x-4">
                      <span className="flex items-center">
                        <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {log.user.name} ({log.user.email})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center text-xs text-slate-500 sm:self-start bg-[#faf7f2] p-1.5 px-3 rounded-lg border border-[#eae3d2]">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
