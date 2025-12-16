'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardMetrics {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  lastOrderInvoice: string | null;
  lastOrderAmount: number | null;
  insights: string;
  todayOrders: number;
  todayRevenue: number;
  paymentStatusBreakdown: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shopInfo, setShopInfo] = useState<any>(null);

  // Redirect Super Admin to their own dashboard
  useEffect(() => {
    const checkRole = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          const role = data.data?.user?.role;
          if (role === 'SUPER_ADMIN') {
            console.log('🔄 Redirecting Super Admin to /super-admin');
            router.push('/super-admin');
          }
        }
      } catch (error) {
        console.error('Error checking role:', error);
      }
    };
    checkRole();
  }, [router]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/dashboard?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch metrics');
      }

      setMetrics(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchShopInfo = async () => {
    try {
      const response = await fetch('/api/shops');
      const data = await response.json();
      if (data.success && data.data?.[0]) {
        setShopInfo(data.data[0]);
      }
    } catch (err) {
      console.error('Error fetching shop info:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchShopInfo();
  }, []);

  const handleApplyFilter = () => {
    fetchMetrics();
  };

  const handleExport = () => {
    if (!metrics) return;

    const data = {
      generatedAt: new Date().toISOString(),
      dateRange: metrics.dateRange,
      metrics: {
        totalProducts: metrics.totalProducts,
        totalCustomers: metrics.totalCustomers,
        totalOrders: metrics.totalOrders,
        totalRevenue: metrics.totalRevenue,
        averageOrderValue: metrics.averageOrderValue,
        todayOrders: metrics.todayOrders,
        todayRevenue: metrics.todayRevenue,
      },
      paymentBreakdown: metrics.paymentStatusBreakdown,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-summary-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !metrics) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="spinner" style={{ width: '50px', height: '50px' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <h3 style={{ marginTop: 0 }}>❌ Error Loading Dashboard</h3>
          <p style={{ marginBottom: '16px' }}>{error}</p>
          <button onClick={fetchMetrics} className="button">🔄 Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Business Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Real-time insights and performance metrics
          </p>
        </div>
        <div className="nav-actions">
          <Link href="/" className="button button-outline" style={{ textDecoration: 'none' }}>
            ← Home
          </Link>
          <button onClick={fetchMetrics} className="button">
            🔄 Refresh
          </button>
          <button onClick={handleExport} className="button button-gold">
            📥 Export
          </button>
        </div>
      </div>

      {/* Subscription Status Banner */}
      {shopInfo && (
        <>
          {shopInfo.subscriptionType === 'TRIAL' && shopInfo.trialEndDate && (
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>
                  🎯 Trial Period Active
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Expires: {new Date(shopInfo.trialEndDate).toLocaleDateString()} 
                  ({Math.ceil((new Date(shopInfo.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining)
                </div>
              </div>
              <button
                onClick={() => router.push('/subscription')}
                style={{
                  background: 'white',
                  color: '#3b82f6',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Upgrade to Lifetime
              </button>
            </div>
          )}

          {shopInfo.subscriptionType === 'LIFETIME' && shopInfo.amcRenewalDate && 
           Math.ceil((new Date(shopInfo.amcRenewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) < 30 && (
            <div style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
            }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>
                  ⚠️ AMC Renewal Due Soon
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  AMC Expires: {new Date(shopInfo.amcRenewalDate).toLocaleDateString()} 
                  ({Math.ceil((new Date(shopInfo.amcRenewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining)
                </div>
              </div>
              <button
                onClick={() => router.push('/subscription')}
                style={{
                  background: 'white',
                  color: '#f97316',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Renew AMC
              </button>
            </div>
          )}
        </>
      )}

      <div className="alert alert-info" style={{ marginBottom: '24px' }}>
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
          📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        {metrics && (
          <p style={{ margin: '12px 0 0 0', fontSize: '0.95rem' }}>
            💡 {metrics.todayOrders} order{metrics.todayOrders !== 1 ? 's' : ''} today
          </p>
        )}
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>📆 Date Range Filter</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <button onClick={handleApplyFilter} className="button">
            Apply Filter
          </button>
        </div>
      </div>

      {metrics && (
        <>
          <div className="grid-3" style={{ marginBottom: '32px' }}>
            <div className="metric-card">
              <div className="metric-value">{metrics.totalProducts}</div>
              <div className="metric-label">💍 Total Products</div>
            </div>

            <div className="metric-card">
              <div className="metric-value">{metrics.totalCustomers}</div>
              <div className="metric-label">👥 Total Customers</div>
            </div>

            <div className="metric-card">
              <div className="metric-value">{metrics.totalOrders}</div>
              <div className="metric-label">🛒 Total Orders</div>
            </div>

            <div className="metric-card">
              <div style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', fontWeight: '600', color: 'var(--color-gold)', marginBottom: '8px' }}>
                {metrics.lastOrderDate ? new Date(metrics.lastOrderDate).toLocaleDateString('en-IN') : 'N/A'}
              </div>
              <div className="metric-label">📅 Last Order Date</div>
              {metrics.lastOrderInvoice && (
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', fontFamily: 'monospace' }}>
                  {metrics.lastOrderInvoice}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0 }}>💳 Payment Status Breakdown</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Payment Status</th>
                  <th style={{ textAlign: 'right', padding: '10px' }}>Orders</th>
                  <th style={{ textAlign: 'right', padding: '10px' }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {metrics.paymentStatusBreakdown.map((item) => (
                  <tr key={item.status} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{item.status}</td>
                    <td style={{ textAlign: 'right', padding: '10px' }}>{item.count}</td>
                    <td style={{ textAlign: 'right', padding: '10px' }}>₹{item.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>🔗 Quick Navigation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <Link href="/customers" className="button" style={{ textDecoration: 'none', textAlign: 'center' }}>
                👥 Customers
              </Link>
              <Link href="/products" className="button" style={{ textDecoration: 'none', textAlign: 'center' }}>
                💍 Products
              </Link>
              <Link href="/sales-orders" className="button" style={{ textDecoration: 'none', textAlign: 'center' }}>
                🛒 Sales Orders
              </Link>
              <Link href="/stock" className="button" style={{ textDecoration: 'none', textAlign: 'center' }}>
                📦 Stock
              </Link>
              <Link href="/suppliers" className="button" style={{ textDecoration: 'none', textAlign: 'center' }}>
                🏭 Suppliers
              </Link>
              <Link href="/reports" className="button" style={{ textDecoration: 'none', textAlign: 'center' }}>
                📊 Reports
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
