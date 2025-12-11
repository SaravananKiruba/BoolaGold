'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalShops: number;
  activeShops: number;
  totalUsers: number;
  activeUsers: number;
  totalCustomers: number;
  totalProducts: number;
  totalSalesOrders: number;
  shops: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    isActive: boolean;
    createdAt: string;
    _count: {
      users: number;
      customers: number;
      products: number;
      salesOrders: number;
    };
  }>;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/dashboard');
      
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="spinner" style={{ width: '50px', height: '50px' }} />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <h3>❌ Error Loading Dashboard</h3>
          <p>{error || 'Failed to load dashboard'}</p>
          <button onClick={fetchDashboardData} className="button">🔄 Retry</button>
        </div>
      </div>
    );
  }

  // Super Admin dashboard focuses on shops and users management only

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎛️ Super Admin Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            SaaS Platform - System Overview & Shop Management
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            className="button button-primary" 
            onClick={() => router.push('/shops')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '1.2rem' }}>🏪</span>
            Create Shop
          </button>
          <button 
            className="button" 
            onClick={() => router.push('/users')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: 'white',
              border: 'none'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>👥</span>
            Create Shop Owner
          </button>
        </div>
      </div>

      {/* Quick Actions Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        borderRadius: '16px', 
        padding: '32px', 
        marginBottom: '30px',
        boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
            🚀 Quick Actions
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem' }}>
            Set up new jewelry shops and assign administrators
          </p>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '16px',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <button
            onClick={() => router.push('/shops')}
            style={{
              padding: '24px',
              background: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏪</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
              Create New Shop
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
              Set up shop profile, branding, GST, and bank details
            </div>
            <div style={{ 
              marginTop: '12px', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              color: '#667eea',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              Get Started <span>→</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/users')}
            style={{
              padding: '24px',
              background: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👑</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
              Create Shop Owner
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
              Assign an OWNER with full control over their shop
            </div>
            <div style={{ 
              marginTop: '12px', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              Create User <span>→</span>
            </div>
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Total Shops</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{stats.totalShops}</div>
            <div style={{ marginTop: '12px' }}>
              <span className="badge badge-success" style={{ marginRight: '8px' }}>{stats.activeShops} active</span>
              <span className="badge badge-error">{stats.totalShops - stats.activeShops} inactive</span>
            </div>
            <div style={{ marginTop: '12px', height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${stats.totalShops > 0 ? (stats.activeShops / stats.totalShops) * 100 : 0}%`, 
                background: 'var(--color-success)', 
                transition: 'width 0.3s ease' 
              }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>System Users</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{stats.totalUsers}</div>
            <div style={{ marginTop: '12px' }}>
              <span className="badge badge-info" style={{ marginRight: '8px' }}>{stats.activeUsers} active</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {stats.totalUsers - stats.activeUsers} inactive
              </span>
            </div>
            <div style={{ marginTop: '12px', height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0}%`, 
                background: 'var(--color-info)', 
                transition: 'width 0.3s ease' 
              }} />
            </div>
          </div>
        </div>


      </div>

      {/* Secondary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '24px', background: '#faf5ff', border: '1px solid #d8b4fe', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.9rem', color: '#7c3aed', fontWeight: 600, marginBottom: '8px' }}>Platform Health</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#5b21b6' }}>
            {stats.totalShops > 0 ? Math.round((stats.activeShops / stats.totalShops) * 100) : 0}%
          </div>
          <div style={{ fontSize: '0.85rem', color: '#8b5cf6', marginTop: '8px' }}>Shop Activation Rate</div>
        </div>

        <div style={{ padding: '24px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.9rem', color: '#15803d', fontWeight: 600, marginBottom: '8px' }}>User Engagement</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#14532d' }}>
            {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
          </div>
          <div style={{ fontSize: '0.85rem', color: '#16a34a', marginTop: '8px' }}>Active Users Rate</div>
        </div>
      </div>

      {/* Shops Table */}
      <div className="card">
        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '4px' }}>Shops Overview</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Detailed view of all jewelry shops</p>
          </div>
          <button className="button button-primary" onClick={() => router.push('/shops')}>
            ➕ Create New Shop
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Shop Name</th>
                <th>Location</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Users</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.shops.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>No shops found</div>
                    <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem', marginTop: '8px' }}>Create your first shop to get started</div>
                  </td>
                </tr>
              ) : (
                stats.shops.map((shop) => (
                  <tr key={shop.id}>
                    <td style={{ fontWeight: 600 }}>{shop.name}</td>
                    <td style={{ fontSize: '0.9rem' }}>{shop.city}, {shop.state}</td>
                    <td>
                      <span className={`badge ${shop.isActive ? 'badge-success' : 'badge-error'}`}>
                        {shop.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-info">{shop._count.users}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(shop.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button 
                        className="button button-small button-secondary"
                        onClick={() => {
                          console.log('🏪 Navigating to shops page from shop:', shop.id);
                          router.push('/shops');
                        }}
                        title="Manage shop details, users, and configuration"
                      >
                        ⚙️ Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
