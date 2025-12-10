// Stock Management Page

'use client';

import { useState, useEffect } from 'react';
import { usePageGuard } from '@/hooks/usePageGuard';

interface StockSummary {
  totalInventory: {
    items: number;
    purchaseValue: number;
    sellingValue: number;
    potentialProfit: number;
  };
  lowStockAlerts: {
    count: number;
    products: any[];
  };
  byMetalType: any[];
}

export default function StockPage() {
  const { isAuthorized, isLoading: authLoading } = usePageGuard(['OWNER', 'SALES']);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/stock/summary');
      const result = await response.json();

      if (result.success) {
        setSummary(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch stock summary');
      }
    } catch (error: any) {
      console.error('Failed to fetch stock summary:', error);
      setError(error.message || 'Failed to fetch stock summary');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a Tag ID or Barcode to search');
      return;
    }

    try {
      setSearchResult(null);
      setSearchPerformed(true);
      setError(null);
      
      // Try searching by tag ID first
      const tagResponse = await fetch(`/api/stock/search?tagId=${encodeURIComponent(searchTerm.trim())}`);
      
      if (tagResponse.ok) {
        const result = await tagResponse.json();
        if (result.success && result.data.stockItem) {
          setSearchResult(result.data.stockItem);
          return;
        }
      } else {
        const errorData = await tagResponse.json();
        setError(errorData.error || 'Search failed');
        return;
      }

      // If not found by tag, try barcode
      const barcodeResponse = await fetch(`/api/stock/search?barcode=${encodeURIComponent(searchTerm.trim())}`);
      
      if (barcodeResponse.ok) {
        const result = await barcodeResponse.json();
        if (result.success && result.data.stockItem) {
          setSearchResult(result.data.stockItem);
          return;
        }
      } else {
        const errorData = await barcodeResponse.json();
        setError(errorData.error || 'Search failed');
        return;
      }

      // Not found
      setSearchResult(null);
    } catch (error: any) {
      console.error('Search failed:', error);
      setError(error.message || 'Search failed. Please try again.');
    }
  };

  if (authLoading) {
    return <div className="container"><p>Loading...</p></div>;
  }

  if (!isAuthorized) {
    return <div className="container"><p>Access Denied</p></div>;
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Stock Management</h1>
        <p style={{ color: '#666', marginTop: '5px' }}>Track inventory and stock levels</p>
      </div>

      {error && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          border: '1px solid #dc3545', 
          borderRadius: '4px', 
          background: '#f8d7da', 
          color: '#721c24' 
        }}>
          ⚠️ {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Quick Stock Lookup</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!e.target.value.trim()) {
                setSearchResult(null);
                setSearchPerformed(false);
                setError(null);
              }
            }}
            placeholder="Enter Tag ID or Barcode"
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="button"
          >
            Search
          </button>
        </div>

        {searchPerformed && !searchResult && !error && (
          <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #ffc107', borderRadius: '4px', background: '#fff9e6', color: '#856404' }}>
            No stock item found. Please verify the Tag ID or Barcode.
          </div>
        )}

        {searchResult && (
          <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', background: '#f8f9fa' }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px' }}>{searchResult.product.name}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px' }}>
              <div>Tag ID: {searchResult.tagId}</div>
              <div>Barcode: {searchResult.barcode}</div>
              <div>Status: <span className={`font-semibold ${
                searchResult.status === 'AVAILABLE' ? 'text-green-600' :
                searchResult.status === 'RESERVED' ? 'text-yellow-600' :
                'text-red-600'
              }`}>{searchResult.status}</span></div>
              <div>Purchase Cost: ₹{Number(searchResult.purchaseCost).toLocaleString()}</div>
              <div>Net Weight: {searchResult.product.netWeight}g</div>
              <div>Purity: {searchResult.product.purity}</div>
            </div>
            <div style={{ marginTop: '10px', padding: '8px', background: '#e3f2fd', borderRadius: '4px', fontSize: '12px', color: '#1565c0' }}>
              💡 Selling price calculated dynamically at checkout using current market rates
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p>Loading stock summary...</p>
      ) : summary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div className="card">
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Total Items in Stock</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{summary.totalInventory.items}</div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>Available & Reserved</div>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Total Purchase Value</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                ₹{Number(summary.totalInventory.purchaseValue).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>Total investment in inventory</div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <div style={{ fontSize: '14px', marginBottom: '5px', opacity: 0.9 }}>💰 Dynamic Pricing</div>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>
                Selling prices calculated at checkout
              </div>
              <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.8 }}>
                Using current market rates
              </div>
            </div>
          </div>

          {summary.lowStockAlerts.count > 0 && (
            <div className="card" style={{ marginBottom: '20px', background: '#fff4e6', borderLeft: '4px solid #e67e22' }}>
              <h3 style={{ marginTop: 0, color: '#e67e22' }}>
                ⚠️ Low Stock Alerts ({summary.lowStockAlerts.count})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.lowStockAlerts.products.map((product) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm">
                      Available: {product.availableQuantity} | Reorder: {product.reorderLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Inventory by Metal Type</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Metal Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Weight (g)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.byMetalType.map((item) => (
                    <tr key={item.metalType}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {item.metalType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.productCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {Number(item.totalWeight).toFixed(3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{Number(item.totalValue).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
