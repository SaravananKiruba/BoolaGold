'use client';

/**
 * Bulk Price Update Page - Robust Implementation
 * Recalculates product prices based on new metal rates with preview and transaction support
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast, confirmAction } from '@/utils/toast';

// Types
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

interface SkippedProduct {
  id: string;
  name: string;
  barcode: string;
  reason: string;
}

interface Summary {
  totalProducts: number;
  productsUpdated: number;
  productsSkipped: number;
  preview: boolean;
  rateMaster: {
    id: string;
    metalType: string;
    purity: string;
    ratePerGram: number;
    effectiveDate: string;
    isActive: boolean;
  };
}

interface BulkUpdateFilters {
  metalType: string;
  purity: string;
  collectionName: string;
  productIds: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

export default function BulkPriceUpdatePage() {
  // State Management
  const [currentRates, setCurrentRates] = useState<RateMaster[]>([]);
  const [selectedRateId, setSelectedRateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [skipCustomPrices, setSkipCustomPrices] = useState(true);
  const [performedBy, setPerformedBy] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<BulkUpdateFilters>({
    metalType: '',
    purity: '',
    collectionName: '',
    productIds: '',
  });

  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const [skippedProducts, setSkippedProducts] = useState<SkippedProduct[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Fetch Current Rates
  const fetchCurrentRates = useCallback(async () => {
    try {
      const response = await fetch('/api/rate-master/current');
      const result: ApiResponse<RateMaster[]> = await response.json();

      if (result.success && result.data) {
        setCurrentRates(result.data);
        if (result.data.length > 0 && !selectedRateId) {
          setSelectedRateId(result.data[0].id);
        }
      } else {
        setError('Failed to fetch current rates');
      }
    } catch (err: any) {
      setError('Error fetching current rates');
      console.error(err);
    }
  }, [selectedRateId]);

  useEffect(() => {
    fetchCurrentRates();
  }, [fetchCurrentRates]);

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFilterChange = (key: keyof BulkUpdateFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const validateFilters = (): string | null => {
    if (!selectedRateId) {
      return 'Please select a rate master';
    }

    if (filters.productIds) {
      const ids = filters.productIds.split(',').map(id => id.trim());
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidIds = ids.filter(id => id && !uuidRegex.test(id));
      if (invalidIds.length > 0) {
        return `Invalid product ID format: ${invalidIds.join(', ')}`;
      }
    }

    return null;
  };

  const handlePreview = async () => {
    const validationError = validateFilters();
    if (validationError) {
      setError(validationError);
      return;
    }
    await performBulkUpdate(true);
  };

  const handleConfirmUpdate = async () => {
    const confirmed = await confirmAction(
      `Are you sure you want to update prices for ${priceChanges.length} products?\n\nThis action will:\n- Update calculated prices\n- Replace existing rate references\n- Record the change in product history\n\nThis cannot be undone. Proceed?`,
      'Confirm Bulk Price Update'
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

      const payload: any = {
        rateId: selectedRateId,
        skipCustomPrices,
        preview,
        performedBy: performedBy.trim() || undefined,
      };

      // Build product filters
      const productFilters: any = {};
      
      if (filters.metalType) productFilters.metalType = filters.metalType;
      if (filters.purity) productFilters.purity = filters.purity.trim();
      if (filters.collectionName) productFilters.collectionName = filters.collectionName.trim();
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

      const result: ApiResponse<any> = await response.json();

      if (result.success && result.data) {
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
          setSuccessMessage(`Successfully updated prices for ${result.data.productsUpdated} products!`);
          // Clear filters after successful update
          setFilters({
            metalType: '',
            purity: '',
            collectionName: '',
            productIds: '',
          });
        }
      } else {
        setError(result.error?.message || 'Failed to process bulk update');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/rate-master"
              className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Rate Master
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bulk Price Update</h1>
          <p className="text-gray-600">
            Recalculate product prices based on new metal rates with preview and rollback protection
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-lg mb-6 shadow-sm animate-slideDown">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg mb-6 shadow-sm animate-slideDown">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200 sticky top-6">
              <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuration
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                    Select Rate Master <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedRateId}
                    onChange={(e) => setSelectedRateId(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    disabled={loading}
                  >
                    {currentRates.length === 0 ? (
                      <option value="">No active rates available</option>
                    ) : (
                      currentRates.map((rate) => (
                        <option key={rate.id} value={rate.id}>
                          {rate.metalType} {rate.purity} - {formatCurrency(rate.ratePerGram)}/g
                        </option>
                      ))
                    )}
                  </select>
                  {selectedRate && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Effective: {formatDate(selectedRate.effectiveDate)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Performed By
                  </label>
                  <input
                    type="text"
                    value={performedBy}
                    onChange={(e) => setPerformedBy(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="User name (optional)"
                    maxLength={100}
                    disabled={loading}
                  />
                </div>

                <div className="border-t-2 pt-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Options
                  </h3>
                  
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="skipCustomPrices"
                        checked={skipCustomPrices}
                        onChange={(e) => setSkipCustomPrices(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 mt-0.5"
                        disabled={loading}
                      />
                      <label htmlFor="skipCustomPrices" className="text-sm text-gray-700 cursor-pointer flex-1">
                        <span className="font-semibold block mb-1">Skip Custom Prices</span>
                        <span className="text-xs text-gray-600">Products with manual price overrides will be skipped</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 pt-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Product Filters
                  </h3>
                  
                  <div className="space-y-3">
                    <select
                      value={filters.metalType}
                      onChange={(e) => handleFilterChange('metalType', e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      disabled={loading}
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
                      className="w-full border-2 border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      disabled={loading}
                    />

                    <input
                      type="text"
                      placeholder="Collection Name"
                      value={filters.collectionName}
                      onChange={(e) => handleFilterChange('collectionName', e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      disabled={loading}
                    />

                    <textarea
                      placeholder="Product IDs (comma-separated)"
                      value={filters.productIds}
                      onChange={(e) => handleFilterChange('productIds', e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                      rows={3}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="border-t-2 pt-5 space-y-3">
                  <button
                    onClick={handlePreview}
                    disabled={loading || currentRates.length === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview Changes
                      </>
                    )}
                  </button>

                  {priceChanges.length > 0 && summary?.preview && (
                    <button
                      onClick={handleConfirmUpdate}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
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
              <div className="bg-white shadow-xl rounded-2xl p-6 mb-6 border border-gray-200">
                <h2 className="text-xl font-bold mb-5 text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {summary.preview ? 'Preview Summary' : 'Update Summary'}
                </h2>
                
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-2 border-blue-200">
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Products</p>
                    <p className="text-3xl font-bold text-blue-700">{summary.totalProducts}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border-2 border-green-200">
                    <p className="text-sm text-gray-600 font-medium mb-1">To Update</p>
                    <p className="text-3xl font-bold text-green-700">{summary.productsUpdated}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border-2 border-yellow-200">
                    <p className="text-sm text-gray-600 font-medium mb-1">Skipped</p>
                    <p className="text-3xl font-bold text-yellow-700">{summary.productsSkipped}</p>
                  </div>
                </div>

                {summary.rateMaster && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border-2 border-indigo-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Rate Details
                    </h3>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">{summary.rateMaster.metalType} {summary.rateMaster.purity}</span>
                      </p>
                      <p className="text-lg font-bold text-indigo-700">
                        {formatCurrency(summary.rateMaster.ratePerGram)}/g
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Effective: {formatDate(summary.rateMaster.effectiveDate)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Price Changes Table */}
            {priceChanges.length > 0 && (
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-6 border border-gray-200">
                <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    Price Changes ({priceChanges.length})
                  </h2>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Product</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Weight (g)</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Old Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">New Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Old Price</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">New Price</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {priceChanges.map((change) => (
                        <tr key={change.productId} className="hover:bg-indigo-50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold text-gray-900">{change.productName}</p>
                              <p className="text-xs text-gray-500">{change.barcode}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div>
                              <p className="font-semibold text-gray-900">{change.effectiveWeight.toFixed(3)}</p>
                              <p className="text-xs text-gray-500">Net: {change.netWeight.toFixed(3)}g</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 font-medium">
                            {formatCurrency(change.oldRate)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-700">
                            {formatCurrency(change.newRate)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 font-medium">
                            {formatCurrency(change.oldPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {formatCurrency(change.newPrice)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div>
                              <p className={`font-bold ${change.priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {change.priceDifference >= 0 ? '+' : ''}{formatCurrency(change.priceDifference)}
                              </p>
                              <p className={`text-xs font-semibold ${change.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
                <div className="p-5 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Skipped Products ({skippedProducts.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Product Name</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Barcode</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {skippedProducts.map((product, index) => (
                        <tr key={index} className="hover:bg-yellow-50 transition-colors">
                          <td className="px-5 py-3 text-gray-900 font-medium">{product.name}</td>
                          <td className="px-5 py-3 text-gray-700">{product.barcode}</td>
                          <td className="px-5 py-3 text-gray-600">{product.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !summary && (
              <div className="bg-white shadow-xl rounded-2xl p-16 text-center border border-gray-200">
                <div className="text-gray-400 mb-4">
                  <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Preview Available</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Configure your rate selection and filters, then click "Preview Changes" to see which products will be updated and by how much
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add animations */}
      <style jsx global>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
