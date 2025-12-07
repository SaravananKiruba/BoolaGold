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

  const totalProducts = stats.shops.reduce((sum, shop) => sum + shop._count.products, 0);
  const totalCustomers = stats.shops.reduce((sum, shop) => sum + shop._count.customers, 0);
  const totalSales = stats.shops.reduce((sum, shop) => sum + shop._count.salesOrders, 0);
  const avgProductsPerShop = stats.totalShops > 0 ? Math.round(totalProducts / stats.totalShops) : 0;
  const avgCustomersPerShop = stats.totalShops > 0 ? Math.round(totalCustomers / stats.totalShops) : 0;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎛️ Super Admin Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            SaaS Platform - System Overview & Shop Management
          </p>
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

        <div className="card">
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Total Products</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{totalProducts.toLocaleString()}</div>
            <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              Avg {avgProductsPerShop} per shop
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Total Sales</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{totalSales.toLocaleString()}</div>
            <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              Across all shops
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '24px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.9rem', color: '#1e40af', fontWeight: 600, marginBottom: '8px' }}>Total Customers</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>{totalCustomers.toLocaleString()}</div>
          <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: '8px' }}>Avg {avgCustomersPerShop} per shop</div>
        </div>

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
                <th style={{ textAlign: 'right' }}>Customers</th>
                <th style={{ textAlign: 'right' }}>Products</th>
                <th style={{ textAlign: 'right' }}>Sales</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.shops.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px' }}>
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
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge" style={{ background: '#f3e8ff', color: '#7c3aed' }}>{shop._count.customers}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-warning">{shop._count.products}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-success">{shop._count.salesOrders}</span>
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
