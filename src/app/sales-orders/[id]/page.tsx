'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast, confirmAction } from '@/utils/toast';
import { useParams, useRouter } from 'next/navigation';
import RecordSalesPaymentModal from './RecordSalesPaymentModal';

interface SalesOrder {
  id: string;
  invoiceNumber: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    customerType: string;
  };
  orderDate: string;
  orderTotal: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  notes?: string;
  lines: SalesOrderLine[];
  payments?: Payment[];
}

interface SalesOrderLine {
  id: string;
  stockItem: {
    id: string;
    tagId: string;
    barcode: string;
    product: {
      id: string;
      name: string;
      metalType: string;
      purity: string;
      netWeight: number;
      grossWeight: number;
      stoneWeight: number;
    };
  };
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSalesOrder();
    }
  }, [params.id]);

  const fetchSalesOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/sales-orders/${params.id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setSalesOrder(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch sales order');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    window.open(`/api/sales-orders/${params.id}/invoice?format=html`, '_blank');
  };

  const handleCancelOrder = async () => {
    const confirmed = await confirmAction(
      'Are you sure you want to cancel this order? Stock items will be released back to AVAILABLE.',
      'Cancel Order'
    );
    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/sales-orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Order cancelled successfully');
        fetchOrder();
      } else {
        toast.error('Error: ' + (result.error?.message || 'Failed to cancel order'));
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading sales order...</p>
        </div>
      </div>
    );
  }

  if (error || !salesOrder) {
    return (
      <div className="container">
        <div className="card">
          <p style={{ color: 'red' }}>Error: {error || 'Sales order not found'}</p>
          <Link href="/sales-orders" style={{ textDecoration: 'none', color: '#0070f3' }}>
            ← Back to Sales Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
            Invoice: {salesOrder.invoiceNumber}
          </h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            Order Date: {new Date(salesOrder.orderDate).toLocaleDateString()}
          </p>
        </div>
        <Link 
          href="/sales-orders" 
          style={{ 
            textDecoration: 'none', 
            padding: '10px 20px', 
            background: '#666', 
            color: 'white', 
            borderRadius: '4px' 
          }}
        >
          ← Back
        </Link>
      </div>

      {/* Status and Actions */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Order Status</span>
              <span style={{ 
                padding: '6px 12px', 
                background: salesOrder.status === 'COMPLETED' ? '#d5f4e6' : 
                            salesOrder.status === 'PENDING' ? '#fff4e6' : 
                            salesOrder.status === 'CANCELLED' ? '#ffcdd2' : '#e3f2fd',
                color: salesOrder.status === 'COMPLETED' ? '#00b894' : 
                       salesOrder.status === 'PENDING' ? '#e67e22' : 
                       salesOrder.status === 'CANCELLED' ? '#d32f2f' : '#0070f3',
                borderRadius: '4px', 
                fontSize: '14px',
                fontWeight: 500
              }}>
                {salesOrder.status}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Payment Status</span>
              <span style={{ 
                padding: '6px 12px', 
                background: salesOrder.paymentStatus === 'PAID' ? '#d5f4e6' : 
                            salesOrder.paymentStatus === 'PARTIAL' ? '#fff4e6' : '#ffcdd2',
                color: salesOrder.paymentStatus === 'PAID' ? '#00b894' : 
                       salesOrder.paymentStatus === 'PARTIAL' ? '#e67e22' : '#d32f2f',
                borderRadius: '4px', 
                fontSize: '14px',
                fontWeight: 500
              }}>
                {salesOrder.paymentStatus}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Order Type</span>
              <span style={{ 
                padding: '6px 12px', 
                background: '#e3f2fd',
                color: '#0070f3',
                borderRadius: '4px', 
                fontSize: '14px',
                fontWeight: 500
              }}>
                {salesOrder.orderType}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {salesOrder.paymentStatus !== 'PAID' && salesOrder.status !== 'CANCELLED' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={actionLoading}
                style={{
                  padding: '10px 20px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
              >
                💳 Record Payment
              </button>
            )}
            <button
              onClick={handlePrintInvoice}
              style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              🖨️ Print Invoice
            </button>
            {salesOrder.status !== 'CANCELLED' && (
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading}
                style={{
                  padding: '10px 20px',
                  background: actionLoading ? '#ccc' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
              >
                ❌ Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Customer Information */}
        <div className="card">
          <h3 style={{ marginTop: 0, borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>
            Customer Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Customer Name</span>
              <span style={{ fontWeight: 500 }}>{salesOrder.customer.name}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Phone</span>
              <span>{salesOrder.customer.phone}</span>
            </div>
            {salesOrder.customer.email && (
              <div>
                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Email</span>
                <span>{salesOrder.customer.email}</span>
              </div>
            )}
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Customer Type</span>
              <span style={{
                padding: '4px 8px',
                background: '#f0f0f0',
                borderRadius: '4px',
                fontSize: '12px',
                display: 'inline-block'
              }}>
                {salesOrder.customer.customerType}
              </span>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="card">
          <h3 style={{ marginTop: 0, borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>
            Order Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Invoice Number</span>
              <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{salesOrder.invoiceNumber}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Order Date</span>
              <span>{new Date(salesOrder.orderDate).toLocaleString()}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Payment Method</span>
              <span>{salesOrder.paymentMethod}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Order Type</span>
              <span>{salesOrder.orderType}</span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="card">
          <h3 style={{ marginTop: 0, borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>
            Financial Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Items Total</span>
              <span style={{ fontWeight: 500 }}>
                ₹{Number(salesOrder.orderTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {salesOrder.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>Discount</span>
                <span style={{ color: '#28a745', fontWeight: 500 }}>
                  - ₹{Number(salesOrder.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
              <span style={{ fontWeight: 600 }}>Final Amount</span>
              <span style={{ fontWeight: 600, color: '#0070f3', fontSize: '18px' }}>
                ₹{Number(salesOrder.finalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Paid Amount</span>
              <span style={{ fontWeight: 500, color: '#28a745' }}>
                ₹{Number(salesOrder.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Balance Due</span>
              <span style={{ 
                fontWeight: 500, 
                color: Number(salesOrder.finalAmount) - Number(salesOrder.paidAmount) > 0 ? '#dc3545' : '#28a745' 
              }}>
                ₹{(Number(salesOrder.finalAmount) - Number(salesOrder.paidAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {salesOrder.notes && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Notes</h3>
          <p style={{ color: '#666', marginTop: '10px', whiteSpace: 'pre-wrap' }}>{salesOrder.notes}</p>
        </div>
      )}

      {/* Order Items */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginTop: 0, borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>
          Order Items ({salesOrder.lines.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tag ID</th>
                <th>Barcode</th>
                <th>Product</th>
                <th>Metal</th>
                <th>Purity</th>
                <th>Weight (g)</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {salesOrder.lines.map((line) => (
                <tr key={line.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 500, color: '#0070f3' }}>
                    {line.stockItem.tagId}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {line.stockItem.barcode}
                  </td>
                  <td style={{ fontWeight: 500 }}>{line.stockItem.product.name}</td>
                  <td>{line.stockItem.product.metalType}</td>
                  <td>{line.stockItem.product.purity}</td>
                  <td>
                    <div style={{ fontSize: '13px' }}>
                      <div>Net: {line.stockItem.product.netWeight}g</div>
                      {line.stockItem.product.stoneWeight > 0 && (
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          Stone: {line.stockItem.product.stoneWeight}g
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{line.quantity}</td>
                  <td>₹{Number(line.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ fontWeight: 500 }}>
                    ₹{Number(line.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8f9fa', fontWeight: 600 }}>
                <td colSpan={8} style={{ textAlign: 'right' }}>Subtotal:</td>
                <td>₹{Number(salesOrder.orderTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              {salesOrder.discountAmount > 0 && (
                <tr style={{ background: '#f8f9fa' }}>
                  <td colSpan={8} style={{ textAlign: 'right' }}>Discount:</td>
                  <td style={{ color: '#28a745', fontWeight: 500 }}>
                    - ₹{Number(salesOrder.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              <tr style={{ background: '#e3f2fd', fontWeight: 700, fontSize: '16px' }}>
                <td colSpan={8} style={{ textAlign: 'right' }}>Final Amount:</td>
                <td style={{ color: '#0070f3' }}>
                  ₹{Number(salesOrder.finalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment History */}
      {salesOrder.payments && salesOrder.payments.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginTop: 0, borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
            💰 Payment History ({salesOrder.payments.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {salesOrder.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.paymentDate).toLocaleString()}</td>
                    <td style={{ fontWeight: 500, color: '#28a745' }}>
                      ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>{payment.paymentMethod}</td>
                    <td style={{ color: '#666', fontSize: '13px' }}>{payment.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#d5f4e6', fontWeight: 600 }}>
                  <td>Total Paid:</td>
                  <td style={{ color: '#28a745', fontSize: '16px' }}>
                    ₹{Number(salesOrder.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <RecordSalesPaymentModal
          salesOrder={salesOrder}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchSalesOrder();
          }}
        />
      )}
    </div>
  );
}
