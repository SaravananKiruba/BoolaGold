'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ShopData {
  name: string;
  subscriptionStatus: string;
  subscriptionEndDate: string | null;
  trialEndDate: string | null;
  amcStatus: string;
  amcEndDate: string | null;
  currentUserCount: number;
  maxUsers: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  nextPaymentDue: string | null;
}

interface Payment {
  id: string;
  amount: number;
  paymentType: string;
  status: string;
  transactionId: string | null;
  paidAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export default function SubscriptionPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    paymentType: 'SUBSCRIPTION',
    amount: 40000,
    transactionId: '',
    upiId: '',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const session = await fetch('/api/auth/session').then(r => r.json());
      if (!session.user?.shopId) {
        router.push('/dashboard');
        return;
      }

      const response = await fetch(`/api/shops/${session.user.shopId}/payments`);
      const data = await response.json();

      if (data.success) {
        setShopData(data.data.shop);
        setPayments(data.data.payments);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentTypeChange = (type: string) => {
    const amounts: { [key: string]: number } = {
      TRIAL: 500,
      SUBSCRIPTION: 40000,
      AMC_RENEWAL: 10000,
      REACTIVATION: 40000,
    };

    setFormData({
      ...formData,
      paymentType: type,
      amount: amounts[type],
    });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const session = await fetch('/api/auth/session').then(r => r.json());
      
      const response = await fetch(`/api/shops/${session.user.shopId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Payment submitted successfully! Awaiting Super Admin verification.');
        setShowPaymentForm(false);
        setFormData({
          paymentType: 'SUBSCRIPTION',
          amount: 40000,
          transactionId: '',
          upiId: '',
          remarks: '',
        });
        fetchData();
      } else {
        alert('❌ ' + (data.error || 'Failed to submit payment'));
      }
    } catch (error) {
      alert('❌ Error submitting payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      TRIAL: '#fbbf24',
      ACTIVE: '#10b981',
      EXPIRED: '#ef4444',
      PAUSED: '#f97316',
      PENDING: '#3b82f6',
      PAID: '#10b981',
      FAILED: '#ef4444',
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

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 Subscription & Payments</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Manage your subscription, payments, and billing
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={() => setShowPaymentForm(true)}
        >
          💰 Make Payment
        </button>
      </div>

      {/* Subscription Status Card */}
      {shopData && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', fontWeight: 600 }}>
            📊 Current Subscription Status
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>Status</p>
              <div>{getStatusBadge(shopData.subscriptionStatus)}</div>
            </div>

            {shopData.subscriptionEndDate && (
              <div>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>Subscription Ends</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {new Date(shopData.subscriptionEndDate).toLocaleDateString()}
                </p>
                <p style={{ color: getDaysRemaining(shopData.subscriptionEndDate)! < 30 ? '#ef4444' : '#10b981', fontSize: '0.85rem' }}>
                  {getDaysRemaining(shopData.subscriptionEndDate)} days remaining
                </p>
              </div>
            )}

            {shopData.trialEndDate && shopData.subscriptionStatus === 'TRIAL' && (
              <div>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>Trial Ends</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {new Date(shopData.trialEndDate).toLocaleDateString()}
                </p>
                <p style={{ color: '#fbbf24', fontSize: '0.85rem' }}>
                  {getDaysRemaining(shopData.trialEndDate)} days remaining
                </p>
              </div>
            )}

            <div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>AMC Status</p>
              <div>{getStatusBadge(shopData.amcStatus)}</div>
            </div>

            <div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>User Limit</p>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {shopData.currentUserCount} / {shopData.maxUsers}
              </p>
            </div>
          </div>

          {/* Pricing Info */}
          <div style={{
            marginTop: '24px',
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '8px',
            borderLeft: '4px solid #667eea',
          }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', fontWeight: 600 }}>
              💰 Pricing Information
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '6px 0' }}>• Trial Period: ₹500 for 7 days</li>
              <li style={{ padding: '6px 0' }}>• Annual Subscription: ₹40,000/year</li>
              <li style={{ padding: '6px 0' }}>• AMC Renewal: ₹10,000/year</li>
              <li style={{ padding: '6px 0' }}>• Maximum 10 users per shop</li>
            </ul>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', fontWeight: 600 }}>
          📜 Payment History
        </h2>

        {payments.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
            No payments yet
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                  <th>Verified At</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td>{payment.paymentType.replace('_', ' ')}</td>
                    <td style={{ fontWeight: 600 }}>₹{payment.amount.toLocaleString()}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {payment.transactionId || '-'}
                    </td>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td>
                      {payment.verifiedAt
                        ? new Date(payment.verifiedAt).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="modal-overlay" onClick={() => setShowPaymentForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Submit Payment</h2>
              <button
                className="close-button"
                onClick={() => setShowPaymentForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayment}>
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Payment Type *</label>
                <select
                  className="form-input"
                  value={formData.paymentType}
                  onChange={(e) => handlePaymentTypeChange(e.target.value)}
                  required
                >
                  <option value="TRIAL">Trial - ₹500</option>
                  <option value="SUBSCRIPTION">Annual Subscription - ₹40,000</option>
                  <option value="AMC_RENEWAL">AMC Renewal - ₹10,000</option>
                  <option value="REACTIVATION">Reactivation - ₹40,000</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Amount *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.amount}
                  disabled
                  style={{ background: '#f1f5f9' }}
                />
              </div>

              <div style={{
                background: '#e0e7ff',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                <p style={{ fontSize: '0.95rem', color: '#3730a3', marginBottom: '8px', fontWeight: 600 }}>
                  📱 UPI Payment Instructions:
                </p>
                <ol style={{ fontSize: '0.9rem', color: '#4338ca', margin: 0, paddingLeft: '20px' }}>
                  <li>Open any UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                  <li>Make payment to Super Admin UPI ID</li>
                  <li>Copy the UPI Transaction ID from your app</li>
                  <li>Paste it below and submit for verification</li>
                </ol>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">UPI Transaction ID *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 123456789012"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Your UPI ID (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., yourname@upi"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Remarks (Optional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Any additional notes..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="button"
                  onClick={() => setShowPaymentForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
