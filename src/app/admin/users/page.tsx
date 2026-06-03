'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Users, Mail, Shield, Clock, Plus, X, UserPlus, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SELLER';
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<'SELLER' | 'ADMIN'>('SELLER');
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/users')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create user account');
      }

      // Reset form states & reload
      setName('');
      setEmail('');
      setPassword('');
      setRole('SELLER');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-800 border border-blue-200">
          <Shield className="w-3 h-3 mr-1" /> Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Users className="w-3 h-3 mr-1" /> Seller
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800">Manage Users</h2>
            <p className="text-slate-500 mt-1">Directory of registered admin and seller accounts on the platform.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-[#b48a5e] hover:bg-[#9e7950] text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-[#b48a5e]/15 transition self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-[#eae3d2]/20 rounded-2xl border border-[#eae3d2]/60"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-700">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-[#eae3d2]/10 rounded-2xl border border-[#eae3d2]/40">
            No users registered.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user.id} className="glass-panel rounded-2xl p-6 border border-[#eae3d2]/80 space-y-4 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 truncate text-base">{user.name}</h3>
                    <div className="flex items-center text-slate-505 text-xs mt-1 truncate">
                      <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">{getRoleBadge(user.role)}</div>
                </div>

                <div className="pt-3 border-t border-[#eae3d2]/50 flex items-center justify-between text-xs text-slate-400">
                  <span className="inline-flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                  <span className="font-mono text-[9px] uppercase">{user.id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Creation Modal - Cream theme */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#faf7f2] border border-[#eae3d2] rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#eae3d2] mb-6">
              <div className="flex items-center space-x-2 text-slate-800">
                <UserPlus className="w-5 h-5 text-[#b48a5e]" />
                <h3 className="font-bold text-lg">Add New User</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {modalError && (
              <div className="mb-4 flex items-start space-x-2 p-3 bg-rose-500/5 border border-rose-500/10 text-rose-700 text-xs rounded-xl">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2 px-4 text-sm text-slate-800 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alice@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2 px-4 text-sm text-slate-800 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Account Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2 px-4 text-sm text-slate-800 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  System Role
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('SELLER')}
                    className={`
                      py-2.5 rounded-xl border text-xs font-bold transition
                      ${role === 'SELLER'
                        ? 'border-[#b48a5e] bg-[#b48a5e]/5 text-slate-800'
                        : 'border-[#eae3d2] bg-white text-slate-500'}
                    `}
                  >
                    Seller (Buyer)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`
                      py-2.5 rounded-xl border text-xs font-bold transition
                      ${role === 'ADMIN'
                        ? 'border-[#b48a5e] bg-[#b48a5e]/5 text-slate-800'
                        : 'border-[#eae3d2] bg-white text-slate-500'}
                    `}
                  >
                    Admin (Supplier)
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex space-x-3 border-t border-[#eae3d2] mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-[#eae3d2] hover:bg-slate-55 bg-white text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#b48a5e] hover:bg-[#9e7950] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#b48a5e]/15 transition flex items-center justify-center"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
