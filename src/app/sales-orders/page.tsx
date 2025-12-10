'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from '@/utils/toast';
import { usePermissions } from '@/hooks/usePermissions';

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
  status: string;
  product: {
    id: string;
    name: string;
    metalType: string;
    purity: string;
    netWeight: number;
  };
  sellingPrice?: number; // Optional: only used during barcode scan response
}

interface OrderLine {
  stockItemId: string;
  quantity: number;
  unitPrice: number;
  stockItem?: StockItem;
  calculatingPrice?: boolean;
}

export default function SalesOrdersPage() {
  const { session, hasPermission, loading: permLoading } = usePermissions();
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
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (showCreateForm) {
      fetchCustomers();
    }
  }, [showCreateForm]);
  
  // Debounced search
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    if (searchQuery.trim().length >= 2) {
      const timeout = setTimeout(() => {
        searchStock(searchQuery);
      }, 300);
      setSearchDebounce(timeout);
    } else {
      setSearchResults([]);
    }
    
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchQuery]);

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

  const searchStock = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      console.log('[Sales Order] Searching for:', query);
      const response = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}&status=AVAILABLE&limit=20`);
      const result = await response.json();
      
      console.log('[Sales Order] Search response:', result);
      
      if (result.success && Array.isArray(result.data)) {
        setSearchResults(result.data);
        console.log('[Sales Order] Found items:', result.data.length);
      } else {
        setSearchResults([]);
        console.warn('[Sales Order] No results or invalid response:', result);
      }
    } catch (err) {
      console.error('[Sales Order] Failed to search stock:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addOrderLine = async (stockItem: StockItem) => {
    // Check if already added
    if (orderLines.find(line => line.stockItemId === stockItem.id)) {
      toast.warning('This item is already added to the order');
      return;
    }

    console.log('[Sales Order] Adding item to order:', stockItem.tagId);

    // Add line with placeholder price (calculating)
    const newLine: OrderLine = {
      stockItemId: stockItem.id,
      quantity: 1,
      unitPrice: 0,
      stockItem,
      calculatingPrice: true,
    };
    setOrderLines([...orderLines, newLine]);

    // Fetch calculated selling price from API
    try {
      console.log('[Sales Order] Calculating price for item:', stockItem.id);
      const response = await fetch(`/api/stock/calculate-price?stockItemId=${stockItem.id}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log('[Sales Order] Price calculation result:', result);
      
      if (result.success && result.data) {
        const sellingPrice = result.data.sellingPrice;
        
        if (typeof sellingPrice !== 'number' || sellingPrice <= 0) {
          throw new Error('Invalid selling price returned from server');
        }
        
        console.log('[Sales Order] Price calculated:', sellingPrice);
        // Update line with calculated price
        setOrderLines(prev => prev.map(line => 
          line.stockItemId === stockItem.id 
            ? { ...line, unitPrice: sellingPrice, calculatingPrice: false }
            : line
        ));
        toast.success(`Price calculated: ₹${sellingPrice.toLocaleString('en-IN')}`);
      } else {
        const errorMsg = result.error?.message || result.error || 'Unknown error';
        console.error('[Sales Order] Price calculation failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('[Sales Order] Failed to calculate price:', err);
      toast.error(`Failed to calculate price: ${err.message}`);
      setOrderLines(prev => prev.filter(line => line.stockItemId !== stockItem.id));
    }
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
    // **ISSUE 5 FIX**: Check client-side permission before attempting API call
    if (!hasPermission('SALES_CREATE')) {
      toast.error("You don't have permission to create sales orders");
      return;
    }

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
          // unitPrice calculated automatically by backend
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
        toast.success('Order created successfully! Invoice: ' + result.data.invoiceNumber, 5000);
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
    setSearchQuery('');
    setSearchResults([]);
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
          {/* **ISSUE 5 FIX**: Only show create button if user has permission */}
          {hasPermission('SALES_CREATE') ? (
            <button 
              className="button" 
              onClick={() => setShowCreateForm(true)}
              style={{ background: '#0070f3', color: 'white', padding: '10px 20px' }}
            >
              + Create Order
            </button>
          ) : (
            <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
              No permission to create orders
            </div>
          )}
        </div>

        {loading && <p>Loading sales orders...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!loading && !error && orders.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
            No sales orders found. Create your first order to get started.
          </p>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="table-wrapper">
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
                    <Link 
                      href={`/sales-orders/${order.id}`}
                      style={{ 
                        padding: '4px 12px', 
                        background: 'transparent', 
                        border: '1px solid #0070f3', 
                        color: '#0070f3', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '12px',
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Create New Sales Order</h2>
              <button onClick={() => { setShowCreateForm(false); resetForm(); }} className="modal-close">×</button>
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

            {/* Search and Add Items */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontWeight: 500 }}>
                  🔍 Search or Scan Items to Add
                </label>
                <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                  💡 Prices calculated using current market rates
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={async (e) => {
                    // Handle Enter key for quick barcode/tag scan
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      e.preventDefault();
                      try {
                        const response = await fetch(`/api/barcode/scan?code=${encodeURIComponent(searchQuery.trim())}`);
                        const result = await response.json();
                        if (result.success && result.data.stockItem) {
                          const item: StockItem = {
                            id: result.data.stockItem.id,
                            tagId: result.data.stockItem.tagId,
                            barcode: result.data.stockItem.barcode,
                            status: result.data.stockItem.status,
                            product: result.data.product
                          };
                          if (item.status === 'AVAILABLE') {
                            addOrderLine(item);
                            setSearchQuery('');
                            setSearchResults([]);
                          } else {
                            toast.warning(`Item ${item.tagId} is not available (Status: ${item.status})`);
                          }
                        } else {
                          // Fall back to search
                          searchStock(searchQuery);
                        }
                      } catch (err) {
                        console.error('Scan error:', err);
                      }
                    }
                  }}
                  placeholder="Search by product name, tag ID, or barcode (Press Enter for exact scan)..."
                  style={{ 
                    flex: 1,
                    padding: '12px', 
                    border: '2px solid #0070f3', 
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    style={{
                      padding: '12px 20px',
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                💡 Tip: Type and press Enter for exact barcode/tag lookup, or wait 0.3s for search results
              </div>
              
              {searching && (
                <div style={{ padding: '15px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                  Searching...
                </div>
              )}
              
              {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <div style={{ padding: '15px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                  No items found for "{searchQuery}"
                </div>
              )}
              
              {!searching && searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                <div style={{ padding: '15px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                  Type at least 2 characters to search
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  maxHeight: '300px', 
                  overflowY: 'auto',
                  marginTop: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {searchResults.map(item => {
                    const isAdded = orderLines.find(l => l.stockItemId === item.id) !== undefined;
                    return (
                      <div 
                        key={item.id}
                        style={{ 
                          padding: '12px', 
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: isAdded ? '#f0f8ff' : 'white',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                            {item.product.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span>
                              <strong>Metal:</strong> {item.product.metalType} {item.product.purity}
                            </span>
                            <span>
                              <strong>Weight:</strong> {item.product.netWeight}g
                            </span>
                            <span>
                              <strong>Tag:</strong> {item.tagId}
                            </span>
                            {item.barcode && (
                              <span>
                                <strong>Barcode:</strong> {item.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: '15px' }}>
                          <div style={{ fontWeight: 500, fontSize: '13px', color: '#666', marginBottom: '6px', fontStyle: 'italic' }}>
                            💰 Price calculated at checkout
                          </div>
                          <button
                            onClick={() => {
                              addOrderLine(item);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            disabled={isAdded}
                            style={{ 
                              padding: '6px 16px', 
                              background: isAdded ? '#ccc' : '#0070f3', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px',
                              cursor: isAdded ? 'not-allowed' : 'pointer',
                              fontSize: '13px',
                              fontWeight: 500
                            }}
                          >
                            {isAdded ? '✓ Added' : '+ Add'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Lines */}
            {orderLines.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <label style={{ fontWeight: 600, fontSize: '15px' }}>
                    🛒 Selected Items ({orderLines.length})
                  </label>
                  <button
                    onClick={() => setOrderLines([])}
                    style={{
                      padding: '4px 12px',
                      background: '#ff6b6b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Clear All
                  </button>
                </div>
                <div className="table-wrapper" style={{ borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(to bottom, #f8f9fa, #e9ecef)' }}>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}>Item Details</th>
                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}>Price</th>
                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}>Qty</th>
                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}>Total</th>
                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderLines.map((line, index) => (
                        <tr 
                          key={line.stockItemId}
                          style={{ 
                            background: index % 2 === 0 ? 'white' : '#f8f9fa',
                            borderBottom: '1px solid #e9ecef'
                          }}
                        >
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                              {line.stockItem?.product.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', display: 'flex', gap: '10px' }}>
                              <span>📌 {line.stockItem?.tagId}</span>
                              {line.stockItem?.product.metalType && (
                                <span>🔸 {line.stockItem.product.metalType} {line.stockItem.product.purity}</span>
                              )}
                              {line.stockItem?.product.netWeight && (
                                <span>⚖️ {line.stockItem.product.netWeight}g</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                            {line.calculatingPrice ? (
                              <span style={{ color: '#999', fontStyle: 'italic' }}>Calculating...</span>
                            ) : (
                              <span>₹{line.unitPrice.toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              background: '#e3f2fd',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontWeight: 500
                            }}>
                              {line.quantity}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '15px', color: '#27ae60' }}>
                            {line.calculatingPrice ? (
                              <span style={{ color: '#999', fontStyle: 'italic' }}>Calculating...</span>
                            ) : (
                              <span>₹{(line.unitPrice * line.quantity).toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => removeOrderLine(line.stockItemId)}
                              style={{ 
                                background: '#ff4444', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500
                              }}
                            >
                              🗑️ Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="responsive-grid responsive-grid-2" style={{ marginBottom: '20px' }}>
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
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
