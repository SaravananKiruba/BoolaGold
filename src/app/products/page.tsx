'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
      alert('Error loading price breakdown: ' + err.message);
    }
  };

  const recalculatePrices = async () => {
    if (!confirm('Recalculate prices for all active products based on current rates?')) return;
    
    try {
      setRecalculating(true);
      const response = await fetch('/api/products/recalculate-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyOutdated: true }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Successfully updated ${result.data.updated} products. Skipped ${result.data.skipped} products.`);
        fetchProducts();
      } else {
        alert('Error: ' + result.error?.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const closePriceBreakdown = () => {
    setPriceBreakdown(null);
    setSelectedProduct(null);
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Product Management</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            Manage jewelry products with auto-pricing and compliance tracking
          </p>
        </div>
        <Link href="/" style={{ textDecoration: 'none', padding: '10px 20px', background: '#666', color: 'white', borderRadius: '4px' }}>
          ← Back to Home
        </Link>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
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
            <button className="button">+ Add Product</button>
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
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Metal/Purity</th>
                  <th>Weight (g)</th>
                  <th>Identifiers</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{product.name}</div>
                      {product.collectionName && (
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          Collection: {product.collectionName}
                        </div>
                      )}
                      {product.isCustomOrder && (
                        <span style={{ fontSize: '10px', background: '#fff3cd', padding: '2px 6px', borderRadius: '3px', marginTop: '4px', display: 'inline-block' }}>
                          CUSTOM
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{product.metalType}</strong> {product.purity}
                    </td>
                    <td>
                      <div>Net: {Number(product.netWeight).toFixed(3)}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        Gross: {Number(product.grossWeight).toFixed(3)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        Wastage: {Number(product.wastagePercent)}%
                      </div>
                    </td>
                    <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      <div>📊 {product.barcode}</div>
                      {product.huid && <div>🏅 {product.huid}</div>}
                      {product.tagNumber && <div>🏷️ {product.tagNumber}</div>}
                    </td>
                    <td>
                      {product.priceOverride ? (
                        <div>
                          <div style={{ fontWeight: 500, color: '#ff9800' }}>
                            ₹{Number(product.priceOverride).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '10px', color: '#ff9800' }}>OVERRIDE</div>
                        </div>
                      ) : product.calculatedPrice ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            ₹{Number(product.calculatedPrice).toLocaleString('en-IN')}
                          </div>
                          {product.lastPriceUpdate && (
                            <div style={{ fontSize: '10px', color: '#666' }}>
                              {new Date(product.lastPriceUpdate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>Not set</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          background: (product._count?.stockItems || 0) > 0 ? '#d5f4e6' : '#ffcdd2',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {product._count?.stockItems || 0} items
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          background: product.isActive ? '#d5f4e6' : '#ffcdd2',
                          color: product.isActive ? '#00b894' : '#d32f2f',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => viewPriceBreakdown(product.id)}
                        style={{
                          padding: '4px 12px',
                          background: 'transparent',
                          border: '1px solid #0070f3',
                          color: '#0070f3',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginRight: '4px',
                        }}
                      >
                        Price 💰
                      </button>
                      <button
                        style={{
                          padding: '4px 12px',
                          background: 'transparent',
                          border: '1px solid #666',
                          color: '#666',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Price Breakdown Modal */}
      {priceBreakdown && selectedProduct && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={closePriceBreakdown}
        >
          <div
            className="card"
            style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto', margin: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Price Breakdown: {selectedProduct.name}</h2>
              <button
                onClick={closePriceBreakdown}
                style={{
                  padding: '4px 12px',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ×
              </button>
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
              <div>Rate Effective Date: {new Date(priceBreakdown.currentRate.effectiveDate).toLocaleString()}</div>
              {priceBreakdown.product.lastPriceUpdate && (
                <div>
                  Last Price Update: {new Date(priceBreakdown.product.lastPriceUpdate).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API Info */}
      <div className="card" style={{ background: '#f8f9fa' }}>
        <h3 style={{ marginTop: 0 }}>Available API Endpoints</h3>
        <div style={{ fontSize: '13px', color: '#666' }}>
          <p>
            <strong>GET</strong> <code>/api/products</code> - List products with advanced filters
            (search, barcode, HUID, tag, metal, purity, collection, supplier, stock status, low stock)
          </p>
          <p>
            <strong>POST</strong> <code>/api/products</code> - Create product with auto-price calculation
          </p>
          <p>
            <strong>GET</strong> <code>/api/products/[id]</code> - Get product details with stock summary
          </p>
          <p>
            <strong>PUT</strong> <code>/api/products/[id]</code> - Update product with price recalculation
          </p>
          <p>
            <strong>GET</strong> <code>/api/products/[id]/price-breakdown</code> - Detailed price calculation
            breakdown
          </p>
          <p>
            <strong>POST</strong> <code>/api/products/recalculate-prices</code> - Bulk price recalculation
            based on current rates
          </p>
        </div>
      </div>
    </div>
  );
}
