'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ArrowLeft, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  dimensionType: z.enum(['WEIGHT', 'VOLUME', 'COUNT']),
  baseUnit: z.string().min(1, 'Base unit is required'),
  basePrice: z.number().positive('Price must be greater than 0'),
  inventoryQuantity: z.number().nonnegative('Inventory cannot be negative'),
});

type ProductForm = z.infer<typeof productSchema>;

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [productId, setProductId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const selectedDimension = watch('dimensionType');

  // Enforce base units according to internal precision strategy
  React.useEffect(() => {
    if (selectedDimension === 'WEIGHT') {
      setValue('baseUnit', 'g');
    } else if (selectedDimension === 'VOLUME') {
      setValue('baseUnit', 'mL');
    } else if (selectedDimension === 'COUNT') {
      setValue('baseUnit', 'unit');
    }
  }, [selectedDimension, setValue]);

  React.useEffect(() => {
    params.then((p) => {
      setProductId(p.id);
    });
  }, [params]);

  React.useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/products?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        const prod = data.products.find((p: any) => p.id === productId);
        if (prod) {
          setValue('sku', prod.sku);
          setValue('name', prod.name);
          setValue('description', prod.description || '');
          setValue('category', prod.category);
          setValue('dimensionType', prod.dimensionType);
          setValue('baseUnit', prod.baseUnit);
          setValue('basePrice', Number(prod.basePrice));
          setValue('inventoryQuantity', Number(prod.inventoryQuantity));
          setLoading(false);
        } else {
          throw new Error('Product not found');
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [productId, setValue]);

  const onSubmit = async (data: ProductForm) => {
    if (!productId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update product');
      }

      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Navigation */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-xs font-semibold text-slate-550 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-800">Edit Product</h2>
            <p className="text-slate-500 mt-1">Modify stock item details or adjust inventory quantity.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="glass-panel bg-white rounded-2xl p-8 h-96 flex items-center justify-center animate-pulse border border-[#eae3d2]">
              <div className="w-8 h-8 border-4 border-[#b48a5e] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit(onSubmit)} className="glass-panel bg-white rounded-2xl p-8 border border-[#eae3d2]/80 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Product SKU */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Product SKU
                  </label>
                  <input
                    {...register('sku')}
                    type="text"
                    className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2.5 px-4 text-sm text-slate-700 placeholder-slate-400 outline-none"
                  />
                  {errors.sku && <span className="text-xs text-rose-500 mt-1 block">{errors.sku.message}</span>}
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Product Name
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2.5 px-4 text-sm text-slate-700 placeholder-slate-400 outline-none"
                  />
                  {errors.name && <span className="text-xs text-rose-500 mt-1 block">{errors.name.message}</span>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Category
                  </label>
                  <input
                    {...register('category')}
                    type="text"
                    className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2.5 px-4 text-sm text-slate-700 placeholder-slate-400 outline-none"
                  />
                  {errors.category && <span className="text-xs text-rose-500 mt-1 block">{errors.category.message}</span>}
                </div>

                {/* Dimension Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Dimension Type
                  </label>
                  <select
                    {...register('dimensionType')}
                    className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2.5 px-4 text-sm text-slate-700 outline-none"
                  >
                    <option value="WEIGHT">WEIGHT (Grams/kg)</option>
                    <option value="VOLUME">VOLUME (mL/L)</option>
                    <option value="COUNT">COUNT (units)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2.5 px-4 text-sm text-slate-700 placeholder-slate-400 outline-none"
                />
              </div>

              {/* Base Unit & Price Rules */}
              <div className="p-4 rounded-xl bg-[#b48a5e]/5 border border-[#b48a5e]/10 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Auto Assigned Base Unit */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Internal Base Unit
                  </label>
                  <input
                    {...register('baseUnit')}
                    type="text"
                    disabled
                    className="w-full bg-[#f4eee1] border border-[#eae3d2] rounded-xl py-2.5 px-4 text-sm text-slate-500 font-bold outline-none cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Fixed for precision rules</span>
                </div>

                {/* Base Price per Unit */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Price per Base Unit (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register('basePrice', { valueAsNumber: true })}
                    className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2.5 px-4 text-sm text-slate-700 outline-none"
                  />
                  {errors.basePrice && <span className="text-xs text-rose-500 mt-1 block">{errors.basePrice.message}</span>}
                </div>

                {/* Inventory Stock */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Current Inventory
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register('inventoryQuantity', { valueAsNumber: true })}
                    className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2.5 px-4 text-sm text-slate-700 outline-none"
                  />
                  {errors.inventoryQuantity && <span className="text-xs text-rose-500 mt-1 block">{errors.inventoryQuantity.message}</span>}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-[#b48a5e] to-[#cba37b] hover:from-[#9e7950] hover:to-[#b48a5e] disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 transition shadow-md shadow-[#b48a5e]/15"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
