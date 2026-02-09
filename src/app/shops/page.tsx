'use client';

import { useState, useEffect } from 'react';
import { showToast } from '@/utils/toast';
import { usePageGuard } from '@/hooks/usePageGuard';

interface Shop {
  id: string;
  name: string;
  tagline: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string | null;
  gstNumber: string;
  panNumber: string;
  logo: string | null;
  primaryColor: string;
  invoicePrefix: string;
  isActive: boolean;
  shopBusinessType?: 'RETAIL' | 'WHOLESALE';
  createdAt: string;
  _count?: {
    users: number;
    customers: number;
    products: number;
    salesOrders: number;
  };
}

interface ShopFormData {
  name: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  panNumber: string;
  logo: string;
  primaryColor: string;
  invoicePrefix: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
  termsAndConditions: string;
  shopBusinessType: 'RETAIL' | 'WHOLESALE';
}

export default function ShopsPage() {
  // 🔒 SECURITY: Only SUPER_ADMIN and OWNER can access shops page
  const { isAuthorized, isLoading: authLoading } = usePageGuard(['SUPER_ADMIN', 'OWNER']);
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShopFormData>({
    name: '',
    tagline: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    website: '',
    gstNumber: '',
    panNumber: '',
    logo: '',
    primaryColor: '#667eea',
    invoicePrefix: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    bankBranch: '',
    termsAndConditions: '',
    shopBusinessType: 'RETAIL',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShops();
    // Get current user role from session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        console.log('Session data:', data);
        if (data.data?.role) {
          setUserRole(data.data.role);
          console.log('User role set to:', data.data.role);
        } else if (data.role) {
          // Handle alternate response format
          setUserRole(data.role);
          console.log('User role set to:', data.role);
        }
      })
      .catch(err => {
        console.error('Failed to fetch session:', err);
      });
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching shops from /api/shops...');
      const response = await fetch('/api/shops');
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok) {
        setShops(data.data || []);
        console.log('✅ Shops loaded successfully:', data.data?.length || 0);
      } else {
        console.error('❌ Failed to fetch shops:', data.error);
        showToast('error', data.error || 'Failed to fetch shops');
      }
    } catch (error) {
      console.error('❌ Error fetching shops:', error);
      showToast('error', 'Failed to fetch shops: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      console.log('🔄 Creating shop:', formData);
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('📡 Create shop response status:', response.status);
      const data = await response.json();
      console.log('📦 Create shop response data:', data);

      if (response.ok) {
        showToast('success', 'Shop created successfully');
        setShowCreateModal(false);
        setFormData({
          name: '',
          tagline: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          phone: '',
          email: '',
          website: '',
          gstNumber: '',
          panNumber: '',
          logo: '',
          primaryColor: '#667eea',
          invoicePrefix: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          bankBranch: '',
          termsAndConditions: '',
          shopBusinessType: 'RETAIL',
        });
        fetchShops();
      } else {
        console.error('❌ Failed to create shop:', data.error);
        showToast('error', data.error || 'Failed to create shop');
      }
    } catch (error) {
      console.error('❌ Error creating shop:', error);
      showToast('error', 'Failed to create shop: ' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleShopStatus = async (shopId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        showToast('success', 'Shop status updated');
        fetchShops();
      } else {
        const data = await response.json();
        showToast('error', data.error || 'Failed to update shop');
      }
    } catch (error) {
      console.error('Error updating shop:', error);
      showToast('error', 'Failed to update shop');
    }
  };

  const handleEditShop = async (shop: Shop) => {
    setSelectedShop(shop);
    setFormData({
      name: shop.name,
      tagline: shop.tagline || '',
      address: shop.address,
      city: shop.city,
      state: shop.state,
      pincode: shop.pincode,
      phone: shop.phone,
      email: shop.email,
      website: shop.website || '',
      gstNumber: shop.gstNumber,
      panNumber: shop.panNumber,
      logo: shop.logo || '',
      primaryColor: shop.primaryColor,
      invoicePrefix: shop.invoicePrefix,
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      bankBranch: '',
      termsAndConditions: '',
      shopBusinessType: shop.shopBusinessType || 'RETAIL',
    });
    setShowEditModal(true);
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/shops/${selectedShop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('success', 'Shop updated successfully');
        setShowEditModal(false);
        setSelectedShop(null);
        fetchShops();
      } else {
        showToast('error', data.error || 'Failed to update shop');
      }
    } catch (error) {
      console.error('Error updating shop:', error);
      showToast('error', 'Failed to update shop');
    } finally {
      setSubmitting(false);
    }
  };

  // 🔒 Show loading during authorization check
  if (authLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>Checking authorization...</p>
      </div>
    );
  }

  // 🔒 Redirect if not authorized (handled by usePageGuard)
  if (!isAuthorized) {
    return null;
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>Loading shops...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
            🏪 Shop Management
          </h1>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>
            Manage all shops in the system (Super Admin Only)
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>➕</span>
          Create New Shop
        </button>
      </div>

      {/* Shops Grid */}
      {shops.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏪</div>
          <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '8px' }}>No Shops Found</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>Create your first shop to get started</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
          }}
        >
          {shops.map((shop) => (
            <div
              key={shop.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: shop.isActive ? '2px solid #4ade80' : '2px solid #cbd5e1',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Shop Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#333', marginBottom: '4px' }}>
                    {shop.name}
                  </h3>
                  {shop.tagline && (
                    <p style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>{shop.tagline}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleShopStatus(shop.id, shop.isActive)}
                  style={{
                    padding: '6px 12px',
                    background: shop.isActive ? '#dcfce7' : '#f1f5f9',
                    color: shop.isActive ? '#16a34a' : '#64748b',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {shop.isActive ? '✓ Active' : '✕ Inactive'}
                </button>
              </div>

              {/* Shop Details */}
              <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#666' }}>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>📍</span>
                  <span>{shop.city}, {shop.state} - {shop.pincode}</span>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>📞</span>
                  <span>{shop.phone}</span>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>📧</span>
                  <span>{shop.email}</span>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>🏷️</span>
                  <span>GST: {shop.gstNumber}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem' }}>🔖</span>
                  <span>Invoice Prefix: {shop.invoicePrefix}</span>
                </div>
              </div>

              {/* Shop Stats */}
              {shop._count && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>
                      {shop._count.users}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Users</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>
                      {shop._count.customers}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Customers</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>
                      {shop._count.products}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Products</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>
                      {shop._count.salesOrders}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Sales</div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => handleEditShop(shop)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                ✏️ Edit Shop Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Shop Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '24px',
                borderBottom: '2px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'white',
                zIndex: 1,
              }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333' }}>🏪 Create New Shop</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {/* Basic Information */}
                <div style={{ gridColumn: 'span 2' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
                    Basic Information
                  </h3>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Shop Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Tagline
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Business Type <span style={{ color: 'red' }}>*</span>
                    {(userRole && userRole !== 'SUPER_ADMIN') && <span style={{ color: '#666', fontSize: '0.85rem', marginLeft: '8px' }}>(Super Admin only)</span>}
                  </label>
                  <select
                    name="shopBusinessType"
                    value={formData.shopBusinessType}
                    onChange={handleInputChange}
                    disabled={userRole !== null && userRole !== 'SUPER_ADMIN'}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: (userRole !== null && userRole !== 'SUPER_ADMIN') ? '#f1f5f9' : 'white',
                      cursor: (userRole !== null && userRole !== 'SUPER_ADMIN') ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <option value="RETAIL">Retail (Metal ↔ Cash)</option>
                    <option value="WHOLESALE">Wholesale (Metal ↔ Metal)</option>
                  </select>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                    {formData.shopBusinessType === 'RETAIL' 
                      ? '💰 Retail shops sell jewelry for cash payments (CASH, UPI, Card, etc.)'
                      : '🔄 Wholesale shops exchange metal for metal only (no cash transactions)'}
                  </p>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Address <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    City <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    State <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Pincode <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Phone <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Email <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                {/* Tax Information */}
                <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
                    Tax Information
                  </h3>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    GST Number <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    PAN Number <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                {/* Invoice Settings */}
                <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
                    Invoice Settings
                  </h3>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Invoice Prefix <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="invoicePrefix"
                    value={formData.invoicePrefix}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., BG"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Primary Color
                  </label>
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      height: '44px',
                    }}
                  />
                </div>

                {/* Bank Details */}
                <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
                    Bank Details (Optional)
                  </h3>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Bank Branch
                  </label>
                  <input
                    type="text"
                    name="bankBranch"
                    value={formData.bankBranch}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                  paddingTop: '24px',
                  borderTop: '2px solid #f1f5f9',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    background: submitting
                      ? '#cbd5e1'
                      : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Creating...' : 'Create Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shop Modal */}
      {showEditModal && selectedShop && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => {
            setShowEditModal(false);
            setSelectedShop(null);
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '24px',
                borderBottom: '2px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'white',
                zIndex: 1,
              }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333' }}>✏️ Edit Shop: {selectedShop.name}</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedShop(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Form - Reuse the same form structure */}
            <form onSubmit={handleUpdateShop} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {/* Basic Information */}
                <div style={{ gridColumn: 'span 2' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
                    Basic Information
                  </h3>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Shop Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Tagline
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Business Type <span style={{ color: 'red' }}>*</span>
                    <span style={{ color: '#666', fontSize: '0.85rem', marginLeft: '8px' }}>(Cannot be changed)</span>
                  </label>
                  <select
                    name="shopBusinessType"
                    value={formData.shopBusinessType}
                    onChange={handleInputChange}
                    disabled={true}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      backgroundColor: '#f1f5f9',
                      cursor: 'not-allowed',
                    }}
                  >
                    <option value="RETAIL">Retail (Metal ↔ Cash)</option>
                    <option value="WHOLESALE">Wholesale (Metal ↔ Metal)</option>
                  </select>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                    Shop business type cannot be changed after creation
                  </p>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Address <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    City <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    State <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Pincode <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Phone <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Email <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    GST Number <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Invoice Prefix <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="invoicePrefix"
                    value={formData.invoicePrefix}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Primary Color
                  </label>
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      height: '44px',
                    }}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                  paddingTop: '24px',
                  borderTop: '2px solid #f1f5f9',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedShop(null);
                  }}
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    background: submitting
                      ? '#cbd5e1'
                      : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Updating...' : 'Update Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
