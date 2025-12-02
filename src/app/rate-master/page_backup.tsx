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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Rate Master</h1>
            <p className="text-gray-600">Manage metal rates and pricing</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add New Rate
          </button>
        </div>

        {loading && rates.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading rates...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Current Rates Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Current Active Rates</h2>
            <a 
              href="/rate-master/bulk-update"
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Bulk Update Prices
            </a>
          </div>
          
          {currentRates.length === 0 && !loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Rates</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first metal rate</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Add Rate
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentRates.map((rate) => (
                <div key={rate.id} className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{rate.metalType}</h3>
                      <p className="text-sm text-gray-600 font-medium">{rate.purity}</p>
                    </div>
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    {formatCurrency(rate.ratePerGram)}
                    <span className="text-lg text-gray-600 font-normal">/g</span>
                  </div>
                  <div className="text-xs text-gray-700 space-y-1 mb-4 bg-white bg-opacity-50 rounded p-3">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold">Source:</span> {rate.rateSource}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-semibold">Effective:</span> {formatDate(rate.effectiveDate)}
                    </p>
                    {rate.defaultMakingChargePercent && (
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">Making:</span> {rate.defaultMakingChargePercent}%
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => viewHistory(rate.metalType, rate.purity)}
                    className="w-full bg-white hover:bg-gray-50 text-indigo-600 font-semibold px-4 py-2 rounded-lg border border-indigo-200 transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    View History
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Rates Section */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">All Rates</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-lg font-medium shadow-sm border border-gray-300 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metal Type</label>
                  <select
                    value={filters.metalType}
                    onChange={(e) => handleFilterChange('metalType', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Metals</option>
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
                  <input
                    type="text"
                    placeholder="e.g., 22K, 18K"
                    value={filters.purity}
                    onChange={(e) => handleFilterChange('purity', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate Source</label>
                  <select
                    value={filters.rateSource}
                    onChange={(e) => handleFilterChange('rateSource', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Sources</option>
                    <option value="MARKET">Market</option>
                    <option value="MANUAL">Manual</option>
                    <option value="API">API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.isActive}
                    onChange={(e) => handleFilterChange('isActive', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={applyFilters}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg font-semibold shadow-md transition"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    clearFilters();
                    fetchRates();
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-2.5 rounded-lg font-semibold border border-gray-300 shadow-sm transition"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-100 to-purple-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Metal Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Purity</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Rate/Gram</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Effective Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Valid Until</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-indigo-50 transition">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{rate.metalType}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{rate.purity}</td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-indigo-600">
                      {formatCurrency(rate.ratePerGram)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatDate(rate.effectiveDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rate.validUntil ? formatDate(rate.validUntil) : (
                        <span className="text-gray-400 italic">No expiry</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        rate.rateSource === 'API' ? 'bg-blue-100 text-blue-700' :
                        rate.rateSource === 'MARKET' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {rate.rateSource}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                          rate.isActive
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-red-100 text-red-700 border border-red-300'
                        }`}
                      >
                        {rate.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => toggleActiveStatus(rate.id, rate.isActive)}
                          className={`text-sm font-semibold hover:underline ${
                            rate.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {rate.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => viewHistory(rate.metalType, rate.purity)}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold hover:underline"
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Rate Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-slideUp">
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600 text-white px-8 py-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Add New Rate</h2>
                    <p className="text-yellow-50 text-sm">Set metal rates for pricing calculations</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 text-2xl font-bold"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-50 to-white flex flex-col">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Primary Info Section */}
                  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">💰</span>
                      Primary Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                          Metal Type <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={formData.metalType}
                            onChange={(e) => handleFormChange('metalType', e.target.value)}
                            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-semibold bg-white hover:border-gray-400 transition appearance-none cursor-pointer"
                            required
                          >
                            <option value="GOLD">Gold</option>
                            <option value="SILVER">Silver</option>
                            <option value="PLATINUM">Platinum</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                          Purity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.purity}
                          onChange={(e) => handleFormChange('purity', e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-gray-400 transition"
                          placeholder="22K"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">e.g., 22K, 18K, 24K, 999</p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                          Rate per Gram (₹) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.ratePerGram}
                            onChange={(e) => handleFormChange('ratePerGram', e.target.value)}
                            className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-4 text-2xl font-bold focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-gray-400 transition text-gray-900"
                            placeholder="5500.00"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Default Making Charge (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.defaultMakingChargePercent}
                            onChange={(e) => handleFormChange('defaultMakingChargePercent', e.target.value)}
                            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-gray-400 transition"
                            placeholder="10.00"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Used for price suggestions</p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                          Rate Source <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={formData.rateSource}
                            onChange={(e) => handleFormChange('rateSource', e.target.value)}
                            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-medium bg-white hover:border-gray-400 transition appearance-none cursor-pointer"
                            required
                          >
                            <option value="MANUAL">Manual Entry</option>
                            <option value="MARKET">Market Rate</option>
                            <option value="API">API Integration</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date & Validity Section */}
                  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📅</span>
                      Date & Validity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                          Effective Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.effectiveDate}
                          onChange={(e) => handleFormChange('effectiveDate', e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-gray-400 transition"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">When this rate becomes active</p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Valid Until (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.validUntil}
                          onChange={(e) => handleFormChange('validUntil', e.target.value)}
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-gray-400 transition"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave blank for no expiry</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">👤</span>
                      Additional Information
                    </h3>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Created By
                      </label>
                      <input
                        type="text"
                        value={formData.createdBy}
                        onChange={(e) => handleFormChange('createdBy', e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 hover:border-gray-400 transition"
                        placeholder="User name"
                      />
                      <p className="text-xs text-gray-500 mt-1">Track who created this rate</p>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => handleFormChange('isActive', e.target.checked)}
                          className="w-6 h-6 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                      <label htmlFor="isActive" className="flex-1 cursor-pointer">
                        <span className="font-bold text-gray-900 text-base block mb-1">Set as Active Rate</span>
                        <p className="text-sm text-gray-700">
                          This will automatically deactivate other rates for this metal type and purity combination
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="bg-gray-50 px-8 py-5 border-t border-gray-200 flex justify-end gap-4 -mx-8 -mb-8 mt-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="px-8 py-3.5 border-2 border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-10 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl font-bold hover:from-yellow-600 hover:to-amber-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </span>
                      ) : (
                        'Create Rate'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedRate && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold">Rate History</h2>
                    <p className="text-indigo-100 text-lg mt-1">
                      {selectedRate.metalType} {selectedRate.purity}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-white hover:text-indigo-100 text-3xl font-light transition"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Effective Date</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Rate/Gram</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {historyData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="text-gray-400">
                              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-gray-600 font-medium">No history available</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        historyData.map((rate) => (
                          <tr key={rate.id} className="hover:bg-indigo-50 transition">
                            <td className="px-6 py-4 text-sm font-medium text-gray-700">{formatDate(rate.effectiveDate)}</td>
                            <td className="px-6 py-4 text-sm text-right font-bold text-indigo-600">
                              {formatCurrency(rate.ratePerGram)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                                rate.rateSource === 'API' ? 'bg-blue-100 text-blue-700' :
                                rate.rateSource === 'MARKET' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {rate.rateSource}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                                  rate.isActive
                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {rate.isActive ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {rate.createdBy || <span className="text-gray-400 italic">System</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
