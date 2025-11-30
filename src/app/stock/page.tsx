// Stock Management Page

'use client';

import { useState, useEffect } from 'react';

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
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stock/summary');
      const result = await response.json();

      if (result.success) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch stock summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) return;

    try {
      // Try searching by tag ID first, then barcode
      const tagResponse = await fetch(`/api/stock/search?tagId=${searchTerm}`);
      if (tagResponse.ok) {
        const result = await tagResponse.json();
        if (result.success) {
          setSearchResult(result.data.stockItem);
          return;
        }
      }

      const barcodeResponse = await fetch(`/api/stock/search?barcode=${searchTerm}`);
      if (barcodeResponse.ok) {
        const result = await barcodeResponse.json();
        if (result.success) {
          setSearchResult(result.data.stockItem);
          return;
        }
      }

      setSearchResult(null);
      alert('Stock item not found');
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Stock Management</h1>

      {/* Quick Search */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Stock Lookup</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter Tag ID or Barcode"
            className="flex-1 border rounded px-4 py-2"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Search
          </button>
        </div>

        {searchResult && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <h3 className="font-semibold mb-2">{searchResult.product.name}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Tag ID: {searchResult.tagId}</div>
              <div>Barcode: {searchResult.barcode}</div>
              <div>Status: <span className={`font-semibold ${
                searchResult.status === 'AVAILABLE' ? 'text-green-600' :
                searchResult.status === 'RESERVED' ? 'text-yellow-600' :
                'text-red-600'
              }`}>{searchResult.status}</span></div>
              <div>Selling Price: ₹{Number(searchResult.sellingPrice).toLocaleString()}</div>
              <div>Net Weight: {searchResult.product.netWeight}g</div>
              <div>Purity: {searchResult.product.purity}</div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Items</h3>
              <p className="text-3xl font-bold">{summary.totalInventory.items}</p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Purchase Value</h3>
              <p className="text-3xl font-bold">
                ₹{Number(summary.totalInventory.purchaseValue).toLocaleString()}
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Selling Value</h3>
              <p className="text-3xl font-bold">
                ₹{Number(summary.totalInventory.sellingValue).toLocaleString()}
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Potential Profit</h3>
              <p className="text-3xl font-bold text-green-600">
                ₹{Number(summary.totalInventory.potentialProfit).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {summary.lowStockAlerts.count > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-yellow-800">
                Low Stock Alerts ({summary.lowStockAlerts.count})
              </h2>
              <div className="space-y-2">
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

          {/* Inventory by Metal Type */}
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
