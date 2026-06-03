'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#faf7f2]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#b48a5e] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-medium tracking-wide">Loading AasaMedChem...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#faf7f2] text-slate-800 animated-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
