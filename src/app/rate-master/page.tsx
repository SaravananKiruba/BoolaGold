'use client';

import { useState, useEffect } from 'react';

interface RateMaster {
  id: string;
  metalType: string;
  purity: string;
  ratePerGram: number;
  effectiveDate: string;
  validUntil?: string;
  rateSource: string;
  isActive: boolean;
  defaultMakingChargePercent?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  metalType: string;
  purity: string;
  rateSource: string;
  isActive: string;
}

interface RateFormData {
  metalType: string;
  purity: string;
  ratePerGram: string;
  effectiveDate: string;
  validUntil: string;
  rateSource: string;
  isActive: boolean;
  defaultMakingChargePercent: string;
  createdBy: string;
}

export default function RateMasterPage() {
  const [rates, setRates] = useState<RateMaster[]>([]);
  const [currentRates, setCurrentRates] = useState<RateMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<RateMaster[]>([]);
  const [selectedRate, setSelectedRate] = useState<{ metalType: string; purity: string } | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    metalType: '',
    purity: '',
    rateSource: '',
    isActive: '',
  });

  const [formData, setFormData] = useState<RateFormData>({
    metalType: 'GOLD',
    purity: '22K',
    ratePerGram: '',
    effectiveDate: new Date().toISOString().slice(0, 16),
    validUntil: '',
    rateSource: 'MANUAL',
    isActive: true,
    defaultMakingChargePercent: '',
    createdBy: '',
  });

  useEffect(() => {
    fetchCurrentRates();
    fetchRates();
  }, []);

  const fetchCurrentRates = async () => {
    try {
      const response = await fetch('/api/rate-master/current');
      const result = await response.json();

      if (result.success) {
        setCurrentRates(result.data);
      }
    } catch (err: any) {
      console.error('Error fetching current rates:', err);
    }
  };

  const fetchRates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/rate-master?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setRates(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch rates');
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
    fetchRates();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      metalType: '',
      purity: '',
      rateSource: '',
      isActive: '',
    });
  };

  const handleFormChange = (key: keyof RateFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const payload = {
        metalType: formData.metalType,
        purity: formData.purity,
        ratePerGram: parseFloat(formData.ratePerGram),
        effectiveDate: formData.effectiveDate,
        validUntil: formData.validUntil || undefined,
        rateSource: formData.rateSource,
        isActive: formData.isActive,
        defaultMakingChargePercent: formData.defaultMakingChargePercent 
          ? parseFloat(formData.defaultMakingChargePercent) 
          : undefined,
        createdBy: formData.createdBy || undefined,
      };

      const response = await fetch('/api/rate-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert('Rate created successfully!');
        setShowAddModal(false);
        fetchCurrentRates();
        fetchRates();
        resetForm();
      } else {
        alert(result.error?.message || 'Failed to create rate');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      metalType: 'GOLD',
      purity: '22K',
      ratePerGram: '',
      effectiveDate: new Date().toISOString().slice(0, 16),
      validUntil: '',
      rateSource: 'MANUAL',
      isActive: true,
      defaultMakingChargePercent: '',
      createdBy: '',
    });
  };

  const viewHistory = async (metalType: string, purity: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rate-master/history/${metalType}/${purity}`);
      const result = await response.json();

      if (result.success) {
        setHistoryData(result.data);
        setSelectedRate({ metalType, purity });
        setShowHistoryModal(true);
      } else {
        alert(result.error?.message || 'Failed to fetch history');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/rate-master/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const result = await response.json();

      if (result.success) {
        fetchCurrentRates();
        fetchRates();
      } else {
        alert(result.error?.message || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message);
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading && rates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Rate Master Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add New Rate
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Current Rates Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Current Active Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentRates.map((rate) => (
            <div key={rate.id} className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-300 rounded-lg p-4 shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{rate.metalType}</h3>
                  <p className="text-sm text-gray-600">{rate.purity}</p>
                </div>
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Active</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(rate.ratePerGram)}/g
              </div>
              <div className="text-xs text-gray-600 mb-2">
                <p>Source: {rate.rateSource}</p>
                <p>Effective: {formatDate(rate.effectiveDate)}</p>
                {rate.defaultMakingChargePercent && (
                  <p>Making Charge: {rate.defaultMakingChargePercent}%</p>
                )}
              </div>
              <button
                onClick={() => viewHistory(rate.metalType, rate.purity)}
                className="text-blue-600 text-sm hover:underline"
              >
                View History
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* All Rates Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">All Rates</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.metalType}
                onChange={(e) => handleFilterChange('metalType', e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">All Metals</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="PLATINUM">Platinum</option>
              </select>

              <input
                type="text"
                placeholder="Purity (e.g., 22K, 18K)"
                value={filters.purity}
                onChange={(e) => handleFilterChange('purity', e.target.value)}
                className="border rounded px-3 py-2"
              />

              <select
                value={filters.rateSource}
                onChange={(e) => handleFilterChange('rateSource', e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">All Sources</option>
                <option value="MARKET">Market</option>
                <option value="MANUAL">Manual</option>
                <option value="API">API</option>
              </select>

              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={applyFilters}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  clearFilters();
                  fetchRates();
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Metal Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Purity</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Rate/gram</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Effective Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Valid Until</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Source</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rates.map((rate) => (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{rate.metalType}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{rate.purity}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(rate.ratePerGram)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(rate.effectiveDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {rate.validUntil ? formatDate(rate.validUntil) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">
                      {rate.rateSource}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${
                        rate.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rate.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActiveStatus(rate.id, rate.isActive)}
                      className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                    >
                      {rate.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => viewHistory(rate.metalType, rate.purity)}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add New Rate</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metal Type *
                    </label>
                    <select
                      value={formData.metalType}
                      onChange={(e) => handleFormChange('metalType', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      required
                    >
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                      <option value="PLATINUM">Platinum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purity *
                    </label>
                    <input
                      type="text"
                      value={formData.purity}
                      onChange={(e) => handleFormChange('purity', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., 22K, 18K, 999"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate per Gram (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ratePerGram}
                      onChange={(e) => handleFormChange('ratePerGram', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="5500.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Making Charge (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.defaultMakingChargePercent}
                      onChange={(e) => handleFormChange('defaultMakingChargePercent', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="10.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Effective Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.effectiveDate}
                      onChange={(e) => handleFormChange('effectiveDate', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Until (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={(e) => handleFormChange('validUntil', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate Source *
                    </label>
                    <select
                      value={formData.rateSource}
                      onChange={(e) => handleFormChange('rateSource', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      required
                    >
                      <option value="MANUAL">Manual</option>
                      <option value="MARKET">Market</option>
                      <option value="API">API</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created By
                    </label>
                    <input
                      type="text"
                      value={formData.createdBy}
                      onChange={(e) => handleFormChange('createdBy', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="User name"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleFormChange('isActive', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Set as Active (will deactivate other rates for this metal/purity)
                  </label>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Creating...' : 'Create Rate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedRate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Rate History - {selectedRate.metalType} {selectedRate.purity}
                </h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Rate/gram</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Source</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Created By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {historyData.map((rate) => (
                      <tr key={rate.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{formatDate(rate.effectiveDate)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          {formatCurrency(rate.ratePerGram)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">
                            {rate.rateSource}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              rate.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {rate.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{rate.createdBy || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
