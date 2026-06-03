'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { User, Mail, KeyRound, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be under 50 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SELLER', 'ADMIN']),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'SELLER',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to register account');
      }

      // Successful registration -> redirect to login page
      router.push('/login?registered=success');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#faf7f2] relative overflow-hidden px-4 py-8">
      {/* Background ambient glowing warm circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#b48a5e]/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-[#d4b28f]/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md">
        {/* Brand/Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#b48a5e] to-[#d4b28f] flex items-center justify-center font-bold text-white shadow-md shadow-[#b48a5e]/15 text-2xl mx-auto mb-4">
            A
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Create an Account
          </h1>
          <p className="text-sm text-slate-500 mt-2">Join AasaMedChem Inventory & Order Portal</p>
        </div>

        {/* Register Form Card */}
        <div className="glass-panel bg-white/90 rounded-2xl p-8 shadow-xl relative border border-[#eae3d2]">
          <h2 className="text-lg font-semibold text-slate-850 mb-6">Sign Up for Access</h2>

          {error && (
            <div className="mb-6 flex items-start space-x-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-700 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('name')}
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-3 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200"
                />
              </div>
              {errors.name && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.name.message}</span>
              )}
            </div>

            {/* Email Address */}
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

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="At least 6 characters"
                  className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-3 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200"
                />
              </div>
              {errors.password && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.password.message}</span>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`
                  flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center
                  ${watch('role') === 'SELLER'
                    ? 'border-[#b48a5e] bg-[#b48a5e]/5 text-slate-800'
                    : 'border-[#eae3d2] bg-transparent text-slate-505'}
                `}>
                  <input
                    {...register('role')}
                    type="radio"
                    value="SELLER"
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">Seller</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Places quotes & orders</span>
                </label>

                <label className={`
                  flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center
                  ${watch('role') === 'ADMIN'
                    ? 'border-[#b48a5e] bg-[#b48a5e]/5 text-slate-800'
                    : 'border-[#eae3d2] bg-transparent text-slate-505'}
                `}>
                  <input
                    {...register('role')}
                    type="radio"
                    value="ADMIN"
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">Admin</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Manages stock & approvals</span>
                </label>
              </div>
              {errors.role && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.role.message}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#b48a5e] to-[#cba37b] hover:from-[#9c754d] hover:to-[#b48a5e] disabled:opacity-50 text-white font-medium rounded-xl py-3 px-4 shadow-md shadow-[#b48a5e]/15 flex items-center justify-center space-x-2 transition-all duration-300 group mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Register Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Links back to login */}
          <div className="mt-6 pt-4 border-t border-[#eae3d2] text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-[#b48a5e] font-semibold hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
