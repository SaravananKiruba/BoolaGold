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

interface Customer {
  id: string;
  name: string;
  phone: string;
  customerType: string;
}

interface StockItem {
  id: string;
  tagId: string;
  barcode: string;
  sellingPrice: number;
  status: string;
  product: {
    id: string;
    name: string;
    metalType: string;
    purity: string;
    netWeight: number;
  };
}

interface OrderLine {
  stockItemId: string;
  quantity: number;
  unitPrice: number;
  stockItem?: StockItem;
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableStock, setAvailableStock] = useState<StockItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [orderType, setOrderType] = useState('RETAIL');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (showCreateForm) {
      fetchCustomers();
      fetchAvailableStock();
    }
  }, [showCreateForm]);

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

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?pageSize=100');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setCustomers(result.data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    }
  };

  const fetchAvailableStock = async () => {
    try {
      const response = await fetch('/api/stock?status=AVAILABLE&pageSize=100');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setAvailableStock(result.data);
      } else {
        setAvailableStock([]);
      }
    } catch (err) {
      console.error('Failed to fetch stock:', err);
      setAvailableStock([]);
    }
  };

  const addOrderLine = (stockItem: StockItem) => {
    // Check if already added
    if (orderLines.find(line => line.stockItemId === stockItem.id)) {
      alert('This item is already added to the order');
      return;
    }

    setOrderLines([...orderLines, {
      stockItemId: stockItem.id,
      quantity: 1,
      unitPrice: Number(stockItem.sellingPrice),
      stockItem
    }]);
  };

  const removeOrderLine = (stockItemId: string) => {
    setOrderLines(orderLines.filter(line => line.stockItemId !== stockItemId));
  };

  const calculateOrderTotal = () => {
    return orderLines.reduce((sum, line) => sum + (line.unitPrice * line.quantity), 0);
  };

  const calculateFinalAmount = () => {
    return Math.max(0, calculateOrderTotal() - discountAmount);
  };

  const handleCreateOrder = async () => {
    setCreateError(null);

    // Validations
    if (!selectedCustomerId) {
      setCreateError('Please select a customer');
      return;
    }

    if (orderLines.length === 0) {
      setCreateError('Please add at least one item to the order');
      return;
    }

    if (discountAmount > calculateOrderTotal()) {
      setCreateError('Discount cannot exceed order total');
      return;
    }

    try {
      setCreating(true);

      const orderData = {
        customerId: selectedCustomerId,
        lines: orderLines.map(line => ({
          stockItemId: line.stockItemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice
        })),
        discountAmount: discountAmount,
        paymentMethod: paymentMethod,
        orderType: orderType,
        notes: notes || undefined,
        paymentAmount: paymentAmount > 0 ? paymentAmount : undefined,
        createAsPending: false
      };

      const response = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        alert('Order created successfully! Invoice: ' + result.data.invoiceNumber);
        setShowCreateForm(false);
        resetForm();
        fetchOrders();
      } else {
        setCreateError(result.error?.message || 'Failed to create order');
      }
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setOrderLines([]);
    setDiscountAmount(0);
    setPaymentMethod('CASH');
    setPaymentAmount(0);
    setOrderType('RETAIL');
    setNotes('');
    setCreateError(null);
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
          <button 
            className="button" 
            onClick={() => setShowCreateForm(true)}
            style={{ background: '#0070f3', color: 'white', padding: '10px 20px' }}
          >
            + Create Order
          </button>
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
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateForm && (
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
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '30px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Create New Sales Order</h2>
              <button 
                onClick={() => { setShowCreateForm(false); resetForm(); }}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {createError && (
              <div style={{ padding: '10px', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '15px' }}>
                {createError}
              </div>
            )}

            {/* Customer Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                Customer *
              </label>
              <select 
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone} ({customer.customerType})
                  </option>
                ))}
              </select>
            </div>

            {/* Available Stock Items */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                Add Items to Order
              </label>
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                {!Array.isArray(availableStock) || availableStock.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    No available stock items found
                  </div>
                ) : (
                  availableStock.map(item => (
                    <div 
                      key={item.id}
                      style={{ 
                        padding: '10px', 
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.product.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {item.product.metalType} {item.product.purity} | 
                          Weight: {item.product.netWeight}g | 
                          Tag: {item.tagId}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 500 }}>₹{Number(item.sellingPrice).toLocaleString('en-IN')}</div>
                        <button
                          onClick={() => addOrderLine(item)}
                          disabled={orderLines.find(l => l.stockItemId === item.id) !== undefined}
                          style={{ 
                            padding: '4px 12px', 
                            background: '#0070f3', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginTop: '5px'
                          }}
                        >
                          {orderLines.find(l => l.stockItemId === item.id) ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Order Lines */}
            {orderLines.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                  Order Items ({orderLines.length})
                </label>
                <table style={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '8px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderLines.map(line => (
                      <tr key={line.stockItemId}>
                        <td style={{ padding: '8px' }}>
                          <div>{line.stockItem?.product.name}</div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {line.stockItem?.tagId}
                          </div>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          ₹{line.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>{line.quantity}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>
                          ₹{(line.unitPrice * line.quantity).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button
                            onClick={() => removeOrderLine(line.stockItemId)}
                            style={{ 
                              background: '#ff4444', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '12px'
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

            {/* Order Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                  Discount Amount
                </label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  min="0"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT">Credit</option>
                  <option value="EMI">EMI</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  min="0"
                  placeholder="0 for full payment"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="CUSTOM">Custom</option>
                  <option value="EXCHANGE">Exchange</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
                placeholder="Add any notes about this order..."
              />
            </div>

            {/* Order Summary */}
            <div style={{ 
              background: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '4px', 
              marginBottom: '20px' 
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 500 }}>₹{calculateOrderTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Discount:</span>
                <span style={{ fontWeight: 500, color: '#e74c3c' }}>- ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                paddingTop: '10px', 
                borderTop: '2px solid #ddd',
                fontSize: '18px'
              }}>
                <span style={{ fontWeight: 600 }}>Final Amount:</span>
                <span style={{ fontWeight: 600, color: '#27ae60' }}>₹{calculateFinalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowCreateForm(false); resetForm(); }}
                disabled={creating}
                style={{
                  padding: '12px 24px',
                  background: '#ddd',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={creating || orderLines.length === 0 || !selectedCustomerId}
                style={{
                  padding: '12px 24px',
                  background: creating ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                {creating ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
