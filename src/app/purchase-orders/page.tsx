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

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  metalType: string;
  purity: string;
  netWeight: number;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  expectedWeight: string;
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
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
          <button 
            className="button"
            onClick={() => setShowCreateForm(true)}
          >
            + Create Order
          </button>
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

      {/* Create Purchase Order Modal */}
      {showCreateForm && (
        <PurchaseOrderFormModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchPurchaseOrders();
          }}
        />
      )}
    </div>
  );
}

// Purchase Order Form Modal Component
function PurchaseOrderFormModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    paymentMethod: 'CASH',
    discountAmount: '',
    referenceNumber: '',
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    quantity: '1',
    unitPrice: '',
    expectedWeight: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers?isActive=true');
      const result = await response.json();
      if (result.success && result.data) {
        setSuppliers(result.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setFormError('Failed to load suppliers');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('/api/products?isActive=true&pageSize=1000');
      const result = await response.json();
      if (result.success) {
        // Handle both paginated and non-paginated responses
        const productData = result.data?.data || result.data || [];
        setProducts(productData);
        console.log('Loaded products:', productData.length);
      } else {
        setFormError('Failed to load products: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setFormError('Failed to load products: ' + error.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  const addItem = () => {
    if (!currentItem.productId || !currentItem.quantity || !currentItem.unitPrice) {
      alert('Please fill in product, quantity, and unit price');
      return;
    }

    const product = products.find(p => p.id === currentItem.productId);
    if (!product) return;

    const newItem: OrderItem = {
      productId: currentItem.productId,
      productName: product.name,
      quantity: parseInt(currentItem.quantity),
      unitPrice: currentItem.unitPrice,
      expectedWeight: currentItem.expectedWeight,
    };

    setOrderItems([...orderItems, newItem]);
    setCurrentItem({
      productId: '',
      quantity: '1',
      unitPrice: '',
      expectedWeight: '',
    });
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const itemsTotal = orderItems.reduce((sum, item) => {
      return sum + (item.quantity * parseFloat(item.unitPrice));
    }, 0);
    const discount = parseFloat(formData.discountAmount) || 0;
    return itemsTotal - discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.supplierId) {
      setFormError('Please select a supplier');
      return;
    }

    if (orderItems.length === 0) {
      setFormError('Please add at least one item to the order');
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        supplierId: formData.supplierId,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        paymentMethod: formData.paymentMethod,
        discountAmount: parseFloat(formData.discountAmount) || 0,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          expectedWeight: item.expectedWeight ? parseFloat(item.expectedWeight) : undefined,
        })),
      };

      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Purchase order created successfully! Order #: ' + result.data.orderNumber);
        onSuccess();
      } else {
        setFormError(result.error?.message || 'Failed to create purchase order');
      }
    } catch (error: any) {
      setFormError('Error: ' + error.message);
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
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '30px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Create Purchase Order</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ×
          </button>
        </div>

        {formError && (
          <div style={{ 
            padding: '10px', 
            background: '#ffebee', 
            color: '#c62828', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
            Order Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Supplier <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                required
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            <div>
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

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Reference Number
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Optional reference"
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
              placeholder="Optional notes"
            />
          </div>

          <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
            Order Items
          </h3>

          {loadingProducts && (
            <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '4px', marginBottom: '15px' }}>
              Loading products...
            </div>
          )}

          {!loadingProducts && products.length === 0 && (
            <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '4px', marginBottom: '15px' }}>
              ⚠️ No active products found. Please add products first.
            </div>
          )}

          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Product {loadingProducts && '(Loading...)'}
                </label>
                <select
                  value={currentItem.productId}
                  onChange={(e) => setCurrentItem({ ...currentItem, productId: e.target.value })}
                  disabled={loadingProducts || products.length === 0}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    cursor: (loadingProducts || products.length === 0) ? 'not-allowed' : 'pointer',
                    background: (loadingProducts || products.length === 0) ? '#f5f5f5' : 'white'
                  }}
                >
                  <option value="">-- Select Product --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.metalType} {product.purity}) - {product.netWeight}g
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentItem.unitPrice}
                  onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Weight (g)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={currentItem.expectedWeight}
                  onChange={(e) => setCurrentItem({ ...currentItem, expectedWeight: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="Optional"
                />
              </div>

              <button
                type="button"
                onClick={addItem}
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Add Item
              </button>
            </div>
          </div>

          {orderItems.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Weight</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>₹{parseFloat(item.unitPrice).toFixed(2)}</td>
                      <td>{item.expectedWeight ? `${item.expectedWeight}g` : '-'}</td>
                      <td style={{ fontWeight: 500 }}>
                        ₹{(item.quantity * parseFloat(item.unitPrice)).toFixed(2)}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          style={{
                            padding: '4px 8px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
            Order Summary
          </h3>

          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Items Total:</span>
              <span style={{ fontWeight: 500 }}>
                ₹{orderItems.reduce((sum, item) => sum + (item.quantity * parseFloat(item.unitPrice)), 0).toFixed(2)}
              </span>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Discount Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              paddingTop: '10px', 
              borderTop: '2px solid #ddd',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              <span>Final Total:</span>
              <span style={{ color: '#0070f3' }}>₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={submitting || orderItems.length === 0}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: (submitting || orderItems.length === 0) ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (submitting || orderItems.length === 0) ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: '16px',
              }}
            >
              {submitting ? 'Creating Order...' : 'Create Purchase Order'}
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
                fontSize: '16px',
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
