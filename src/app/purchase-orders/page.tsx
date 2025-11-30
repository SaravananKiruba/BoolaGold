'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: {
    id: string;
    name: string;
  };
  orderDate: string;
  expectedDeliveryDate?: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  paidAmount: number;
  items: any[];
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
  });

  useEffect(() => {
    fetchPurchaseOrders();
  }, [filters]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);

      const response = await fetch(`/api/purchase-orders?${params}`);
      const result = await response.json();

      if (result.success && result.data) {
        setPurchaseOrders(result.data.data || []);
      } else {
        setError(result.error?.message || 'Failed to fetch purchase orders');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Purchase Orders</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Manage supplier orders and inventory receipts</p>
        </div>
        <Link href="/" style={{ textDecoration: 'none', padding: '10px 20px', background: '#666', color: 'white', borderRadius: '4px' }}>
          ← Back to Home
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Filters</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 500 }}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '150px' }}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PARTIAL">Partial</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 500 }}>Payment Status</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '150px' }}
            >
              <option value="">All Payment Status</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Purchase Orders ({purchaseOrders.length})</h2>
          <button className="button">+ Create Order</button>
        </div>

        {loading && <p>Loading purchase orders...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!loading && !error && purchaseOrders.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
            No purchase orders found. Create your first purchase order to get started.
          </p>
        )}

        {!loading && !error && purchaseOrders.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '13px' }}>
                    {order.orderNumber}
                  </td>
                  <td>{order.supplier.name}</td>
                  <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      background: order.status === 'DELIVERED' ? '#d5f4e6' : 
                                  order.status === 'PARTIAL' ? '#fff4e6' : 
                                  order.status === 'CANCELLED' ? '#ffcdd2' : '#e3f2fd',
                      color: order.status === 'DELIVERED' ? '#00b894' : 
                             order.status === 'PARTIAL' ? '#e67e22' : 
                             order.status === 'CANCELLED' ? '#d32f2f' : '#0070f3',
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      background: order.paymentStatus === 'PAID' ? '#d5f4e6' : 
                                  order.paymentStatus === 'PARTIAL' ? '#fff4e6' : '#ffcdd2',
                      color: order.paymentStatus === 'PAID' ? '#00b894' : 
                             order.paymentStatus === 'PARTIAL' ? '#e67e22' : '#d32f2f',
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    ₹{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    {order.paidAmount > 0 && (
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        Paid: ₹{Number(order.paidAmount).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td>
                    <button style={{ 
                      padding: '4px 12px', 
                      background: 'transparent', 
                      border: '1px solid #0070f3', 
                      color: '#0070f3', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
