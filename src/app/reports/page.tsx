'use client';

import { useState } from 'react';
import Link from 'next/link';

type ReportType = 'sales' | 'inventory' | 'customers' | 'sales-summary' | 'financial' | null;

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Additional filters for specific reports
  const [valuationBasis, setValuationBasis] = useState('PURCHASE');
  const [metalType, setMetalType] = useState('');
  const [customerType, setCustomerType] = useState('');

  const fetchReport = async () => {
    if (!selectedReport) return;

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      // Add specific filters based on report type
      if (selectedReport === 'inventory') {
        params.append('valuationBasis', valuationBasis);
        if (metalType) params.append('metalType', metalType);
      }
      if (selectedReport === 'customers' && customerType) {
        params.append('customerType', customerType);
      }

      const response = await fetch(`/api/reports/${selectedReport}?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReportData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!reportData) return;

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    if (selectedReport === 'sales-summary') {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('format', 'csv');

      window.open(`/api/reports/sales-summary?${params.toString()}`, '_blank');
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'sales':
        return (
          <div>
            <div className="card" style={{ marginBottom: '20px', background: '#e8f5e9' }}>
              <h3 style={{ marginTop: 0 }}>📊 Sales Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Orders</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{reportData?.summary?.totalOrders || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Sales</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{(reportData?.summary?.totalSalesAmount || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Avg Order Value</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{(reportData?.summary?.averageOrderValue || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Discount</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{(reportData?.summary?.totalDiscountAmount || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>💳 Payment Method Breakdown</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Payment Method</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Count</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.paymentMethodBreakdown || []).map((item: any) => (
                    <tr key={item.paymentMethod} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{item.paymentMethod}</td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>{item.count}</td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>₹{item.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>🏆 Top Selling Products</h3>
              <h4>By Quantity</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Product</th>
                    <th style={{ textAlign: 'center', padding: '10px' }}>Quantity Sold</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.topSellingProducts?.byQuantity || []).slice(0, 5).map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{item.productName}</td>
                      <td style={{ textAlign: 'center', padding: '10px' }}>{item.quantitySold}</td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>₹{item.totalSalesAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div>
            <div className="card" style={{ marginBottom: '20px', background: '#e3f2fd' }}>
              <h3 style={{ marginTop: 0 }}>📦 Inventory Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Products</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{reportData?.summary?.totalProducts || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Stock Quantity</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{reportData?.summary?.totalStockQuantity || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Inventory Value</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{(reportData?.summary?.totalInventoryValue || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {(reportData?.lowStockItems || []).length > 0 && (
              <div className="card" style={{ marginBottom: '20px', background: '#fff3e0' }}>
                <h3 style={{ marginTop: 0 }}>⚠️ Low Stock Alert</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Product</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>Current Stock</th>
                      <th style={{ textAlign: 'center', padding: '10px' }}>Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData?.lowStockItems || []).map((item: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{item.name}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>{item.stockQuantity}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>{item.reorderLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="card">
              <h3 style={{ marginTop: 0 }}>🏅 Metal-wise Breakdown</h3>
              {(reportData?.metalBreakdown || []).map((metal: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '5px' }}>
                  <h4 style={{ marginTop: 0 }}>{metal.metalType}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Count</div>
                      <div style={{ fontWeight: 'bold' }}>{metal.count}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Total Weight</div>
                      <div style={{ fontWeight: 'bold' }}>{metal.totalWeight}g</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Value</div>
                      <div style={{ fontWeight: 'bold' }}>₹{metal.totalValue.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'customers':
        return (
          <div>
            <div className="card" style={{ marginBottom: '20px', background: '#f3e5f5' }}>
              <h3 style={{ marginTop: 0 }}>👥 Customer Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Customers</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{reportData?.summary?.totalCustomers || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Purchases</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{(reportData?.summary?.totalPurchasesAmount || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>New Customers</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{reportData?.summary?.newCustomersCount || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Retention Rate</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{reportData?.summary?.retentionRate || 0}%</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>🏆 Top Customers</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Phone</th>
                    <th style={{ textAlign: 'center', padding: '10px' }}>Orders</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Total Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.topCustomers || []).map((customer: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{customer.customerName}</td>
                      <td style={{ padding: '10px' }}>{customer.customerPhone}</td>
                      <td style={{ textAlign: 'center', padding: '10px' }}>{customer.orderCount}</td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>₹{customer.totalPurchaseValue.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'sales-summary':
        return (
          <div>
            <div className="card" style={{ marginBottom: '20px', background: '#fff9c4' }}>
              <h3 style={{ marginTop: 0 }}>📋 Sales Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Invoices</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{reportData?.summary?.totalInvoices || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Sales Amount</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{(reportData?.summary?.totalSalesAmount || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>📊 Category Breakdown</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Category</th>
                    <th style={{ textAlign: 'center', padding: '10px' }}>Invoice Count</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.categoryTotals || []).map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{item.category}</td>
                      <td style={{ textAlign: 'center', padding: '10px' }}>{item.invoiceCount}</td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>₹{item.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div>
            <div className="card" style={{ marginBottom: '20px', background: '#e8f5e9' }}>
              <h3 style={{ marginTop: 0 }}>💰 Profit & Loss Statement</h3>
              <div style={{ padding: '15px', background: '#fff', borderRadius: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Total Income:</span>
                  <strong>₹{(reportData?.profitAndLoss?.totalIncome || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Direct Costs (Metal Purchases):</span>
                  <strong style={{ color: '#d32f2f' }}>₹{(reportData?.profitAndLoss?.directCosts?.metalPurchases || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                  <span><strong>Gross Profit:</strong></span>
                  <strong style={{ color: '#2e7d32' }}>₹{(reportData?.profitAndLoss?.grossProfit || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Operational Expenses:</span>
                  <strong style={{ color: '#d32f2f' }}>₹{(reportData?.profitAndLoss?.operationalExpenses || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid #333' }}>
                  <span><strong>Net Profit:</strong></span>
                  <strong style={{ fontSize: '20px', color: (reportData?.profitAndLoss?.netProfit || 0) >= 0 ? '#2e7d32' : '#d32f2f' }}>
                    ₹{(reportData?.profitAndLoss?.netProfit || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div style={{ textAlign: 'right', marginTop: '5px', fontSize: '14px', color: '#666' }}>
                  Profit Margin: {reportData?.profitAndLoss?.profitMargin || 0}%
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>💵 Cash Flow</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '5px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>Inflow</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>₹{(reportData?.cashFlow?.inflow || 0).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ padding: '15px', background: '#ffebee', borderRadius: '5px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>Outflow</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>₹{(reportData?.cashFlow?.outflow || 0).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ padding: '15px', background: (reportData?.cashFlow?.netCashFlow || 0) >= 0 ? '#e8f5e9' : '#ffebee', borderRadius: '5px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>Net Cash Flow</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: (reportData?.cashFlow?.netCashFlow || 0) >= 0 ? '#2e7d32' : '#d32f2f' }}>
                    ₹{(reportData?.cashFlow?.netCashFlow || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>📊 EMI Tracking</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '5px' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Outstanding</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{(reportData?.emiTracking?.totalOutstanding || 0).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '5px' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>Received in Period</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{(reportData?.emiTracking?.receivedInPeriod || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>📊 Reports & Analytics</h1>
        <Link href="/" className="button" style={{ textDecoration: 'none' }}>
          ← Home
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Select Report Type</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <button
            onClick={() => setSelectedReport('sales')}
            className="button"
            style={{ background: selectedReport === 'sales' ? '#1976d2' : '#f5f5f5', color: selectedReport === 'sales' ? '#fff' : '#333' }}
          >
            📈 Sales Report
          </button>
          <button
            onClick={() => setSelectedReport('inventory')}
            className="button"
            style={{ background: selectedReport === 'inventory' ? '#1976d2' : '#f5f5f5', color: selectedReport === 'inventory' ? '#fff' : '#333' }}
          >
            📦 Inventory Report
          </button>
          <button
            onClick={() => setSelectedReport('customers')}
            className="button"
            style={{ background: selectedReport === 'customers' ? '#1976d2' : '#f5f5f5', color: selectedReport === 'customers' ? '#fff' : '#333' }}
          >
            👥 Customer Report
          </button>
          <button
            onClick={() => setSelectedReport('sales-summary')}
            className="button"
            style={{ background: selectedReport === 'sales-summary' ? '#1976d2' : '#f5f5f5', color: selectedReport === 'sales-summary' ? '#fff' : '#333' }}
          >
            📋 Sales Summary
          </button>
          <button
            onClick={() => setSelectedReport('financial')}
            className="button"
            style={{ background: selectedReport === 'financial' ? '#1976d2' : '#f5f5f5', color: selectedReport === 'financial' ? '#fff' : '#333' }}
          >
            💰 Financial Report
          </button>
        </div>
      </div>

      {selectedReport && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Filter Options</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
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

            {selectedReport === 'inventory' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Valuation Basis</label>
                  <select
                    value={valuationBasis}
                    onChange={(e) => setValuationBasis(e.target.value)}
                    className="input"
                  >
                    <option value="PURCHASE">Purchase Cost</option>
                    <option value="SELLING">Selling Price</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Metal Type</label>
                  <select
                    value={metalType}
                    onChange={(e) => setMetalType(e.target.value)}
                    className="input"
                  >
                    <option value="">All</option>
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>
              </>
            )}

            {selectedReport === 'customers' && (
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Customer Type</label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="input"
                >
                  <option value="">All</option>
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchReport} className="button" disabled={loading}>
              {loading ? 'Loading...' : '🔍 Generate Report'}
            </button>
            {reportData && (
              <>
                <button onClick={handleExportJSON} className="button">
                  📥 Export JSON
                </button>
                {selectedReport === 'sales-summary' && (
                  <button onClick={handleExportCSV} className="button">
                    📊 Export CSV
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{ background: '#fee', marginBottom: '20px' }}>
          <p style={{ color: '#c00', margin: 0 }}>Error: {error}</p>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>Generating report...</p>
        </div>
      )}

      {reportData && !loading && renderReportContent()}
    </div>
  );
}
