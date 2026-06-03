'use client';

import React, { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Mail, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredSuccess = searchParams.get('registered') === 'success';
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  React.useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (res?.error) {
        setError(res.error || 'Invalid credentials');
      } else {
        // Redirection handled by useEffect
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to quick-fill credentials for reviewers
  const handleQuickFill = (role: 'admin' | 'seller') => {
    if (role === 'admin') {
      setValue('email', 'admin@aasamedchem.com');
      setValue('password', 'Admin@123');
    } else {
      setValue('email', 'seller@aasamedchem.com');
      setValue('password', 'Seller@123');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#faf7f2] relative overflow-hidden px-4">
      {/* Background ambient glowing warm circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#b48a5e]/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-[#d4b28f]/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md">
        {/* Brand/Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#b48a5e] to-[#d4b28f] flex items-center justify-center font-bold text-white shadow-md shadow-[#b48a5e]/15 text-2xl mx-auto mb-4">
            A
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            AasaMedChem Portal
          </h1>
          <p className="text-sm text-slate-500 mt-2">Inventory & Order Management Platform</p>
        </div>

        {/* Login Form Card */}
        <div className="glass-panel bg-white/90 rounded-2xl p-8 shadow-xl relative border border-[#eae3d2]">
          <h2 className="text-lg font-semibold text-slate-850 mb-6">Sign In to Your Account</h2>

          {registeredSuccess && (
            <div className="mb-6 flex items-start space-x-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-550/10 text-emerald-700 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Account created successfully! Please sign in.</span>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start space-x-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-700 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-3 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200"
                />
              </div>
              {errors.email && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.email.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-3 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200"
                />
              </div>
              {errors.password && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.password.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#b48a5e] to-[#cba37b] hover:from-[#9c754d] hover:to-[#b48a5e] disabled:opacity-50 text-white font-medium rounded-xl py-3 px-4 shadow-md shadow-[#b48a5e]/15 flex items-center justify-center space-x-2 transition-all duration-300 group mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Sign up redirection Link */}
          <div className="mt-5 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#b48a5e] font-semibold hover:underline">
              Register here
            </Link>
          </div>

          {/* Quick-Fill buttons for testing */}
          <div className="mt-6 pt-5 border-t border-[#eae3d2]">
            <span className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-3">
              Developer Demo Access
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="text-xs py-2 px-3 rounded-lg border border-[#eae3d2] hover:border-[#b48a5e]/30 hover:bg-[#b48a5e]/5 text-slate-650 font-medium transition-all"
              >
                Fill Admin Credentials
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('seller')}
                className="text-xs py-2 px-3 rounded-lg border border-[#eae3d2] hover:border-[#b48a5e]/30 hover:bg-[#b48a5e]/5 text-slate-650 font-medium transition-all"
              >
                Fill Seller Credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#faf7f2]">
        <div className="w-12 h-12 border-4 border-[#b48a5e] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
