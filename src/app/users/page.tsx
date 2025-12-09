'use client';

import { useState, useEffect } from 'react';
import { usePageGuard } from '@/hooks/usePageGuard';
import { showToast } from '@/utils/toast';

interface Shop {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  shopId: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  shop: {
    id: string;
    name: string;
  } | null;
}

interface UserFormData {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  shopId: string;
}

export default function UsersPage() {
  const { isAuthorized, isLoading: authLoading } = usePageGuard(['OWNER', 'SUPER_ADMIN']);
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [createdUser, setCreatedUser] = useState<{ username: string; password: string; name: string; role: string } | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    role: 'SALES',
    shopId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      fetchCurrentUser();
      fetchShops();
      fetchUsers();
    }
  }, [isAuthorized]);

  if (authLoading || !isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Verifying access...</p>
        </div>
      </div>
    );
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      console.log('📍 Users Page - Session Response:', data);
      
      // Session endpoint returns data.data.user (nested structure)
      const user = data.data?.user || data.user;
      
      if (response.ok && user) {
        console.log('✅ Users Page - Current User Role:', user.role, 'ShopId:', user.shopId);
        setCurrentUserRole(user.role);
        
        // Set default role and shopId based on current user
        if (user.role === 'SUPER_ADMIN') {
          setFormData(prev => ({ ...prev, role: 'OWNER' }));
        } else if (user.role === 'OWNER') {
          // OWNER: Auto-fill their shopId and default to SALES role
          setFormData(prev => ({ 
            ...prev, 
            role: 'SALES',
            shopId: user.shopId || '' // Auto-fill owner's shop
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedShop]);

  const fetchShops = async () => {
    try {
      console.log('🔍 Fetching shops...');
      const response = await fetch('/api/shops');
      const data = await response.json();
      console.log('📥 Shops response:', { ok: response.ok, status: response.status, data });

      if (response.ok) {
        const shopsData = data.data || [];
        console.log('✅ Shops loaded:', shopsData.length, 'shops');
        setShops(shopsData);
      } else {
        console.error('❌ Failed to fetch shops:', data);
        showToast('error', data.error || 'Failed to fetch shops. You may not have permission.');
      }
    } catch (error) {
      console.error('❌ Error fetching shops:', error);
      showToast('error', 'Error loading shops');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = selectedShop === 'all' ? '/api/users?all=true' : `/api/users?shopId=${selectedShop}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.data || []);
      } else {
        showToast('error', data.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validation check for SUPER_ADMIN creating OWNER
      if (currentUserRole === 'SUPER_ADMIN' && formData.role === 'OWNER' && !formData.shopId) {
        showToast('error', 'Please select a shop for the OWNER user');
        setSubmitting(false);
        return;
      }

      console.log('📤 Creating user with data:', {
        ...formData,
        password: '***hidden***',
        currentUserRole,
      });

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('📥 Create user response:', data);

      if (response.ok) {
        showToast('success', 'User created successfully');
        // Store credentials for display
        setCreatedUser({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          role: formData.role,
        });
        setShowCreateModal(false);
        setFormData({
          username: '',
          password: '',
          name: '',
          email: '',
          phone: '',
          role: 'SALES',
          shopId: '',
        });
        fetchUsers();
      } else {
        console.error('❌ Failed to create user:', data);
        showToast('error', data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('error', 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenCreateModal = async () => {
    // Reset form with proper defaults based on user role
    const defaultRole = currentUserRole === 'SUPER_ADMIN' ? 'OWNER' : 'SALES';
    console.log('🔓 Opening create modal - Current user role:', currentUserRole, 'Default role:', defaultRole);
    console.log('🔍 Available shops:', shops.length);
    
    // Warn if SUPER_ADMIN but no shops available
    if (currentUserRole === 'SUPER_ADMIN' && shops.length === 0) {
      showToast('warning', 'No shops available. Please create a shop first!');
    }
    
    // Get current user's shopId if OWNER
    let ownerShopId = '';
    if (currentUserRole === 'OWNER') {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        const user = data.data?.user || data.user;
        ownerShopId = user?.shopId || '';
        console.log('✅ Owner Shop ID:', ownerShopId);
      } catch (error) {
        console.error('Error fetching owner shop:', error);
      }
    }
    
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      role: defaultRole,
      shopId: ownerShopId, // Auto-fill for OWNER
    });
    setShowCreateModal(true);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        showToast('success', 'User status updated');
        fetchUsers();
      } else {
        const data = await response.json();
        showToast('error', data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('error', 'Failed to update user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { bg: '#fce7f3', color: '#831843', border: '#ec4899' };
      case 'OWNER':
        return { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' };
      case 'SALES':
        return { bg: '#dbeafe', color: '#1e3a8a', border: '#3b82f6' };
      case 'ACCOUNTS':
        return { bg: '#dcfce7', color: '#14532d', border: '#22c55e' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#94a3b8' };
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'OWNER':
        return 'Owner';
      case 'SALES':
        return 'Sales';
      case 'ACCOUNTS':
        return 'Accounts';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Super Admin Instructions Banner */}
      {currentUserRole === 'SUPER_ADMIN' && shops.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '2px solid #fbbf24',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
            <div style={{ fontSize: '2.5rem' }}>⚠️</div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
                No Shops Available - Create a Shop First!
              </h3>
              <p style={{ color: '#92400e', fontSize: '0.95rem', marginBottom: '12px', lineHeight: '1.6' }}>
                Before you can create OWNER users, you need to create at least one shop. Here's the workflow:
              </p>
              <ol style={{ margin: '0 0 12px 20px', color: '#92400e', fontSize: '0.95rem', lineHeight: '1.8' }}>
                <li><strong>Step 1:</strong> Create a shop at <strong>/shops</strong> page</li>
                <li><strong>Step 2:</strong> Return here to create an OWNER user</li>
                <li><strong>Step 3:</strong> Assign the OWNER to the shop you created</li>
                <li><strong>Step 4:</strong> Share credentials with the shop owner</li>
              </ol>
              <button
                onClick={() => window.location.href = '/shops'}
                style={{
                  padding: '12px 20px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🏪</span>
                Go to Shops Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner - When shops exist */}
      {currentUserRole === 'SUPER_ADMIN' && shops.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
          border: '2px solid #22c55e',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ fontSize: '1.8rem' }}>✅</div>
          <div>
            <div style={{ fontWeight: 600, color: '#14532d', fontSize: '1rem', marginBottom: '4px' }}>
              Ready to Create Shop Owners!
            </div>
            <div style={{ color: '#15803d', fontSize: '0.9rem' }}>
              You have <strong>{shops.length}</strong> shop{shops.length > 1 ? 's' : ''} available. Click "Create New User" to assign OWNER users.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
            👥 User Management
          </h1>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>
            {currentUserRole === 'SUPER_ADMIN' ? 'Create OWNER users and assign them to shops' : 'Manage users across all shops'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Shop Filter */}
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer',
              background: 'white',
            }}
          >
            <option value="all">All Shops</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenCreateModal}
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
            Create New User
          </button>
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👥</div>
          <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '8px' }}>No Users Found</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>Create your first user to get started</p>
        </div>
      ) : (
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                    User
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                    Shop
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                    Role
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                    Contact
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                    Last Login
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                    Status
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const roleColors = getRoleBadgeColor(user.role);
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            @{user.username}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
                          {user.shop ? user.shop.name : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>System-wide</span>}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: roleColors.bg,
                            color: roleColors.color,
                            border: `1px solid ${roleColors.border}`,
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          {getRoleDisplayName(user.role)}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {user.email && <div>📧 {user.email}</div>}
                          {user.phone && <div>📞 {user.phone}</div>}
                          {!user.email && !user.phone && <div style={{ color: '#cbd5e1' }}>No contact</div>}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Never'}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: user.isActive ? '#22c55e' : '#ef4444',
                          }}
                        />
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          style={{
                            padding: '6px 12px',
                            background: user.isActive ? '#fee2e2' : '#dcfce7',
                            color: user.isActive ? '#dc2626' : '#16a34a',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.opacity = '0.8';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
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
              maxWidth: '600px',
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
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333' }}>👤 Create New User</h2>
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
              <div style={{ display: 'grid', gap: '16px' }}>
                {/* Role Selection - Moved to top */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    User Role <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                    }}
                  >
                    {currentUserRole === 'SUPER_ADMIN' ? (
                      <>
                        <option value="OWNER">👑 OWNER - Shop Administrator (Full Access)</option>
                      </>
                    ) : (
                      <>
                        <option value="SALES">📊 SALES - Sales and Inventory Management</option>
                        <option value="ACCOUNTS">💰 ACCOUNTS - Financial and Purchase Management</option>
                      </>
                    )}
                  </select>
                  {currentUserRole === 'SUPER_ADMIN' && (
                    <div style={{ marginTop: '8px', padding: '10px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', fontSize: '0.85rem', color: '#92400e' }}>
                      <strong>💡 Super Admin:</strong> Create <strong>OWNER</strong> users to manage shops. Owners get full access to all modules and can create their team (SALES & ACCOUNTS).
                    </div>
                  )}
                  {currentUserRole === 'OWNER' && (
                    <div style={{ marginTop: '8px', padding: '10px', background: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '6px', fontSize: '0.85rem', color: '#1e3a8a' }}>
                      <strong>💡 Shop Owner:</strong> Create <strong>SALES</strong> and <strong>ACCOUNTS</strong> staff to manage your shop operations.
                    </div>
                  )}
                </div>

                {/* Shop Selection - Different behavior for SUPER_ADMIN vs OWNER */}
                {formData.role !== 'SUPER_ADMIN' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                      Shop <span style={{ color: 'red' }}>*</span>
                    </label>
                    <select
                      name="shopId"
                      value={formData.shopId}
                      onChange={handleInputChange}
                      required={formData.role !== 'SUPER_ADMIN'}
                      disabled={currentUserRole === 'OWNER'} // OWNER can't change shop
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        cursor: currentUserRole === 'OWNER' ? 'not-allowed' : 'pointer',
                        background: currentUserRole === 'OWNER' ? '#f8fafc' : 'white',
                        color: currentUserRole === 'OWNER' ? '#64748b' : 'inherit',
                      }}
                    >
                      <option value="">Select Shop</option>
                      {shops.map((shop) => (
                        <option key={shop.id} value={shop.id}>
                          {shop.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* OWNER: Show info that shop is auto-selected */}
                    {currentUserRole === 'OWNER' && formData.shopId && (
                      <div style={{ marginTop: '8px', padding: '10px', background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '6px', fontSize: '0.85rem', color: '#14532d' }}>
                        <strong>✅ Auto-Selected:</strong> Users will be created for your shop automatically.
                      </div>
                    )}
                    
                    {/* SUPER_ADMIN: Show error if no shops */}
                    {shops.length === 0 && currentUserRole === 'SUPER_ADMIN' && (
                      <div style={{ marginTop: '8px', padding: '10px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '0.85rem', color: '#991b1b' }}>
                        <strong>⚠️ No shops available!</strong> Please create a shop first before creating an OWNER user.
                      </div>
                    )}
                    
                    {/* SUPER_ADMIN: Show info about shop assignment */}
                    {currentUserRole === 'SUPER_ADMIN' && shops.length > 0 && (
                      <div style={{ marginTop: '8px', padding: '10px', background: '#e0e7ff', border: '1px solid #6366f1', borderRadius: '6px', fontSize: '0.85rem', color: '#3730a3' }}>
                        <strong>🏪 Note:</strong> Assign this OWNER to a specific shop. They will have full control over that shop.
                      </div>
                    )}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Full Name <span style={{ color: 'red' }}>*</span>
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

                {/* Username */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Username (Login ID) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., mumbai_admin or john_sales"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                  <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                    This will be used to login to the system
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Password <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                    }}
                  />
                  <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                    💡 Note: Password is shown in plain text - you'll need to share these credentials
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
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

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
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
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal - Show Credentials */}
      {createdUser && (
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
            zIndex: 1001,
            padding: '20px',
          }}
          onClick={() => setCreatedUser(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '550px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Header */}
            <div style={{ padding: '24px', borderBottom: '2px solid #dcfce7', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>✅</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#14532d', marginBottom: '8px' }}>
                  User Created Successfully!
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#15803d' }}>
                  {createdUser.role === 'OWNER' ? 'Share these credentials with the Shop Admin' : 'Share these credentials with the user'}
                </p>
              </div>
            </div>

            {/* Credentials Display */}
            <div style={{ padding: '24px' }}>
              <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>USER NAME</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{createdUser.name}</div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>ROLE</div>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      background: createdUser.role === 'SUPER_ADMIN' ? '#fce7f3' : createdUser.role === 'OWNER' ? '#fef3c7' : createdUser.role === 'SALES' ? '#dbeafe' : '#dcfce7',
                      color: createdUser.role === 'SUPER_ADMIN' ? '#831843' : createdUser.role === 'OWNER' ? '#92400e' : createdUser.role === 'SALES' ? '#1e3a8a' : '#14532d',
                      border: `1px solid ${createdUser.role === 'SUPER_ADMIN' ? '#ec4899' : createdUser.role === 'OWNER' ? '#fbbf24' : createdUser.role === 'SALES' ? '#3b82f6' : '#22c55e'}`,
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}>
                      {getRoleDisplayName(createdUser.role)}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '16px', background: '#fff7ed', padding: '12px', borderRadius: '8px', border: '2px solid #fed7aa' }}>
                  <div style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '6px', fontWeight: 600 }}>🔑 LOGIN USERNAME</div>
                  <div style={{ 
                    fontSize: '1.3rem', 
                    fontWeight: 700, 
                    color: '#c2410c', 
                    fontFamily: 'monospace',
                    background: 'white',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #fed7aa'
                  }}>
                    {createdUser.username}
                  </div>
                </div>

                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '2px solid #fecaca' }}>
                  <div style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: '6px', fontWeight: 600 }}>🔒 PASSWORD</div>
                  <div style={{ 
                    fontSize: '1.3rem', 
                    fontWeight: 700, 
                    color: '#dc2626', 
                    fontFamily: 'monospace',
                    background: 'white',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #fecaca'
                  }}>
                    {createdUser.password}
                  </div>
                </div>
              </div>

              {createdUser.role === 'OWNER' && (
                <div style={{ 
                  background: '#eff6ff', 
                  border: '2px solid #bfdbfe', 
                  borderRadius: '8px', 
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ fontSize: '1.5rem' }}>💡</div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '6px' }}>Next Steps for Shop Owner:</div>
                      <ol style={{ margin: 0, paddingLeft: '20px', color: '#1e40af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        <li>Share these credentials with the shop owner</li>
                        <li>They can login at <strong>{typeof window !== 'undefined' ? window.location.origin : ''}/login</strong></li>
                        <li>They have <strong>FULL ACCESS</strong> to all shop modules (customers, products, sales, purchases, reports)</li>
                        <li>They can create SALES and ACCOUNTS staff for their team</li>
                        <li>They manage their shop independently</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                <button
                  onClick={() => {
                    const credentials = `Username: ${createdUser.username}\nPassword: ${createdUser.password}\nName: ${createdUser.name}\nRole: ${getRoleDisplayName(createdUser.role)}`;
                    navigator.clipboard.writeText(credentials);
                    showToast('success', 'Credentials copied to clipboard!');
                  }}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '2px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  📋 Copy Credentials
                </button>
                <button
                  onClick={() => setCreatedUser(null)}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
