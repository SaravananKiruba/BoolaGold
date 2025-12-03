'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
  };
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  paidAmount: number;
  discountAmount: number;
  referenceNumber?: string;
  notes?: string;
  items: PurchaseOrderItem[];
  stockItems?: StockItem[];
  payments?: Payment[];
}

interface PurchaseOrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    metalType: string;
    purity: string;
  };
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  expectedWeight?: number;
}

interface StockItem {
  id: string;
  tagId: string;
  barcode: string;
  product: {
    name: string;
  };
  status: string;
  purchaseCost: number;
  sellingPrice: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
}

interface Product {
  id: string;
  name: string;
  metalType: string;
  purity: string;
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPurchaseOrder();
    }
  }, [params.id]);

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/purchase-orders/${params.id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setPurchaseOrder(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch purchase order');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/purchase-orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Status updated successfully');
        fetchPurchaseOrder();
      } else {
        alert('Error: ' + (result.error?.message || 'Failed to update'));
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <div className="container">
        <div className="card">
          <p style={{ color: 'red' }}>Error: {error || 'Purchase order not found'}</p>
          <Link href="/purchase-orders" style={{ textDecoration: 'none', color: '#0070f3' }}>
            ← Back to Purchase Orders
          </Link>
        </div>
      </div>
    );
  }

  const canReceiveStock = ['PENDING', 'CONFIRMED', 'PARTIAL'].includes(purchaseOrder.status);
  const hasUnreceivedItems = purchaseOrder.items.some(item => item.receivedQuantity < item.quantity);

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
            Purchase Order: {purchaseOrder.orderNumber}
          </h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            Created: {new Date(purchaseOrder.orderDate).toLocaleDateString()}
          </p>
        </div>
        <Link 
          href="/purchase-orders" 
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
              <span style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Status</span>
              <span style={{ 
                padding: '6px 12px', 
                background: purchaseOrder.status === 'DELIVERED' ? '#d5f4e6' : 
                            purchaseOrder.status === 'PARTIAL' ? '#fff4e6' : 
                            purchaseOrder.status === 'CANCELLED' ? '#ffcdd2' : '#e3f2fd',
                color: purchaseOrder.status === 'DELIVERED' ? '#00b894' : 
                       purchaseOrder.status === 'PARTIAL' ? '#e67e22' : 
                       purchaseOrder.status === 'CANCELLED' ? '#d32f2f' : '#0070f3',
                borderRadius: '4px', 
                fontSize: '14px',
                fontWeight: 500
              }}>
                {purchaseOrder.status}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Payment</span>
              <span style={{ 
                padding: '6px 12px', 
                background: purchaseOrder.paymentStatus === 'PAID' ? '#d5f4e6' : 
                            purchaseOrder.paymentStatus === 'PARTIAL' ? '#fff4e6' : '#ffcdd2',
                color: purchaseOrder.paymentStatus === 'PAID' ? '#00b894' : 
                       purchaseOrder.paymentStatus === 'PARTIAL' ? '#e67e22' : '#d32f2f',
                borderRadius: '4px', 
                fontSize: '14px',
                fontWeight: 500
              }}>
                {purchaseOrder.paymentStatus}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {canReceiveStock && hasUnreceivedItems && (
              <button
                onClick={() => setShowReceiveStock(true)}
                disabled={actionLoading}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                }}
              >
                📦 Receive Stock
              </button>
            )}
            <button
              onClick={() => setShowEditForm(true)}
              disabled={actionLoading}
              style={{
                padding: '10px 20px',
                background: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Supplier Information */}
        <div className="card">
          <h3 style={{ marginTop: 0, borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>
            Supplier Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Supplier Name</span>
              <span style={{ fontWeight: 500 }}>{purchaseOrder.supplier.name}</span>
            </div>
            {purchaseOrder.supplier.contactPerson && (
              <div>
                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Contact Person</span>
                <span>{purchaseOrder.supplier.contactPerson}</span>
              </div>
            )}
            {purchaseOrder.supplier.phone && (
              <div>
                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Phone</span>
                <span>{purchaseOrder.supplier.phone}</span>
              </div>
            )}
            {purchaseOrder.supplier.email && (
              <div>
                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Email</span>
                <span>{purchaseOrder.supplier.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="card">
          <h3 style={{ marginTop: 0, borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>
            Order Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Order Date</span>
              <span>{new Date(purchaseOrder.orderDate).toLocaleDateString()}</span>
            </div>
            {purchaseOrder.expectedDeliveryDate && (
              <div>
                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Expected Delivery</span>
                <span>{new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString()}</span>
              </div>
            )}
            {purchaseOrder.actualDeliveryDate && (
              <div>
                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Actual Delivery</span>
                <span>{new Date(purchaseOrder.actualDeliveryDate).toLocaleDateString()}</span>
              </div>
            )}
            <div>
              <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Payment Method</span>
              <span>{purchaseOrder.paymentMethod}</span>
            </div>
            {purchaseOrder.referenceNumber && (
              <div>
                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Reference Number</span>
                <span>{purchaseOrder.referenceNumber}</span>
              </div>
            )}
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
                ₹{(Number(purchaseOrder.totalAmount) + Number(purchaseOrder.discountAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {purchaseOrder.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>Discount</span>
                <span style={{ color: '#28a745', fontWeight: 500 }}>
                  - ₹{Number(purchaseOrder.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
              <span style={{ fontWeight: 600 }}>Total Amount</span>
              <span style={{ fontWeight: 600, color: '#0070f3', fontSize: '18px' }}>
                ₹{Number(purchaseOrder.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Paid Amount</span>
              <span style={{ fontWeight: 500, color: '#28a745' }}>
                ₹{Number(purchaseOrder.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Balance Due</span>
              <span style={{ fontWeight: 500, color: Number(purchaseOrder.totalAmount) - Number(purchaseOrder.paidAmount) > 0 ? '#dc3545' : '#28a745' }}>
                ₹{(Number(purchaseOrder.totalAmount) - Number(purchaseOrder.paidAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {purchaseOrder.notes && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Notes</h3>
          <p style={{ color: '#666', marginTop: '10px', whiteSpace: 'pre-wrap' }}>{purchaseOrder.notes}</p>
        </div>
      )}

      {/* Order Items */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginTop: 0, borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>
          Order Items
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Metal Type</th>
                <th>Purity</th>
                <th>Ordered Qty</th>
                <th>Received Qty</th>
                <th>Pending</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrder.items.map((item) => {
                const pending = item.quantity - item.receivedQuantity;
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.product.name}</td>
                    <td>{item.product.metalType}</td>
                    <td>{item.product.purity}</td>
                    <td>{item.quantity}</td>
                    <td style={{ color: item.receivedQuantity > 0 ? '#28a745' : '#999' }}>
                      {item.receivedQuantity}
                    </td>
                    <td style={{ 
                      color: pending > 0 ? '#dc3545' : '#28a745',
                      fontWeight: pending > 0 ? 500 : 'normal'
                    }}>
                      {pending}
                    </td>
                    <td>₹{Number(item.unitPrice).toFixed(2)}</td>
                    <td style={{ fontWeight: 500 }}>
                      ₹{(item.quantity * Number(item.unitPrice)).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Items Generated */}
      {purchaseOrder.stockItems && purchaseOrder.stockItems.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginTop: 0, borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
            📦 Stock Items Generated ({purchaseOrder.stockItems.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tag ID</th>
                  <th>Barcode</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Purchase Cost</th>
                  <th>Selling Price</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrder.stockItems.map((stock) => (
                  <tr key={stock.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500, color: '#0070f3' }}>
                      {stock.tagId}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {stock.barcode}
                    </td>
                    <td>{stock.product.name}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        background: stock.status === 'AVAILABLE' ? '#d5f4e6' : '#fff4e6',
                        color: stock.status === 'AVAILABLE' ? '#00b894' : '#e67e22',
                        borderRadius: '4px', 
                        fontSize: '12px' 
                      }}>
                        {stock.status}
                      </span>
                    </td>
                    <td>₹{Number(stock.purchaseCost).toFixed(2)}</td>
                    <td>₹{Number(stock.sellingPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditForm && (
        <EditPurchaseOrderModal
          purchaseOrder={purchaseOrder}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            fetchPurchaseOrder();
          }}
        />
      )}

      {/* Receive Stock Modal */}
      {showReceiveStock && (
        <ReceiveStockModal
          purchaseOrder={purchaseOrder}
          onClose={() => setShowReceiveStock(false)}
          onSuccess={() => {
            setShowReceiveStock(false);
            fetchPurchaseOrder();
          }}
        />
      )}
    </div>
  );
}

// Edit Purchase Order Modal
function EditPurchaseOrderModal({ purchaseOrder, onClose, onSuccess }: {
  purchaseOrder: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    expectedDeliveryDate: purchaseOrder.expectedDeliveryDate?.split('T')[0] || '',
    status: purchaseOrder.status,
    paymentStatus: purchaseOrder.paymentStatus,
    notes: purchaseOrder.notes || '',
    referenceNumber: purchaseOrder.referenceNumber || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        alert('Purchase order updated successfully');
        onSuccess();
      } else {
        setError(result.error?.message || 'Failed to update');
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
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '30px',
      }}>
        <h2 style={{ marginTop: 0 }}>Edit Purchase Order</h2>
        
        {error && (
          <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PARTIAL">Partial</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Payment Status
            </label>
            <select
              value={formData.paymentStatus}
              onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Reference Number
            </label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: submitting ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              {submitting ? 'Updating...' : 'Update'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
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

// Receive Stock Modal
function ReceiveStockModal({ purchaseOrder, onClose, onSuccess }: {
  purchaseOrder: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [receiptItems, setReceiptItems] = useState<Array<{
    purchaseOrderItemId: string;
    productId: string;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    pendingQty: number;
    quantityToReceive: number;
    purchaseCost: string;
    sellingPrice: string;
  }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize receipt items from pending PO items
    const items = purchaseOrder.items
      .filter(item => item.receivedQuantity < item.quantity)
      .map(item => ({
        purchaseOrderItemId: item.id,
        productId: item.product.id,
        productName: item.product.name,
        orderedQty: item.quantity,
        receivedQty: item.receivedQuantity,
        pendingQty: item.quantity - item.receivedQuantity,
        quantityToReceive: item.quantity - item.receivedQuantity,
        purchaseCost: item.unitPrice.toString(),
        sellingPrice: item.unitPrice.toString(),
      }));
    setReceiptItems(items);
  }, [purchaseOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const itemsToReceive = receiptItems.filter(item => item.quantityToReceive > 0);
    if (itemsToReceive.length === 0) {
      setError('Please specify quantity to receive for at least one item');
      return;
    }

    // Validate all items have pricing
    const missingPricing = itemsToReceive.some(item => !item.purchaseCost || !item.sellingPrice);
    if (missingPricing) {
      setError('Purchase cost and selling price required for all items being received');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}/receive-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToReceive.map(item => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            productId: item.productId,
            quantityToReceive: item.quantityToReceive,
            receiptDetails: [{
              purchaseCost: parseFloat(item.purchaseCost),
              sellingPrice: parseFloat(item.sellingPrice),
            }],
          })),
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Stock received successfully! ${result.data.stockItemsCreated} items generated with unique Tag IDs and Barcodes.`);
        onSuccess();
      } else {
        setError(result.error?.message || 'Failed to receive stock');
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
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '30px',
      }}>
        <h2 style={{ marginTop: 0 }}>📦 Receive Stock Items</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Generate unique Tag IDs and Barcodes for each physical jewelry piece being received.
        </p>

        {error && (
          <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Ordered</th>
                  <th>Received</th>
                  <th>Pending</th>
                  <th>Receive Now</th>
                  <th>Purchase Cost (₹)</th>
                  <th>Selling Price (₹)</th>
                </tr>
              </thead>
              <tbody>
                {receiptItems.map((item, index) => (
                  <tr key={item.purchaseOrderItemId}>
                    <td style={{ fontWeight: 500 }}>{item.productName}</td>
                    <td>{item.orderedQty}</td>
                    <td style={{ color: '#666' }}>{item.receivedQty}</td>
                    <td style={{ color: '#dc3545', fontWeight: 500 }}>{item.pendingQty}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={item.pendingQty}
                        value={item.quantityToReceive}
                        onChange={(e) => {
                          const newItems = [...receiptItems];
                          newItems[index].quantityToReceive = parseInt(e.target.value) || 0;
                          setReceiptItems(newItems);
                        }}
                        style={{ width: '80px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.purchaseCost}
                        onChange={(e) => {
                          const newItems = [...receiptItems];
                          newItems[index].purchaseCost = e.target.value;
                          setReceiptItems(newItems);
                        }}
                        style={{ width: '100px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                        placeholder="Per piece"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.sellingPrice}
                        onChange={(e) => {
                          const newItems = [...receiptItems];
                          newItems[index].sellingPrice = e.target.value;
                          setReceiptItems(newItems);
                        }}
                        style={{ width: '100px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                        placeholder="Per piece"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '15px', background: '#d5f4e6', borderRadius: '8px', marginBottom: '20px' }}>
            <strong>Total Items to Receive:</strong> {receiptItems.reduce((sum, item) => sum + item.quantityToReceive, 0)}
            <div style={{ fontSize: '12px', color: '#00b894', marginTop: '5px' }}>
              ✓ Unique Tag IDs and Barcodes will be generated for each physical piece
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: submitting ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              {submitting ? 'Receiving Stock...' : '📦 Receive Stock & Generate Items'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
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
