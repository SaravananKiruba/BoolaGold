import { useState } from 'react';

interface SalesOrder {
  id: string;
  invoiceNumber: string;
  finalAmount: number;
  paidAmount: number;
}

export default function RecordSalesPaymentModal({ salesOrder, onClose, onSuccess }: {
  salesOrder: SalesOrder;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingAmount = Number(salesOrder.finalAmount) - Number(salesOrder.paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (Number(formData.amount) > remainingAmount) {
      setError(`Payment amount cannot exceed remaining balance of ₹${remainingAmount.toLocaleString('en-IN')}`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/sales-orders/${salesOrder.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(formData.amount),
          paymentMethod: formData.paymentMethod,
          referenceNumber: formData.referenceNumber || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Payment recorded successfully!\n💰 Income transaction created.\nRemaining: ₹${result.data.pendingAmount.toLocaleString('en-IN')}`);
        onSuccess();
      } else {
        setError(result.error?.message || 'Failed to record payment');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0, borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
          💰 Record Payment
        </h2>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '4px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '20px', padding: '12px', background: '#f3f4f6', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Invoice:</span>
            <strong>{salesOrder.invoiceNumber}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Total Amount:</span>
            <strong>₹{Number(salesOrder.finalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#28a745' }}>
            <span>Paid Amount:</span>
            <strong>₹{Number(salesOrder.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #ddd', color: '#dc3545' }}>
            <span>Balance Due:</span>
            <strong style={{ fontSize: '18px' }}>₹{remainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder={`Max: ${remainingAmount.toLocaleString('en-IN')}`}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            />
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, amount: (remainingAmount / 4).toFixed(2) })}
                style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, amount: (remainingAmount / 2).toFixed(2) })}
                style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, amount: remainingAmount.toFixed(2) })}
                style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                Full Amount
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Payment Method *</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT">Credit</option>
              <option value="EMI">EMI</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Reference Number</label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="Transaction ID, Check Number, etc."
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: submitting ? '#9ca3af' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: '16px',
              }}
            >
              {submitting ? 'Recording...' : 'Record Payment & Create Income'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
