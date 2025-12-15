'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Payment {
  id: string;
  shopId: string;
  amount: number;
  paymentType: string;
  transactionId: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
  shop: {
    name: string;
    email: string;
    phone: string;
    city: string;
  };
}

interface Subscription {
  id: string;
  name: string;
  subscriptionStatus: string;
  subscriptionEndDate: string | null;
  trialEndDate: string | null;
  currentUserCount: number;
  maxUsers: number;
}

export default function SuperAdminPaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState('PENDING');
  const [expiringShops, setExpiringShops] = useState<Subscription[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch payments
      const paymentsRes = await fetch(`/api/super-admin/payments?status=${filter}`);
      const paymentsData = await paymentsRes.json();
      
      // Fetch expiring subscriptions (next 30 days)
      const subsRes = await fetch('/api/super-admin/subscriptions?expiring=30');
      const subsData = await subsRes.json();

      if (paymentsData.success) {
        setPayments(paymentsData.data.payments);
      }

      if (subsData.success) {
        setExpiringShops(subsData.data.shops);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string, action: 'APPROVE' | 'REJECT') => {
    const remarks = action === 'REJECT' 
      ? prompt('Enter rejection reason:')
      : 'Payment verified and approved';

    if (action === 'REJECT' && !remarks) return;

    setVerifying(paymentId);

    try {
      const response = await fetch('/api/super-admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          action,
          remarks,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Payment ${action.toLowerCase()}d successfully!`);
        fetchData();
      } else {
        alert('❌ ' + (data.error || 'Failed to verify payment'));
      }
    } catch (error) {
      alert('❌ Error verifying payment');
    } finally {
      setVerifying(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: '#fbbf24',
      PAID: '#10b981',
      FAILED: '#ef4444',
      TRIAL: '#3b82f6',
      ACTIVE: '#10b981',
      EXPIRED: '#ef4444',
    };

    return (
      <span style={{
        background: colors[status] || '#6b7280',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 600,
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 Payment Management</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Verify and manage shop payments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="button"
            onClick={() => router.push('/super-admin')}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Expiring Subscriptions Alert */}
      {expiringShops.length > 0 && (
        <div style={{
          background: '#fef3c7',
          border: '2px solid #fbbf24',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#92400e', marginBottom: '12px' }}>
            ⚠️ {expiringShops.length} Subscriptions Expiring in 30 Days
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
            {expiringShops.slice(0, 6).map(shop => (
              <div key={shop.id} style={{
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{shop.name}</div>
                <div style={{ color: '#78350f', fontSize: '0.85rem' }}>
                  Expires: {shop.subscriptionEndDate 
                    ? new Date(shop.subscriptionEndDate).toLocaleDateString()
                    : new Date(shop.trialEndDate!).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          {expiringShops.length > 6 && (
            <button
              className="button"
              style={{ marginTop: '12px' }}
              onClick={() => router.push('/super-admin/subscriptions')}
            >
              View All {expiringShops.length}
            </button>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '8px',
      }}>
        {['PENDING', 'PAID', 'FAILED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '8px 16px',
              background: filter === status ? '#667eea' : 'transparent',
              color: filter === status ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', fontWeight: 600 }}>
          {filter} Payments
        </h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : payments.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
            No {filter.toLowerCase()} payments
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  {filter === 'PENDING' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{payment.shop.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {payment.shop.city}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          📞 {payment.shop.phone}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        background: '#e0e7ff',
                        color: '#3730a3',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}>
                        {payment.paymentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td style={{
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      background: '#f8fafc',
                      padding: '8px',
                    }}>
                      {payment.transactionId || '-'}
                    </td>
                    <td>{new Date(payment.createdAt).toLocaleString()}</td>
                    <td>{getStatusBadge(payment.status)}</td>
                    {filter === 'PENDING' && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="button"
                            style={{
                              background: '#10b981',
                              color: 'white',
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                            }}
                            onClick={() => handleVerifyPayment(payment.id, 'APPROVE')}
                            disabled={verifying === payment.id}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="button"
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                            }}
                            onClick={() => handleVerifyPayment(payment.id, 'REJECT')}
                            disabled={verifying === payment.id}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .data-table th {
          text-align: left;
          padding: 12px;
          background: #f8fafc;
          font-weight: 600;
          color: #475569;
          font-size: 0.9rem;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .data-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .data-table tr:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}
