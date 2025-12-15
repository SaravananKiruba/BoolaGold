'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Shop {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  subscriptionStatus: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  trialEndDate: string | null;
  amcStatus: string;
  amcEndDate: string | null;
  isPaused: boolean;
  pausedAt: string | null;
  currentUserCount: number;
  maxUsers: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  _count: {
    users: number;
    customers: number;
    salesOrders: number;
  };
}

export default function SuperAdminSubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [action, setAction] = useState('');
  const [actionData, setActionData] = useState({ reason: '', extendDays: 30 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShops();
  }, [filter]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const url = filter === 'ALL'
        ? '/api/super-admin/subscriptions'
        : `/api/super-admin/subscriptions?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setShops(data.data.shops);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedShop || !action) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/super-admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: selectedShop.id,
          action,
          reason: actionData.reason,
          extendDays: action === 'EXTEND' ? actionData.extendDays : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.data.message}`);
        setShowActionModal(false);
        setSelectedShop(null);
        setAction('');
        fetchShops();
      } else {
        alert('❌ ' + (data.error || 'Failed to perform action'));
      }
    } catch (error) {
      alert('❌ Error performing action');
    } finally {
      setSubmitting(false);
    }
  };

  const openActionModal = (shop: Shop, actionType: string) => {
    setSelectedShop(shop);
    setAction(actionType);
    setShowActionModal(true);
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      TRIAL: '#3b82f6',
      ACTIVE: '#10b981',
      EXPIRED: '#ef4444',
      PAUSED: '#f97316',
      CANCELLED: '#6b7280',
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
          <h1 className="page-title">📊 Subscription Management</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Manage shop subscriptions and lifecycle
          </p>
        </div>
        <button className="button" onClick={() => router.push('/super-admin')}>
          ← Back
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {['TRIAL', 'ACTIVE', 'EXPIRED', 'PAUSED'].map(status => {
          const count = shops.filter(s => s.subscriptionStatus === status).length;
          const colors: { [key: string]: string } = {
            TRIAL: '#3b82f6',
            ACTIVE: '#10b981',
            EXPIRED: '#ef4444',
            PAUSED: '#f97316',
          };

          return (
            <div key={status} style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${colors[status]}`,
            }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>
                {status} Shops
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: colors[status] }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '8px',
        flexWrap: 'wrap',
      }}>
        {['ALL', 'TRIAL', 'ACTIVE', 'EXPIRED', 'PAUSED'].map(status => (
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

      {/* Shops Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : shops.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
            No shops found
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Status</th>
                  <th>Subscription</th>
                  <th>AMC</th>
                  <th>Users</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => {
                  const endDate = shop.subscriptionEndDate || shop.trialEndDate;
                  const daysRemaining = getDaysRemaining(endDate);

                  return (
                    <tr key={shop.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{shop.name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{shop.city}</div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            📞 {shop.phone}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          {getStatusBadge(shop.subscriptionStatus)}
                          {shop.isPaused && (
                            <div style={{
                              marginTop: '4px',
                              fontSize: '0.8rem',
                              color: '#f97316',
                              fontWeight: 600,
                            }}>
                              ⏸️ Paused
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {endDate ? (
                          <div>
                            <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                              {new Date(endDate).toLocaleDateString()}
                            </div>
                            {daysRemaining !== null && (
                              <div style={{
                                fontSize: '0.85rem',
                                color: daysRemaining < 7 ? '#ef4444' : daysRemaining < 30 ? '#f97316' : '#10b981',
                                fontWeight: 600,
                              }}>
                                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{getStatusBadge(shop.amcStatus)}</td>
                      <td>
                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                          {shop.currentUserCount} / {shop.maxUsers}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {shop._count.users} active
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div>{shop._count.customers} customers</div>
                          <div>{shop._count.salesOrders} orders</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {!shop.isPaused && (
                            <>
                              <button
                                className="button"
                                style={{
                                  background: '#f97316',
                                  color: 'white',
                                  padding: '4px 10px',
                                  fontSize: '0.85rem',
                                }}
                                onClick={() => openActionModal(shop, 'PAUSE')}
                              >
                                ⏸️ Pause
                              </button>
                              <button
                                className="button"
                                style={{
                                  background: '#3b82f6',
                                  color: 'white',
                                  padding: '4px 10px',
                                  fontSize: '0.85rem',
                                }}
                                onClick={() => openActionModal(shop, 'EXTEND')}
                              >
                                📅 Extend
                              </button>
                            </>
                          )}
                          {shop.isPaused && (
                            <button
                              className="button"
                              style={{
                                background: '#10b981',
                                color: 'white',
                                padding: '4px 10px',
                                fontSize: '0.85rem',
                              }}
                              onClick={() => openActionModal(shop, 'RESUME')}
                            >
                              ▶️ Resume
                            </button>
                          )}
                          <button
                            className="button"
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              padding: '4px 10px',
                              fontSize: '0.85rem',
                            }}
                            onClick={() => openActionModal(shop, 'CANCEL')}
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedShop && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎯 {action} Subscription</h2>
              <button className="close-button" onClick={() => setShowActionModal(false)}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong>Shop:</strong> {selectedShop.name}
            </div>

            {action === 'EXTEND' && (
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Extend By (Days) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={actionData.extendDays}
                  onChange={(e) => setActionData({ ...actionData, extendDays: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
            )}

            {(action === 'PAUSE' || action === 'CANCEL') && (
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Reason *</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={actionData.reason}
                  onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                  placeholder="Enter reason..."
                  required
                />
              </div>
            )}

            <div style={{
              background: action === 'CANCEL' ? '#fee2e2' : '#e0e7ff',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <p style={{
                fontSize: '0.9rem',
                color: action === 'CANCEL' ? '#991b1b' : '#3730a3',
                margin: 0,
              }}>
                {action === 'PAUSE' && '⏸️ Shop will be paused. Users cannot login until resumed.'}
                {action === 'RESUME' && '▶️ Shop will be resumed. Users can login again.'}
                {action === 'EXTEND' && '📅 Subscription will be extended by specified days.'}
                {action === 'CANCEL' && '⚠️ WARNING: This will permanently cancel the subscription!'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="button"
                onClick={() => setShowActionModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={handleAction}
                disabled={submitting || (action === 'PAUSE' && !actionData.reason)}
                style={{
                  background: action === 'CANCEL' ? '#ef4444' : undefined,
                }}
              >
                {submitting ? 'Processing...' : `Confirm ${action}`}
              </button>
            </div>
          </div>
        </div>
      )}

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
          font-size: #0.9rem;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .data-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
        }
        
        .data-table tr:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}
