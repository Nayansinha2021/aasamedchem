'use client';

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';
import { Search, Filter, ShoppingCart, Plus, Minus, Trash2, IndianRupee, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

interface CartItem {
  product: Product;
  quantity: number;
  unit: string;
}

export default function ProductBrowser() {
  const router = useRouter();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [dimensionType, setDimensionType] = React.useState('');
  const [sortBy, setSortBy] = React.useState('recently_added');
  const [sortOrder, setSortOrder] = React.useState('desc');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Cart State (stored in memory, optionally localStorage)
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [submittingQuote, setSubmittingQuote] = React.useState(false);
  const [quoteError, setQuoteError] = React.useState<string | null>(null);

  // Available categories (derived or mock, but let's derive it or use a default list)
  const categories = [
    'Organic Compound',
    'Inorganic Salt',
    'Inorganic Base',
    'Organic Acid',
    'Element',
    'Alcohol / Solvent',
    'Ketone / Solvent',
    'Solvent',
    'Inorganic Acid',
    'Alcohol / Polyol',
    'Glassware',
    'Lab Equipment',
    'Consumables',
  ];

  // Fetch products
  const fetchProducts = React.useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      search,
      category,
      dimensionType,
      sortBy,
      sortOrder,
      page: page.toString(),
      limit: '6',
    });

    fetch(`/api/products?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch products');
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
  }, [search, category, dimensionType, sortBy, sortOrder, page]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300); // debounce API calls for search input
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Cart Handlers
  const addToCart = (product: Product) => {
    const defaultUnit = product.baseUnit;
    const existing = cart.find((item) => item.product.id === product.id);

    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1, unit: defaultUnit }]);
    }
    setCartOpen(true);
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
    } else {
      setCart(
        cart.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
      );
    }
  };

  const updateCartUnit = (productId: string, unit: string) => {
    setCart(
      cart.map((item) => (item.product.id === productId ? { ...item, unit } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Convert unit & calculate price helper for preview
  const getPreviewMath = (item: CartItem) => {
    const { product, quantity, unit } = item;
    const q = new Decimal(quantity);
    const bp = new Decimal(product.basePrice);

    let baseQty = q;
    if (unit === 'kg' || unit === 'L') {
      baseQty = q.mul(1000);
    }

    const subtotal = baseQty.mul(bp);
    return {
      baseQty,
      subtotal,
    };
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => {
      const { subtotal } = getPreviewMath(item);
      return total.plus(subtotal);
    }, new Decimal(0));
  };

  const submitQuotation = async () => {
    if (cart.length === 0) return;
    setSubmittingQuote(true);
    setQuoteError(null);

    const payload = {
      items: cart.map((item) => ({
        productId: item.product.id,
        orderedQuantity: item.quantity,
        orderedUnit: item.unit,
      })),
    };

    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit quotation');
      }

      setCart([]);
      setCartOpen(false);
      router.push('/quotations');
    } catch (err: any) {
      setQuoteError(err.message);
    } finally {
      setSubmittingQuote(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-8 relative">
        {/* Main Product Listing Area */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-800">Product Catalog</h2>
              <p className="text-slate-500 mt-1">Browse, search, and select chemicals and labware.</p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCartOpen(!cartOpen)}
                className="lg:hidden flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#b48a5e] hover:bg-[#9e7950] text-white font-medium text-sm transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>View Quotation ({cart.length})</span>
              </button>
            )}
          </div>

          {/* Search, Filter, Sort Controls */}
          <div className="glass-panel rounded-2xl p-5 bg-white border border-[#eae3d2] grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by SKU, name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Dimension Filter */}
            <div>
              <select
                value={dimensionType}
                onChange={(e) => { setDimensionType(e.target.value); setPage(1); }}
                className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2 px-4 text-sm text-slate-700 outline-none transition"
              >
                <option value="">All Dimension Types</option>
                <option value="WEIGHT">Weight</option>
                <option value="VOLUME">Volume</option>
                <option value="COUNT">Count</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                  setPage(1);
                }}
                className="w-full bg-[#faf7f2] border border-[#eae3d2] focus:border-[#b48a5e] rounded-xl py-2 px-4 text-sm text-slate-700 outline-none transition"
              >
                <option value="recently_added-desc">Recently Added</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 bg-[#eae3d2]/20 rounded-2xl border border-[#eae3d2]/60 animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl text-rose-700 text-sm">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-[#eae3d2]/10 rounded-2xl border border-[#eae3d2]/40">
              No products found matching filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((product) => {
                  const numericPrice = Number(product.basePrice);
                  const isOutOfStock = Number(product.inventoryQuantity) <= 0;

                  return (
                    <div key={product.id} className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between relative bg-white border border-[#eae3d2]">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-[10px] font-bold tracking-widest text-[#b48a5e] uppercase px-2 py-0.5 bg-[#b48a5e]/10 border border-[#b48a5e]/20 rounded-md">
                            {product.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{product.sku}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mt-3">{product.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description || 'No description provided.'}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#eae3d2]/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Base Price</span>
                          <div className="flex items-center text-[#b48a5e] font-bold text-lg mt-0.5">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-[#b48a5e]/80" />
                            <span>{numericPrice.toFixed(5)}</span>
                            <span className="text-xs text-slate-500 font-normal">/{product.baseUnit}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Stock Available</span>
                          <span className={`text-sm font-semibold block mt-0.5 ${isOutOfStock ? 'text-rose-600' : 'text-slate-650'}`}>
                            {Number(product.inventoryQuantity).toFixed(2)} {product.baseUnit}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-3">
                        <Link href={`/products/${product.id}`} className="flex-1 text-center py-2 rounded-xl text-xs font-semibold border border-[#eae3d2] text-slate-600 hover:text-slate-900 hover:border-[#b48a5e]/55 transition">
                          View details
                        </Link>
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="flex-1 bg-[#b48a5e] hover:bg-[#9e7950] text-white font-semibold py-2 rounded-xl text-xs shadow-md shadow-[#b48a5e]/15 transition"
                        >
                          Add to quote
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 pt-6">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 rounded-xl border border-[#eae3d2] hover:border-[#b48a5e]/60 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-slate-500">Page {page} of {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 rounded-xl border border-[#eae3d2] hover:border-[#b48a5e]/60 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition bg-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Side Drawer for Cart - Cream theme */}
        <div className={`
          fixed lg:sticky top-0 lg:top-8 right-0 h-screen lg:h-[calc(100vh-4rem)] w-full sm:w-96 bg-[#fdfbf9] border-l lg:border border-[#eae3d2] shadow-2xl p-6 lg:rounded-2xl z-40 flex flex-col justify-between transition-all duration-300
          ${cartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:opacity-0 lg:pointer-events-none lg:w-0 lg:p-0 lg:border-none'}
        `}>
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center pb-4 border-b border-[#eae3d2]">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-[#b48a5e]" />
                <h3 className="font-bold text-slate-800 text-lg">Quotation Request</h3>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="lg:hidden text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg border border-[#eae3d2]"
              >
                Close
              </button>
            </div>

            {quoteError && (
              <div className="mt-4 flex items-start space-x-2 p-3 bg-rose-500/5 border border-rose-500/10 text-rose-700 text-xs rounded-xl">
                <Trash2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{quoteError}</span>
              </div>
            )}

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <ShoppingCart className="w-12 h-12 text-[#eae3d2] mb-4" />
                  <p className="text-sm text-slate-400 font-medium">Your quotation request is empty.</p>
                  <p className="text-xs text-slate-500 mt-1">Add items from the catalog.</p>
                </div>
              ) : (
                cart.map((item) => {
                  const { subtotal } = getPreviewMath(item);
                  const dt = item.product.dimensionType;

                  // Define available units based on type
                  const units =
                    dt === 'WEIGHT'
                      ? ['g', 'kg']
                      : dt === 'VOLUME'
                      ? ['mL', 'L']
                      : ['unit'];

                  return (
                    <div key={item.product.id} className="p-4 rounded-xl bg-white border border-[#eae3d2] space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="pr-6">
                        <h4 className="font-semibold text-sm text-slate-800 truncate">{item.product.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.product.sku}</span>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2">
                        {/* Quantity input controls */}
                        <div className="flex items-center border border-[#eae3d2] rounded-lg overflow-hidden bg-[#faf7f2]">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.product.id, item.quantity - 0.5)}
                            className="p-1 px-2 text-slate-500 hover:text-slate-850 hover:bg-[#eae3d2]/40 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            step="0.00001"
                            value={item.quantity}
                            onChange={(e) => updateCartQty(item.product.id, parseFloat(e.target.value) || 0)}
                            className="w-16 text-center text-xs font-semibold text-slate-700 bg-transparent outline-none py-1 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.product.id, item.quantity + 0.5)}
                            className="p-1 px-2 text-slate-500 hover:text-slate-850 hover:bg-[#eae3d2]/40 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Unit selector */}
                        <select
                          value={item.unit}
                          onChange={(e) => updateCartUnit(item.product.id, e.target.value)}
                          className="bg-white border border-[#eae3d2] text-xs text-slate-700 rounded-lg p-1.5 outline-none focus:border-[#b48a5e]"
                        >
                          {units.map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-[#eae3d2]/60 text-xs">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="font-bold text-slate-800">
                          ₹{subtotal.toFixed(5)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cart footer */}
          {cart.length > 0 && (
            <div className="pt-4 border-t border-[#eae3d2] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-500">Total Price:</span>
                <span className="text-xl font-black text-slate-800 flex items-center">
                  <IndianRupee className="w-4 h-4 mr-0.5 text-slate-500" />
                  {calculateCartTotal().toFixed(5)}
                </span>
              </div>

              <button
                type="button"
                disabled={submittingQuote}
                onClick={submitQuotation}
                className="w-full bg-[#b48a5e] hover:bg-[#9e7950] text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 transition shadow-md shadow-[#b48a5e]/15 disabled:opacity-50"
              >
                {submittingQuote ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Generate Quotation</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
