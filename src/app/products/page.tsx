'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  metalType: string;
  purity: string;
  netWeight: number;
  barcode: string;
  calculatedPrice?: number;
  isActive: boolean;
  _count?: {
    stockItems: number;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
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

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Product Management</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Manage jewelry products and pricing</p>
        </div>
        <Link href="/" style={{ textDecoration: 'none', padding: '10px 20px', background: '#666', color: 'white', borderRadius: '4px' }}>
          ← Back to Home
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Products ({products.length})</h2>
          <button className="button">+ Add Product</button>
        </div>

        {loading && <p>Loading products...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!loading && !error && products.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
            No products found. Add your first product to get started.
          </p>
        )}

        {!loading && !error && products.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Metal/Purity</th>
                <th>Net Weight (g)</th>
                <th>Barcode</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td style={{ fontWeight: 500 }}>{product.name}</td>
                  <td>
                    {product.metalType} {product.purity}
                  </td>
                  <td>{Number(product.netWeight).toFixed(3)}</td>
                  <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{product.barcode}</td>
                  <td>
                    {product.calculatedPrice ? `₹${Number(product.calculatedPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      background: product._count?.stockItems ? '#d5f4e6' : '#ffcdd2',
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {product._count?.stockItems || 0} items
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      background: product.isActive ? '#d5f4e6' : '#ffcdd2', 
                      color: product.isActive ? '#00b894' : '#d32f2f',
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button style={{ 
                      padding: '4px 12px', 
                      background: 'transparent', 
                      border: '1px solid #0070f3', 
                      color: '#0070f3', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ background: '#f8f9fa' }}>
        <h3 style={{ marginTop: 0 }}>API Endpoint</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>
          <strong>GET</strong> <code>/api/products</code> - List all products with filters
        </p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          <strong>POST</strong> <code>/api/products</code> - Create a new product (auto-calculates price)
        </p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          <strong>GET</strong> <code>/api/products/[id]</code> - Get product details with stock
        </p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          <strong>PUT</strong> <code>/api/products/[id]</code> - Update product (supports price recalculation)
        </p>
      </div>
    </div>
  );
}
