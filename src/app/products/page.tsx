'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast, confirmAction } from '@/utils/toast';

interface Product {
  id: string;
  name: string;
  metalType: string;
  purity: string;
  grossWeight: number;
  netWeight: number;
  barcode: string;
  huid?: string;
  tagNumber?: string;
  wastagePercent: number;
  makingCharges: number;
  stoneValue?: number;
  collectionName?: string;
  calculatedPrice?: number;
  priceOverride?: number;
  lastPriceUpdate?: string;
  isActive: boolean;
  isCustomOrder: boolean;
  supplier?: { id: string; name: string };
  _count?: { stockItems: number };
}

interface Filters {
  search: string;
  metalType: string;
  purity: string;
  collectionName: string;
  stockStatus: string;
  isActive: string;
  lowStock: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    metalType: '',
    purity: '',
    collectionName: '',
    stockStatus: '',
    isActive: '',
    lowStock: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/products?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setProducts(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchProducts();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      metalType: '',
      purity: '',
      collectionName: '',
      stockStatus: '',
      isActive: '',
      lowStock: '',
    });
    setTimeout(() => fetchProducts(), 100);
  };

  const viewPriceBreakdown = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/price-breakdown`);
      const result = await response.json();
      
      if (result.success) {
        setPriceBreakdown(result.data);
        const product = products.find(p => p.id === productId);
        setSelectedProduct(product || null);
      }
    } catch (err: any) {
      toast.error('Error loading price breakdown: ' + err.message);
    }
  };

  const recalculatePrices = async () => {
    const confirmed = await confirmAction('Recalculate prices for all active products based on current rates?', 'Recalculate Prices');
    if (!confirmed) return;
    
    try {
      setRecalculating(true);
      const response = await fetch('/api/products/recalculate-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyOutdated: true }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully updated ${result.data.updated} products. Skipped ${result.data.skipped} products.`);
        fetchProducts();
      } else {
        toast.error('Error: ' + result.error?.message);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const closePriceBreakdown = () => {
    setPriceBreakdown(null);
    setSelectedProduct(null);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowFormModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowFormModal(true);
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">💍 Product Management</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Manage jewelry products with auto-pricing and compliance tracking
          </p>
        </div>
        <div className="nav-actions">
          <Link href="/" className="button button-outline" style={{ textDecoration: 'none' }}>
            ← Home
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Search & Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ padding: '6px 12px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Search by name, barcode, HUID, tag number..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button onClick={applyFilters} className="button" style={{ padding: '8px 20px' }}>
            Search
          </button>
          <button onClick={clearFilters} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Clear
          </button>
        </div>

        {showFilters && (
          <div className="responsive-grid responsive-grid-3" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>Metal Type</label>
              <select
                value={filters.metalType}
                onChange={(e) => handleFilterChange('metalType', e.target.value)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">All</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="PLATINUM">Platinum</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>Purity</label>
              <select
                value={filters.purity}
                onChange={(e) => handleFilterChange('purity', e.target.value)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">All</option>
                <option value="24k">24K</option>
                <option value="22k">22K</option>
                <option value="18k">18K</option>
                <option value="14k">14K</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>Collection</label>
              <input
                type="text"
                value={filters.collectionName}
                onChange={(e) => handleFilterChange('collectionName', e.target.value)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>Stock Status</label>
              <select
                value={filters.stockStatus}
                onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">All</option>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="SOLD">Sold</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#666' }}>Low Stock</label>
              <select
                value={filters.lowStock}
                onChange={(e) => handleFilterChange('lowStock', e.target.value)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Products ({products.length})</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={recalculatePrices}
              disabled={recalculating}
              style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: recalculating ? 'not-allowed' : 'pointer' }}
            >
              {recalculating ? 'Recalculating...' : '🔄 Recalculate Prices'}
            </button>
            <button className="button" onClick={handleAddProduct}>+ Add Product</button>
          </div>
        </div>

        {loading && <p>Loading products...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!loading && !error && products.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
            No products found. Try adjusting your filters or add your first product.
          </p>
        )}

        {!loading && !error && products.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', 
            gap: '20px' 
          }}>
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Status Badges */}
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                  <span style={{
                    padding: '4px 8px',
                    background: product.isActive ? '#d5f4e6' : '#ffcdd2',
                    color: product.isActive ? '#00b894' : '#d32f2f',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {product.isActive ? '✓ Active' : '✕ Inactive'}
                  </span>
                  {product.isCustomOrder && (
                    <span style={{ 
                      fontSize: '11px', 
                      background: '#fff3cd', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      CUSTOM
                    </span>
                  )}
                </div>

                {/* Product Name */}
                <h3 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '18px', 
                  fontWeight: 600,
                  color: '#333',
                  paddingRight: product.isCustomOrder ? '140px' : '80px'
                }}>
                  {product.name}
                </h3>

                {/* Collection */}
                {product.collectionName && (
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#666', 
                    marginBottom: '12px',
                    fontWeight: 500
                  }}>
                    📚 {product.collectionName}
                  </div>
                )}

                {/* Metal & Purity */}
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  marginBottom: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ 
                    background: '#fff3e0', 
                    padding: '6px 12px', 
                    borderRadius: '6px',
                    flex: '1 1 auto'
                  }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Metal/Purity</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f57c00' }}>
                      {product.metalType} {product.purity}
                    </div>
                  </div>
                  <div style={{ 
                    background: '#e8f5e9', 
                    padding: '6px 12px', 
                    borderRadius: '6px',
                    flex: '1 1 auto'
                  }}>
                    <div style={{ fontSize: '11px', color: '#666' }}>Stock</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#2e7d32' }}>
                      {product._count?.stockItems || 0} items
                    </div>
                  </div>
                </div>

                {/* Weight Details */}
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>Net Weight:</span>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{Number(product.netWeight).toFixed(3)}g</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>Gross Weight:</span>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{Number(product.grossWeight).toFixed(3)}g</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>Wastage:</span>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{Number(product.wastagePercent)}%</span>
                  </div>
                </div>

                {/* Price */}
                <div style={{ 
                  background: product.priceOverride ? '#fff3e0' : '#e3f2fd', 
                  padding: '12px', 
                  borderRadius: '6px',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                    {product.priceOverride ? 'OVERRIDE PRICE' : 'Calculated Price'}
                  </div>
                  {product.priceOverride ? (
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#f57c00' }}>
                      ₹{Number(product.priceOverride).toLocaleString('en-IN')}
                    </div>
                  ) : product.calculatedPrice ? (
                    <>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#0070f3' }}>
                        ₹{Number(product.calculatedPrice).toLocaleString('en-IN')}
                      </div>
                      {product.lastPriceUpdate && (
                        <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                          Updated: {new Date(product.lastPriceUpdate).toLocaleDateString()}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: '14px', color: '#999' }}>Price not set</div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: 'auto' 
                }}>
                  <button
                    onClick={() => viewPriceBreakdown(product.id)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#0070f3',
                      border: 'none',
                      color: 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#0051cc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#0070f3'}
                  >
                    💰 Price
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: '#28a745',
                      border: 'none',
                      color: 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#218838'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#28a745'}
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Breakdown Modal */}
      {priceBreakdown && selectedProduct && (
        <div className="modal-overlay" onClick={closePriceBreakdown}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Price Breakdown: {selectedProduct.name}</h2>
              <button onClick={closePriceBreakdown} className="modal-close">×</button>
            </div>

            {/* Current Price Calculation */}
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
              <h3 style={{ marginTop: 0 }}>Current Rate Calculation</h3>
              <table style={{ width: '100%', fontSize: '14px' }}>
                <tbody>
                  <tr>
                    <td>Net Weight:</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      {priceBreakdown.currentPriceCalculation.netWeight.toFixed(3)} g
                    </td>
                  </tr>
                  <tr>
                    <td>Wastage ({priceBreakdown.currentPriceCalculation.wastagePercent}%):</td>
                    <td style={{ textAlign: 'right' }}>
                      {(
                        priceBreakdown.currentPriceCalculation.effectiveWeight -
                        priceBreakdown.currentPriceCalculation.netWeight
                      ).toFixed(3)}{' '}
                      g
                    </td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #ddd' }}>
                    <td style={{ paddingTop: '8px', fontWeight: 500 }}>Effective Weight:</td>
                    <td style={{ textAlign: 'right', fontWeight: 500, paddingTop: '8px' }}>
                      {priceBreakdown.currentPriceCalculation.effectiveWeight.toFixed(3)} g
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingTop: '8px' }}>
                      Metal Rate (₹/g) - {priceBreakdown.currentRate.rateSource}:
                    </td>
                    <td style={{ textAlign: 'right', paddingTop: '8px' }}>
                      ₹{priceBreakdown.currentRate.ratePerGram.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr style={{ background: '#e3f2fd' }}>
                    <td style={{ padding: '8px 0', fontWeight: 500 }}>Metal Amount:</td>
                    <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 500 }}>
                      ₹{priceBreakdown.currentPriceCalculation.metalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td>Making Charges:</td>
                    <td style={{ textAlign: 'right' }}>
                      ₹{priceBreakdown.currentPriceCalculation.makingCharges.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {priceBreakdown.currentPriceCalculation.stoneValue > 0 && (
                    <tr>
                      <td>Stone Value:</td>
                      <td style={{ textAlign: 'right' }}>
                        ₹{priceBreakdown.currentPriceCalculation.stoneValue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '2px solid #333', background: '#c8e6c9' }}>
                    <td style={{ padding: '10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                      TOTAL PRICE:
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '10px 0',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}
                    >
                      ₹{priceBreakdown.currentPriceCalculation.totalPrice.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Price Status */}
            {priceBreakdown.priceStatus.isOverridden && (
              <div
                style={{
                  background: '#fff3cd',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  border: '1px solid #ffc107',
                }}
              >
                <strong>⚠️ Price Override Active</strong>
                <div style={{ marginTop: '8px' }}>
                  Override Price: ₹{priceBreakdown.product.priceOverride.toLocaleString('en-IN')}
                </div>
                {priceBreakdown.product.priceOverrideReason && (
                  <div style={{ marginTop: '4px', fontSize: '13px' }}>
                    Reason: {priceBreakdown.product.priceOverrideReason}
                  </div>
                )}
              </div>
            )}

            {priceBreakdown.priceStatus.isOutdated && !priceBreakdown.priceStatus.isOverridden && (
              <div
                style={{
                  background: '#ffebee',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  border: '1px solid #f44336',
                }}
              >
                <strong>⚠️ Price Outdated</strong>
                <div style={{ marginTop: '8px', fontSize: '14px' }}>
                  Stored Price: ₹
                  {priceBreakdown.storedPrice.calculatedPrice?.toLocaleString('en-IN') || 'N/A'}
                </div>
                <div style={{ fontSize: '14px' }}>
                  Current Price: ₹{priceBreakdown.currentPriceCalculation.totalPrice.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#d32f2f' }}>
                  Difference: ₹{Math.abs(priceBreakdown.priceStatus.priceDifference).toLocaleString('en-IN')}
                  {priceBreakdown.priceStatus.priceDifference > 0 ? ' ↑' : ' ↓'}
                </div>
              </div>
            )}

            <div style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
              {priceBreakdown.product.lastPriceUpdate && (
                <div>
                  Last Price Update: {new Date(priceBreakdown.product.lastPriceUpdate).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showFormModal && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => {
            setShowFormModal(false);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}

// Product Form Modal Component
function ProductFormModal({ product, onClose, onSuccess }: {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    metalType: product?.metalType || 'GOLD',
    purity: product?.purity || '22K',
    grossWeight: product?.grossWeight?.toString() || '',
    netWeight: product?.netWeight?.toString() || '',
    barcode: product?.barcode || '',
    huid: product?.huid || '',
    wastagePercent: product?.wastagePercent?.toString() || '',
    makingCharges: product?.makingCharges?.toString() || '',
    stoneValue: product?.stoneValue?.toString() || '',
    collectionName: product?.collectionName || '',
    supplierId: product?.supplier?.id || '',
    isActive: product?.isActive ?? true,
    isCustomOrder: product?.isCustomOrder ?? false,
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const generateBarcode = async () => {
    if (!formData.metalType || !formData.purity) {
      toast.warning('Please select Metal Type and Purity first');
      return;
    }

    setGenerating(true);
    try {
      // Generate based on metal type and purity
      const metal = formData.metalType;
      const purity = formData.purity.replace(/[^0-9A-Z]/gi, '');
      
      // Try to get next sequential number by checking existing products
      const response = await fetch(`/api/products?metalType=${metal}&purity=${formData.purity}&pageSize=1000`);
      const result = await response.json();
      
      let nextNumber = 1;
      if (result.success && result.data) {
        const products = result.data.data || result.data;
        // Find products with similar barcode pattern
        const pattern = new RegExp(`^${metal}-${purity}-(\\d+)$`);
        const existingNumbers = products
          .map((p: any) => {
            const match = p.barcode?.match(pattern);
            return match ? parseInt(match[1]) : 0;
          })
          .filter((n: number) => n > 0);
        
        if (existingNumbers.length > 0) {
          nextNumber = Math.max(...existingNumbers) + 1;
        }
      }
      
      const generatedBarcode = `${metal}-${purity}-${nextNumber.toString().padStart(3, '0')}`;
      setFormData({ ...formData, barcode: generatedBarcode });
    } catch (error) {
      console.error('Error generating barcode:', error);
      // Fallback to timestamp-based
      const metal = formData.metalType;
      const purity = formData.purity.replace(/[^0-9A-Z]/gi, '');
      const timestamp = Date.now().toString().slice(-6);
      const generatedBarcode = `${metal}-${purity}-${timestamp}`;
      setFormData({ ...formData, barcode: generatedBarcode });
    } finally {
      setGenerating(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers?isActive=true');
      const result = await response.json();
      if (result.success) {
        setSuppliers(result.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        metalType: formData.metalType,
        purity: formData.purity,
        grossWeight: parseFloat(formData.grossWeight),
        netWeight: parseFloat(formData.netWeight),
        barcode: formData.barcode,
        huid: formData.huid || undefined,
        wastagePercent: parseFloat(formData.wastagePercent) || 0,
        makingCharges: parseFloat(formData.makingCharges) || 0,
        stoneValue: formData.stoneValue ? parseFloat(formData.stoneValue) : undefined,
        collectionName: formData.collectionName || undefined,
        supplierId: formData.supplierId || undefined,
        isActive: formData.isActive,
        isCustomOrder: formData.isCustomOrder,
      };

      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(product ? 'Product updated successfully!' : 'Product created successfully!');
        onSuccess();
      } else {
        if (result.error?.errors) {
          const errorMap: any = {};
          result.error.errors.forEach((err: any) => {
            errorMap[err.path?.[0] || 'general'] = err.message;
          });
          setErrors(errorMap);
        } else {
          toast.error(result.error?.message || 'Failed to save product');
        }
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
            Basic Information
          </h3>

          <div className="responsive-grid responsive-grid-2" style={{ marginBottom: '20px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Product Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="e.g., Gold Necklace 22K"
              />
              {errors.name && <span style={{ color: 'red', fontSize: '12px' }}>{errors.name}</span>}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Metal Type <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                required
                value={formData.metalType}
                onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="PLATINUM">Platinum</option>
              </select>
              {!formData.barcode && (
                <div style={{ fontSize: '11px', color: '#ff9800', marginTop: '4px' }}>
                  💡 Select metal & purity, then click Generate
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Purity <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.purity}
                onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="e.g., 22K, 18K, 999"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Gross Weight (g) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                step="0.001"
                required
                value={formData.grossWeight}
                onChange={(e) => setFormData({ ...formData, grossWeight: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Net Weight (g) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                step="0.001"
                required
                value={formData.netWeight}
                onChange={(e) => setFormData({ ...formData, netWeight: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Wastage (%) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.wastagePercent}
                onChange={(e) => setFormData({ ...formData, wastagePercent: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Making Charges (₹) <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.makingCharges}
                onChange={(e) => setFormData({ ...formData, makingCharges: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Stone Value (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.stoneValue}
                onChange={(e) => setFormData({ ...formData, stoneValue: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          </div>

          <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
            Identifiers
          </h3>

          <div style={{ background: '#fff3cd', padding: '12px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px', lineHeight: '1.6' }}>
            <strong>ℹ️ Note:</strong> This is the <strong>Product Design Template</strong>.
            <br/>• <strong>Barcode</strong>: Your internal catalog/design code (e.g., GOLD-22K-001)
            <br/>• <strong>HUID</strong>: If this design is BIS hallmarked
            <br/>• <strong>Tag IDs & Stock Barcodes</strong>: Auto-generated when you receive stock (one per physical piece)
          </div>

          <div className="responsive-grid responsive-grid-2" style={{ marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Product Barcode <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  required
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="e.g., GOLD-22K-001"
                />
                <button
                  type="button"
                  onClick={generateBarcode}
                  disabled={generating || !formData.metalType || !formData.purity}
                  style={{
                    padding: '8px 12px',
                    background: (generating || !formData.metalType || !formData.purity) ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (generating || !formData.metalType || !formData.purity) ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                  title={!formData.metalType || !formData.purity ? "Select metal type and purity first" : "Auto-generate unique barcode"}
                >
                  {generating ? '...' : '🔄 Generate'}
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                {formData.metalType && formData.purity ? (
                  <span>
                    Will generate like: <code style={{ background: '#f0f0f0', padding: '2px 4px', borderRadius: '2px' }}>
                      {formData.metalType}-{formData.purity.replace(/[^0-9A-Z]/gi, '')}-001
                    </code>
                  </span>
                ) : (
                  'Design template identifier. Click Generate for auto-code.'
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                HUID (Hallmark ID)
              </label>
              <input
                type="text"
                value={formData.huid}
                onChange={(e) => setFormData({ ...formData, huid: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="e.g., ABC123 (if hallmarked)"
              />
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Only if BIS hallmarked design</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Collection Name
              </label>
              <input
                type="text"
                value={formData.collectionName}
                onChange={(e) => setFormData({ ...formData, collectionName: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="e.g., Bridal Collection, Festival Special"
              />
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Group related jewelry designs for marketing</div>
            </div>
          </div>

          <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
            Additional Details
          </h3>

          <div className="responsive-grid responsive-grid-2" style={{ marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Supplier
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '28px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Active Product</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={formData.isCustomOrder}
                  onChange={(e) => setFormData({ ...formData, isCustomOrder: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Custom Order</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '10px 20px',
                background: submitting ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              {submitting ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
