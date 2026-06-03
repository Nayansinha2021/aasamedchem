'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Package, Search, Plus, Edit2, Trash2, IndianRupee, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  dimensionType: string;
  baseUnit: string;
  basePrice: string;
  inventoryQuantity: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Search & pagination state
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Actions state
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const fetchProducts = React.useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      search,
      page: page.toString(),
      limit: '8',
    });

    fetch(`/api/products?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load products');
        return res.json();
      })
      .then((data) => {
        setProducts(data.products);
        setTotalPages(data.pagination.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [search, page]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setDeletingId(id);
    setActionError(null);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete product');
      }

      fetchProducts();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800">Manage Product Catalog</h2>
            <p className="text-slate-500 mt-1">Create, edit, or delete items in the database inventory.</p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#b48a5e] hover:bg-[#9e7950] text-white text-sm font-semibold shadow-md shadow-[#b48a5e]/15 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>

        {actionError && (
          <div className="flex items-start space-x-3 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-750 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Search filter */}
        <div className="glass-panel rounded-2xl p-4 max-w-md bg-white border border-[#eae3d2]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog by SKU, name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition"
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="glass-panel rounded-2xl p-6 h-64 flex items-center justify-center animate-pulse bg-white border border-[#eae3d2]">
            <div className="w-8 h-8 border-4 border-[#b48a5e] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-700">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-[#eae3d2]/10 rounded-2xl border border-[#eae3d2]/40">
            No products found. Add a product to get started.
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden border border-[#eae3d2]/80 shadow-md bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#eae3d2] bg-[#faf7f2]/55 text-slate-550 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4 pl-6">Product Details</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Dim Type</th>
                    <th className="p-4 text-right">Base Price</th>
                    <th className="p-4 text-right">Inventory</th>
                    <th className="p-4 pr-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eae3d2]/60 text-sm text-slate-650">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-[#faf7f2]/55 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-800">{product.name}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">{product.sku}</td>
                      <td className="p-4 text-xs text-slate-500">{product.category}</td>
                      <td className="p-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-[#faf7f2] text-slate-600 font-semibold border border-[#eae3d2] text-[10px]">
                          {product.dimensionType}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-750">
                        <span className="inline-flex items-center">
                          <IndianRupee className="w-3 h-3 mr-0.5 text-slate-400" />
                          {Number(product.basePrice).toFixed(5)}
                          <span className="text-[10px] text-slate-500 font-normal">/{product.baseUnit}</span>
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-medium text-slate-800">
                        {Number(product.inventoryQuantity).toFixed(5)} <span className="text-xs text-slate-400 font-sans">{product.baseUnit}</span>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <div className="flex items-center justify-center space-x-3">
                          <Link
                            href={`/admin/products/edit/${product.id}`}
                            className="p-1.5 rounded-lg border border-[#eae3d2] hover:border-[#b48a5e] hover:text-[#b48a5e] bg-white text-slate-500 hover:bg-[#b48a5e]/5 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deletingId === product.id}
                            className="p-1.5 rounded-lg border border-[#eae3d2] hover:border-rose-500 hover:text-rose-600 bg-white text-slate-500 hover:bg-rose-500/5 transition disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === product.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#eae3d2] bg-[#faf7f2]/30 px-6 py-4">
                <span className="text-xs text-slate-500">Showing page {page} of {totalPages}</span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 rounded-lg border border-[#eae3d2] bg-white text-slate-500 hover:text-slate-800 disabled:opacity-30 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 rounded-lg border border-[#eae3d2] bg-white text-slate-500 hover:text-slate-800 disabled:opacity-30 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
