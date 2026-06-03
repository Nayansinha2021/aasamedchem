'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ArrowLeft, IndianRupee, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Decimal } from 'decimal.js';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  dimensionType: 'WEIGHT' | 'VOLUME' | 'COUNT';
  baseUnit: string;
  basePrice: string;
  inventoryQuantity: string;
}

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Conversion calculator state
  const [inputQty, setInputQty] = React.useState('1');
  const [selectedUnit, setSelectedUnit] = React.useState('');

  const [productId, setProductId] = React.useState<string | null>(null);

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
        const pItem = data.products.find((item: any) => item.id === productId);
        if (pItem) {
          setProduct(pItem);
          setSelectedUnit(pItem.baseUnit);
        } else {
          throw new Error('Product not found');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [productId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#b48a5e] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !product) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Link href="/products" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
          </Link>
          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-700">
            {error || 'Product not found'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const dt = product.dimensionType;
  const units =
    dt === 'WEIGHT'
      ? ['g', 'kg']
      : dt === 'VOLUME'
      ? ['mL', 'L']
      : ['unit'];

  // Conversion math
  const getCalculatorResults = () => {
    try {
      const q = new Decimal(inputQty || '0');
      if (q.isNaN() || q.isNegative()) return null;

      let baseQty = q;
      if (selectedUnit === 'kg' || selectedUnit === 'L') {
        baseQty = q.mul(1000);
      }

      const bp = new Decimal(product.basePrice);
      const totalCost = baseQty.mul(bp);

      return {
        baseQty,
        totalCost,
      };
    } catch {
      return null;
    }
  };

  const calc = getCalculatorResults();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Navigation */}
        <Link href="/products" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalog
        </Link>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-8 space-y-6 bg-white border border-[#eae3d2]">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold tracking-widest text-[#b48a5e] uppercase px-2.5 py-0.5 bg-[#b48a5e]/10 border border-[#b48a5e]/20 rounded-md">
                  {product.category}
                </span>
                <span className="text-xs font-mono text-slate-400">SKU: {product.sku}</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 mt-4">{product.name}</h2>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Description</h3>
              <p className="text-sm text-slate-650 leading-relaxed bg-[#faf7f2]/60 p-4 rounded-xl border border-[#eae3d2]/60">
                {product.description || 'No description available for this chemical/item.'}
              </p>
            </div>

            {/* Product Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-[#eae3d2]/60">
              <div>
                <span className="text-xs text-slate-400 block">Dimension Type</span>
                <span className="text-sm font-bold text-slate-700 mt-1 block">{product.dimensionType}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Base Unit</span>
                <span className="text-sm font-bold text-slate-700 mt-1 block">{product.baseUnit}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Base Price</span>
                <span className="text-sm font-bold text-slate-700 mt-1 block">₹{Number(product.basePrice).toFixed(5)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Available Stock</span>
                <span className="text-sm font-bold text-slate-700 mt-1 block">
                  {Number(product.inventoryQuantity).toFixed(5)} {product.baseUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Conversion Tool */}
          <div className="glass-panel rounded-2xl p-6 h-fit space-y-6 bg-white border border-[#eae3d2]">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Interactive Converter</h3>
              <p className="text-xs text-slate-500 mt-1">Verify conversions and calculate prices in real-time.</p>
            </div>

            <div className="space-y-4">
              {/* Input quantity */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Enter Quantity
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={inputQty}
                    onChange={(e) => setInputQty(e.target.value)}
                    className="flex-1 bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2 px-3 text-sm text-slate-700 outline-none"
                    placeholder="1.00"
                    step="any"
                  />
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="bg-[#faf7f2] border border-[#eae3d2] text-xs text-slate-700 rounded-xl p-2 outline-none focus:border-[#b48a5e]"
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversion Preview */}
              {calc && (
                <div className="p-4 rounded-xl bg-[#faf7f2]/80 border border-[#eae3d2] space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Internal Base Quantity:</span>
                    <span className="font-semibold text-slate-700">
                      {calc.baseQty.toFixed(5)} {product.baseUnit}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-[#eae3d2]/60">
                    <span className="text-slate-500 font-semibold">Total Price:</span>
                    <span className="text-lg font-black text-slate-850 flex items-center">
                      <IndianRupee className="w-4 h-4 mr-0.5 text-slate-500" />
                      {calc.totalCost.toFixed(5)}
                    </span>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-500 bg-[#b48a5e]/5 border border-[#b48a5e]/10 p-3 rounded-xl leading-relaxed">
                <strong>Pricing rule:</strong> Stored internally at <strong>₹{Number(product.basePrice).toFixed(5)}</strong> per <strong>{product.baseUnit}</strong>.
                Quantities are converted to base unit before calculations to preserve 5 decimal accuracy.
              </div>

              <Link href="/products" className="w-full bg-[#b48a5e] hover:bg-[#9e7950] text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-[#b48a5e]/15">
                <ShoppingCart className="w-4 h-4" />
                <span>Open Catalog to Add</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
