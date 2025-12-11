'use client';

/**
 * Rate Master Page - Modern Implementation
 * Manages metal rates with comprehensive error handling and better UX
 */

import { useState, useEffect, useCallback } from 'react';

// Simple toast notification function
const showToast = (title: string, description: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  // You can replace this with a proper toast library later
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${emoji} ${title}: ${description}`);
  // Temporary: using console.log instead of alert to not block UI
};

// Types
interface RateMaster {
  id: string;
  metalType: string;
  purity: string;
  ratePerGram: number;
  validUntil?: string | null;
  rateSource: string;
  isActive: boolean;
  defaultMakingChargePercent?: number | null;
  createdBy?: string | null;
  updatedBy?: string | null;
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
  validUntil: string;
  rateSource: string;
  isActive: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
  meta?: any;
}

export default function RateMasterPage() {
  // State Management
  const [rates, setRates] = useState<RateMaster[]>([]);
  const [currentRates, setCurrentRates] = useState<RateMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<RateMaster[]>([]);
  const [selectedRate, setSelectedRate] = useState<{ metalType: string; purity: string } | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    metalType: '',
    purity: '',
    rateSource: '',
    isActive: '',
  });

  // Form Data
  const [formData, setFormData] = useState<RateFormData>({
    metalType: 'GOLD',
    purity: '22K',
    ratePerGram: '',
    validUntil: '',
    rateSource: 'MANUAL',
    isActive: true,
  });

  // Fetch Current Rates
  const fetchCurrentRates = useCallback(async () => {
    try {
      const response = await fetch('/api/rate-master/current');
      const result: ApiResponse<RateMaster[]> = await response.json();

      if (result.success && result.data) {
        setCurrentRates(result.data);
      } else {
        console.error('Failed to fetch current rates:', result.error?.message);
      }
    } catch (err: any) {
      console.error('Error fetching current rates:', err);
    }
  }, []);

  // Fetch All Rates
  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/rate-master?${params.toString()}`);
      const result: ApiResponse<RateMaster[]> = await response.json();

      if (result.success && result.data) {
        setRates(result.data);
      } else {
        showToast(
          'Error',
          result.error?.message || 'Failed to fetch rates',
          'error'
        );
      }
    } catch (err: any) {
      showToast(
        'Error',
        err.message || 'An unexpected error occurred',
        'error'
        
        
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial Load
  useEffect(() => {
    fetchCurrentRates();
    fetchRates();
  }, [fetchCurrentRates, fetchRates]);

  // Form Handlers
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
    setTimeout(fetchRates, 0);
  };

  const handleFormChange = (key: keyof RateFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.ratePerGram || parseFloat(formData.ratePerGram) <= 0) {
      return 'Please enter a valid rate per gram';
    }

    // No additional date validation needed - validUntil is optional

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const validationError = validateForm();
    if (validationError) {
      showToast(
        'Validation Error',
        validationError,
        'warning'
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        metalType: formData.metalType,
        purity: formData.purity.trim(),
        ratePerGram: parseFloat(formData.ratePerGram),
        validUntil: formData.validUntil || undefined,
        rateSource: formData.rateSource,
        isActive: formData.isActive,
      };

      const response = await fetch('/api/rate-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse<RateMaster> = await response.json();

      if (result.success) {
        showToast(
          'Success',
          'Rate created successfully!',
          'success'
        );
        setShowAddModal(false);
        resetForm();
        fetchCurrentRates();
        fetchRates();
      } else {
        showToast(
          'Error',
          result.error?.message || 'Failed to create rate',
          'error'
        );
      }
    } catch (err: any) {
      showToast(
        'Error',
        err.message || 'An unexpected error occurred',
        'error'
        
        
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      metalType: 'GOLD',
      purity: '22K',
      ratePerGram: '',
      validUntil: '',
      rateSource: 'MANUAL',
      isActive: true,
    });
  };

  const viewHistory = async (metalType: string, purity: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rate-master/history/${metalType}/${purity}`);
      const result: ApiResponse<RateMaster[]> = await response.json();

      if (result.success && result.data) {
        setHistoryData(result.data);
        setSelectedRate({ metalType, purity });
        setShowHistoryModal(true);
      } else {
        showToast(
          'Error',
          result.error?.message || 'Failed to fetch history',
          'error'
        );
      }
    } catch (err: any) {
      showToast(
        'Error',
        err.message || 'An unexpected error occurred',
        'error'
        
        
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/rate-master/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const result: ApiResponse<RateMaster> = await response.json();

      if (result.success) {
        showToast(
          'Success',
          `Rate ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
          'success'
        );
        fetchCurrentRates();
        fetchRates();
      } else {
        showToast(
          'Error',
          result.error?.message || 'Failed to update status',
          'error'
        );
      }
    } catch (err: any) {
      showToast(
        'Error',
        err.message || 'An unexpected error occurred',
        'error'
        
        
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Utility Functions
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Rate Master</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '15px' }}>Manage metal rates & pricing</p>
        </div>
        <div className="nav-actions" style={{ gap: '16px' }}>
          <a href="/rate-master/bulk-update" className="button button-gold" style={{ textDecoration: 'none', padding: '12px 24px', fontSize: '15px' }}>
            📊 Bulk Update
          </a>
          <button onClick={() => setShowAddModal(true)} className="button" style={{ padding: '12px 24px', fontSize: '15px' }}>
            ➕ Add Rate
          </button>
        </div>
      </div>

        {/* Loading State */}
        {loading && rates.length === 0 && currentRates.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '16px' }}>Loading rates...</p>
          </div>
        )}

        {/* Current Rates Section */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3vw, 1.75rem)' }}>✨ Active Rates</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Current metal pricing</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="button button-outline"
              style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500 }}
            >
              {showFilters ? '🔽 Hide Filters' : '🔼 Show Filters'}
            </button>
          </div>
          
          {currentRates.length === 0 && !loading ? (
            <div style={{
              background: 'var(--color-bg-secondary)',
              border: '2px dashed var(--color-border)',
              borderRadius: '12px',
              padding: 'clamp(24px, 4vw, 40px)',
              textAlign: 'center',
            }}>
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No Active Rates</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
                Add your first metal rate to get started
              </p>
              <button onClick={() => setShowAddModal(true)} className="button" style={{ padding: '12px 28px', fontSize: '15px' }}>
                ➕ Add First Rate
              </button>
            </div>
          ) : (
            <div className="grid-4">
              {currentRates.map((rate) => (
                <div key={rate.id} className="card animate-fadeIn" style={{
                  background: 'linear-gradient(135deg, var(--color-card-bg), var(--color-bg-secondary))',
                  padding: '24px',
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', margin: 0, marginBottom: '4px' }}>{rate.metalType}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500, margin: 0 }}>
                        {rate.purity}
                      </p>
                    </div>
                    <span className="badge badge-success">Active</span>
                  </div>
                  <div style={{
                    fontSize: 'clamp(24px, 4vw, 32px)',
                    fontWeight: 700,
                    marginBottom: '16px',
                    fontFamily: "'Playfair Display', serif",
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {formatCurrency(rate.ratePerGram)}
                    <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 'normal', marginLeft: '4px' }}>/g</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>Source:</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{rate.rateSource}</span>
                    </div>
                    {rate.defaultMakingChargePercent && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Making:</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{rate.defaultMakingChargePercent}%</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => viewHistory(rate.metalType, rate.purity)}
                    className="button button-outline"
                    style={{ width: '100%', padding: '10px 16px', fontSize: '14px', fontWeight: 500 }}
                  >
                    📋 View History
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Rates Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3vw, 1.75rem)' }}>📊 All Rates</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Complete rate history</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="button button-outline"
              style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500 }}
            >
              {showFilters ? '🔽 Hide Filters' : '🔼 Show Filters'}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="animate-slideDown" style={{
              background: 'linear-gradient(135deg, var(--color-bg-secondary), var(--color-card-bg))',
              borderRadius: '16px',
              padding: 'clamp(20px, 3vw, 28px)',
              marginBottom: '24px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '18px',
                marginBottom: '20px',
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Metal Type
                  </label>
                  <select
                    value={filters.metalType}
                    onChange={(e) => handleFilterChange('metalType', e.target.value)}
                    className="select"
                  >
                    <option value="">All Metals</option>
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Purity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 22K, 18K"
                    value={filters.purity}
                    onChange={(e) => handleFilterChange('purity', e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Rate Source
                  </label>
                  <select
                    value={filters.rateSource}
                    onChange={(e) => handleFilterChange('rateSource', e.target.value)}
                    className="select"
                  >
                    <option value="">All Sources</option>
                    <option value="MARKET">Market</option>
                    <option value="MANUAL">Manual</option>
                    <option value="API">API</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Status
                  </label>
                  <select
                    value={filters.isActive}
                    onChange={(e) => handleFilterChange('isActive', e.target.value)}
                    className="select"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={applyFilters}
                  disabled={loading}
                  className="button"
                  style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 500 }}
                >
                  ✓ Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  disabled={loading}
                  className="button button-outline"
                  style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 500 }}
                >
                  ✕ Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Rates Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Metal</th>
                  <th>Purity</th>
                  <th style={{ textAlign: 'right' }}>Rate/Gram</th>
                  <th>Valid Until</th>
                  <th style={{ textAlign: 'center' }}>Source</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rates.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)' }}>
                      <p style={{ marginBottom: '8px', fontSize: '15px' }}>No rates found</p>
                      <p style={{ fontSize: '13px' }}>Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate.id}>
                      <td style={{ fontWeight: 600 }}>{rate.metalType}</td>
                      <td style={{ fontWeight: 500 }}>{rate.purity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatCurrency(rate.ratePerGram)}
                      </td>
                      <td style={{ fontSize: '14px' }}>
                        {rate.validUntil ? formatDate(rate.validUntil) : (
                          <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No expiry</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={
                          rate.rateSource === 'API' ? 'badge badge-info' :
                          rate.rateSource === 'MARKET' ? 'badge badge-warning' :
                          'badge'
                        } style={{ background: rate.rateSource === 'MANUAL' ? 'var(--color-bg-secondary)' : undefined }}>
                          {rate.rateSource}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={rate.isActive ? 'badge badge-success' : 'badge badge-error'}>
                          {rate.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => toggleActiveStatus(rate.id, rate.isActive)}
                            disabled={submitting}
                            style={{
                              padding: '6px 16px',
                              background: 'transparent',
                              border: `2px solid ${rate.isActive ? '#ef4444' : '#00b894'}`,
                              color: rate.isActive ? '#ef4444' : '#00b894',
                              borderRadius: '8px',
                              cursor: submitting ? 'not-allowed' : 'pointer',
                              fontSize: '13px',
                              fontWeight: 600,
                              opacity: submitting ? 0.5 : 1,
                              transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => {
                              if (!submitting) {
                                e.currentTarget.style.background = rate.isActive ? '#ef4444' : '#00b894';
                                e.currentTarget.style.color = 'white';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!submitting) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = rate.isActive ? '#ef4444' : '#00b894';
                              }
                            }}
                          >
                            {rate.isActive ? '❌ Deactivate' : '✔ Activate'}
                          </button>
                          <button
                            onClick={() => viewHistory(rate.metalType, rate.purity)}
                            style={{
                              padding: '6px 16px',
                              background: 'transparent',
                              border: '2px solid var(--color-primary)',
                              color: 'var(--color-primary)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: 600,
                              transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'var(--color-primary)';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--color-primary)';
                            }}
                          >
                            📋 History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Rate Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
            overflow: 'auto',
            backdropFilter: 'blur(4px)',
          }}>
            <div className="card animate-slideUp" style={{
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              margin: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif" }}>Add New Rate</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  style={{
                    background: 'var(--color-bg-secondary)',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition)',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-border)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <h3 style={{
                  borderBottom: '2px solid var(--color-primary)',
                  paddingBottom: '10px',
                  marginBottom: '20px',
                  color: 'var(--color-text-primary)',
                }}>
                  Basic Information
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '18px',
                  marginBottom: '24px',
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Metal Type <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={formData.metalType}
                      onChange={(e) => handleFormChange('metalType', e.target.value)}
                      className="select"
                      required
                    >
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                      <option value="PLATINUM">Platinum</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Purity <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.purity}
                      onChange={(e) => handleFormChange('purity', e.target.value)}
                      className="input"
                      placeholder="22K, 18K, 24K, 999"
                      required
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Rate per Gram (₹) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.ratePerGram}
                      onChange={(e) => handleFormChange('ratePerGram', e.target.value)}
                      className="input"
                      placeholder="5500.00"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Rate Source <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={formData.rateSource}
                      onChange={(e) => handleFormChange('rateSource', e.target.value)}
                      className="select"
                      required
                    >
                      <option value="MANUAL">Manual Entry</option>
                      <option value="MARKET">Market Rate</option>
                      <option value="API">API Integration</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Valid Until (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={(e) => handleFormChange('validUntil', e.target.value)}
                      className="input"
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleFormChange('isActive', e.target.checked)}
                        style={{
                          marginRight: '12px',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          accentColor: 'var(--color-primary)',
                        }}
                      />
                      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Set as Active Rate</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '28px', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="button"
                    style={{ flex: '1 1 200px', padding: '14px 24px', fontSize: '15px', fontWeight: 600 }}
                  >
                    {submitting ? '⏳ Creating...' : '✔ Create Rate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="button button-outline"
                    style={{ flex: '1 1 200px', padding: '14px 24px', fontSize: '15px', fontWeight: 600 }}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedRate && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
            overflow: 'auto',
            backdropFilter: 'blur(4px)',
          }}>
            <div className="card animate-slideUp" style={{
              maxWidth: '1000px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              margin: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif" }}>Rate History</h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '15px' }}>
                    {selectedRate.metalType} - {selectedRate.purity}
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  style={{
                    background: 'var(--color-bg-secondary)',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition)',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-border)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                >
                  ×
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'right' }}>Rate/Gram</th>
                      <th style={{ textAlign: 'center' }}>Source</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th>Created By</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                          No history available
                        </td>
                      </tr>
                    ) : (
                      historyData.map((rate) => (
                        <tr key={rate.id}>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {formatCurrency(rate.ratePerGram)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={
                              rate.rateSource === 'API' ? 'badge badge-info' :
                              rate.rateSource === 'MARKET' ? 'badge badge-warning' :
                              'badge'
                            } style={{ background: rate.rateSource === 'MANUAL' ? 'var(--color-bg-secondary)' : undefined }}>
                              {rate.rateSource}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={rate.isActive ? 'badge badge-success' : 'badge'}>
                              {rate.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td style={{ fontSize: '14px' }}>
                            {rate.createdBy || 'System'}
                          </td>
                          <td style={{ fontSize: '14px' }}>
                            {formatDate(rate.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => setShowHistoryModal(false)}
                className="button"
                style={{ marginTop: '24px', width: '100%', padding: '14px', fontSize: '15px', fontWeight: 600 }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

