'use client';

import { useState, useEffect } from 'react';

interface RateMaster {
  id: string;
  metalType: string;
  purity: string;
  ratePerGram: number;
  effectiveDate: string;
  isActive: boolean;
}

interface PriceChange {
  productId: string;
  productName: string;
  barcode: string;
  metalType: string;
  purity: string;
  netWeight: number;
  wastagePercent: number;
  effectiveWeight: number;
  oldRate: number;
  newRate: number;
  oldPrice: number;
  newPrice: number;
  priceDifference: number;
  percentageChange: number;
  makingCharges: number;
  stoneValue: number;
}

interface BulkUpdateFilters {
  metalType: string;
  purity: string;
  collectionName: string;
  productIds: string;
}

export default function BulkPriceUpdatePage() {
  const [currentRates, setCurrentRates] = useState<RateMaster[]>([]);
  const [selectedRateId, setSelectedRateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [skipCustomPrices, setSkipCustomPrices] = useState(true);
  const [performedBy, setPerformedBy] = useState('');
  
  const [filters, setFilters] = useState<BulkUpdateFilters>({
    metalType: '',
    purity: '',
    collectionName: '',
    productIds: '',
  });

  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const [skippedProducts, setSkippedProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentRates();
  }, []);

  const fetchCurrentRates = async () => {
    try {
      const response = await fetch('/api/rate-master/current');
      const result = await response.json();

      if (result.success) {
        setCurrentRates(result.data);
        if (result.data.length > 0) {
          setSelectedRateId(result.data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching current rates:', err);
    }
  };

  const handleFilterChange = (key: keyof BulkUpdateFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePreview = async () => {
    await performBulkUpdate(true);
  };

  const handleConfirmUpdate = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to update ${priceChanges.length} products? This action cannot be undone.`
    );
    
    if (confirmed) {
      await performBulkUpdate(false);
    }
  };

  const performBulkUpdate = async (preview: boolean) => {
    try {
      setLoading(true);
      setError(null);
      setPriceChanges([]);
      setSkippedProducts([]);
      setSummary(null);

      if (!selectedRateId) {
        setError('Please select a rate master');
        return;
      }

      const payload: any = {
        rateId: selectedRateId,
        skipCustomPrices,
        preview,
        performedBy: performedBy || undefined,
      };

      // Build product filters
      const productFilters: any = {};
      
      if (filters.metalType) productFilters.metalType = filters.metalType;
      if (filters.purity) productFilters.purity = filters.purity;
      if (filters.collectionName) productFilters.collectionName = filters.collectionName;
      if (filters.productIds) {
        const ids = filters.productIds.split(',').map((id) => id.trim()).filter((id) => id);
        if (ids.length > 0) productFilters.productIds = ids;
      }

      if (Object.keys(productFilters).length > 0) {
        payload.productFilters = productFilters;
      }

      const response = await fetch('/api/rate-master/bulk-update-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setPriceChanges(result.data.priceChanges || []);
        setSkippedProducts(result.data.skippedProducts || []);
        setSummary({
          totalProducts: result.data.totalProducts,
          productsUpdated: result.data.productsUpdated || result.data.productsToUpdate,
          productsSkipped: result.data.productsSkipped,
          preview: result.data.preview,
          rateMaster: result.data.rateMaster,
        });

        if (!preview) {
          alert(`Successfully updated ${result.data.productsUpdated} products!`);
        }
      } else {
        setError(result.error?.message || 'Failed to process bulk update');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedRate = currentRates.find((r) => r.id === selectedRateId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Bulk Price Update</h1>
        <p className="text-gray-600 mt-2">
          Recalculate product prices based on new metal rates
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Rate Master *
                </label>
                <select
                  value={selectedRateId}
                  onChange={(e) => setSelectedRateId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  {currentRates.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.metalType} {rate.purity} - {formatCurrency(rate.ratePerGram)}/g
                    </option>
                  ))}
                </select>
                {selectedRate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Effective: {formatDate(selectedRate.effectiveDate)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performed By
                </label>
                <input
                  type="text"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="User name"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Options</h3>
                
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="skipCustomPrices"
                    checked={skipCustomPrices}
                    onChange={(e) => setSkipCustomPrices(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="skipCustomPrices" className="text-sm text-gray-700">
                    Skip products with custom prices
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Product Filters</h3>
                
                <div className="space-y-3">
                  <select
                    value={filters.metalType}
                    onChange={(e) => handleFilterChange('metalType', e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">All Metals</option>
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Purity (e.g., 22K)"
                    value={filters.purity}
                    onChange={(e) => handleFilterChange('purity', e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />

                  <input
                    type="text"
                    placeholder="Collection Name"
                    value={filters.collectionName}
                    onChange={(e) => handleFilterChange('collectionName', e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />

                  <textarea
                    placeholder="Product IDs (comma-separated)"
                    value={filters.productIds}
                    onChange={(e) => handleFilterChange('productIds', e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={handlePreview}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 font-semibold mb-2"
                >
                  {loading ? 'Loading...' : 'Preview Changes'}
                </button>

                {priceChanges.length > 0 && (
                  <button
                    onClick={handleConfirmUpdate}
                    disabled={loading}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                  >
                    Confirm & Update {priceChanges.length} Products
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {summary && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                {summary.preview ? 'Preview Summary' : 'Update Summary'}
              </h2>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.totalProducts}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-gray-600">To Update</p>
                  <p className="text-2xl font-bold text-green-600">{summary.productsUpdated}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Skipped</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.productsSkipped}</p>
                </div>
              </div>

              {summary.rateMaster && (
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Rate Details</h3>
                  <p className="text-sm text-gray-600">
                    {summary.rateMaster.metalType} {summary.rateMaster.purity} - 
                    <span className="font-semibold"> {formatCurrency(summary.rateMaster.ratePerGram)}/g</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Effective: {formatDate(summary.rateMaster.effectiveDate)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Price Changes Table */}
          {priceChanges.length > 0 && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-xl font-semibold text-gray-700">Price Changes</h2>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Product</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Weight (g)</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Old Rate</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">New Rate</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Old Price</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">New Price</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {priceChanges.map((change) => (
                      <tr key={change.productId} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium text-gray-900">{change.productName}</p>
                            <p className="text-xs text-gray-500">{change.barcode}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div>
                            <p className="text-gray-900">{change.effectiveWeight.toFixed(3)}</p>
                            <p className="text-xs text-gray-500">
                              Net: {change.netWeight.toFixed(3)}g
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {formatCurrency(change.oldRate)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                          {formatCurrency(change.newRate)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {formatCurrency(change.oldPrice)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                          {formatCurrency(change.newPrice)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div>
                            <p className={`font-semibold ${change.priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change.priceDifference >= 0 ? '+' : ''}{formatCurrency(change.priceDifference)}
                            </p>
                            <p className={`text-xs ${change.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change.percentageChange >= 0 ? '+' : ''}{change.percentageChange.toFixed(2)}%
                            </p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Skipped Products */}
          {skippedProducts.length > 0 && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4 bg-yellow-50 border-b">
                <h2 className="text-xl font-semibold text-gray-700">Skipped Products</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Product Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Barcode</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {skippedProducts.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">{product.name}</td>
                        <td className="px-4 py-2 text-gray-700">{product.barcode}</td>
                        <td className="px-4 py-2 text-gray-600">{product.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && !summary && (
            <div className="bg-white shadow-md rounded-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Preview Available</h3>
              <p className="text-gray-600">
                Configure your filters and click "Preview Changes" to see which products will be updated
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
