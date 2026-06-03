'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Users,
  LogOut,
  Shield,
  Menu,
  X,
  Activity
} from 'lucide-react';

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const role = (session?.user as any)?.role || 'SELLER';
  const isAdmin = role === 'ADMIN';

  const sellerLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Browse Products', href: '/products', icon: Package },
    { name: 'My Quotations', href: '/quotations', icon: FileText },
    { name: 'My Orders', href: '/orders', icon: ShoppingCart },
  ];

  const adminLinks = [
    { name: 'Admin Overview', href: '/admin', icon: Shield },
    { name: 'Manage Products', href: '/admin/products', icon: Package },
    { name: 'All Quotations', href: '/admin/quotations', icon: FileText },
    { name: 'All Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
    { name: 'System Audit Logs', href: '/admin/logs', icon: Activity },
  ];

  const links = isAdmin ? adminLinks : sellerLinks;

  return (
    <>
      {/* Mobile Toggle Bar - Cream theme */}
      <div className="md:hidden flex items-center justify-between bg-[#f5f1e6] border-b border-[#eae3d2] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#b48a5e] to-[#d4b28f] flex items-center justify-center font-bold text-white shadow-md shadow-[#b48a5e]/20">
            A
          </div>
          <span className="font-semibold text-lg text-slate-800">AasaMedChem</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg border border-[#eae3d2] text-slate-650 hover:text-slate-900 bg-white"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Container - Cream theme */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-[#f5f1e6]/95 backdrop-blur-xl border-r border-[#eae3d2]/80 p-6 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Brand */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#b48a5e] to-[#d4b28f] flex items-center justify-center font-bold text-white shadow-md shadow-[#b48a5e]/20 text-xl">
              A
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-slate-800">AasaMedChem</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#b48a5e] mt-1 block">
                {role} Panel
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-[#b48a5e] text-white shadow-sm shadow-[#b48a5e]/15'
                      : 'text-slate-600 hover:bg-[#eae3d2]/40 hover:text-slate-900'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Log out */}
        <div className="mt-auto border-t border-[#eae3d2]/80 pt-4">
          <div className="flex items-center space-x-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4b28f] to-[#b48a5e] flex items-center justify-center font-semibold text-sm text-white">
              {session?.user?.name ? session.user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-none text-slate-800">{session?.user?.name}</p>
              <p className="text-xs truncate text-slate-500 mt-1">{session?.user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-500/5 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden"
        />
      )}
    </>
  );
}
