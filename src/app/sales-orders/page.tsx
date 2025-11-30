'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SalesOrder {
  id: string;
  invoiceNumber: string;
  orderDate: string;
  customer: {
    name: string;
    phone: string;
  };
  orderTotal: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  status: string;
  paymentStatus: string;
  _count?: {
    lines: number;
  };
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales-orders');
      const result = await response.json();

      if (result.success) {
        setOrders(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch sales orders');
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
          <h1 style={{ margin: 0 }}>Sales Order Management</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Create and track sales invoices</p>
        </div>
        <Link href="/" style={{ textDecoration: 'none', padding: '10px 20px', background: '#666', color: 'white', borderRadius: '4px' }}>
          ← Back to Home
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Sales Orders ({orders.length})</h2>
          <button className="button">+ Create Order</button>
        </div>

        {loading && <p>Loading sales orders...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!loading && !error && orders.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
            No sales orders found. Create your first order to get started.
          </p>
        )}

        {!loading && !error && orders.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '13px' }}>
                    {order.invoiceNumber}
                  </td>
                  <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td>
                    <div>{order.customer.name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{order.customer.phone}</div>
                  </td>
                  <td>{order._count?.lines || 0}</td>
                  <td style={{ fontWeight: 500 }}>
                    ₹{Number(order.finalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    {order.discountAmount > 0 && (
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        Disc: ₹{Number(order.discountAmount).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '12px' }}>{order.paymentMethod}</div>
                    <span style={{ 
                      padding: '2px 6px', 
                      background: order.paymentStatus === 'PAID' ? '#d5f4e6' : '#fff4e6',
                      color: order.paymentStatus === 'PAID' ? '#00b894' : '#e67e22',
                      borderRadius: '4px', 
                      fontSize: '11px',
                      marginTop: '2px',
                      display: 'inline-block'
                    }}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      background: order.status === 'COMPLETED' ? '#d5f4e6' : '#ffcdd2',
                      color: order.status === 'COMPLETED' ? '#00b894' : '#d32f2f',
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {order.status}
                    </span>
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
