'use client';

import { useState, useEffect } from 'react';
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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  useEffect(() => {
    fetchMetrics();
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
    return <div className="container" style={{ padding: '40px 20px' }}>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="card" style={{ background: '#fee' }}>
          <p style={{ color: '#c00' }}>Error: {error}</p>
          <button onClick={fetchMetrics} className="button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>📊 Business Dashboard</h1>
        <div>
          <Link href="/" className="button" style={{ marginRight: '10px', textDecoration: 'none' }}>
            ← Home
          </Link>
          <button onClick={fetchMetrics} className="button" style={{ marginRight: '10px' }}>
            🔄 Refresh
          </button>
          <button onClick={handleExport} className="button">
            📥 Export
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px', background: '#f0f8ff' }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>
          📅 <strong>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
        </p>
        {metrics && (
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
            💡 {metrics.insights}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div className="card" style={{ background: '#e3f2fd', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2' }}>{metrics.totalProducts}</div>
              <div style={{ color: '#555', marginTop: '5px' }}>Total Products</div>
            </div>

            <div className="card" style={{ background: '#f3e5f5', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7b1fa2' }}>{metrics.totalCustomers}</div>
              <div style={{ color: '#555', marginTop: '5px' }}>Total Customers</div>
            </div>

            <div className="card" style={{ background: '#fff3e0', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e65100' }}>{metrics.totalOrders}</div>
              <div style={{ color: '#555', marginTop: '5px' }}>Total Orders</div>
            </div>

            <div className="card" style={{ background: '#e8f5e9', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2e7d32' }}>₹{metrics.totalRevenue.toLocaleString('en-IN')}</div>
              <div style={{ color: '#555', marginTop: '5px' }}>Total Revenue</div>
            </div>

            <div className="card" style={{ background: '#fce4ec', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#c2185b' }}>₹{metrics.averageOrderValue.toLocaleString('en-IN')}</div>
              <div style={{ color: '#555', marginTop: '5px' }}>Avg Order Value</div>
            </div>

            <div className="card" style={{ background: '#fff9c4', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57f17' }}>
                {metrics.lastOrderDate ? new Date(metrics.lastOrderDate).toLocaleDateString('en-IN') : 'N/A'}
              </div>
              <div style={{ color: '#555', marginTop: '5px' }}>Last Order Date</div>
              {metrics.lastOrderInvoice && (
                <div style={{ fontSize: '12px', color: '#777', marginTop: '3px' }}>
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
