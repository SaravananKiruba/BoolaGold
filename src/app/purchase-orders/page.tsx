'use client';

import { useState, useEffect } from 'react';
import { usePageGuard } from '@/hooks/usePageGuard';
import Link from 'next/link';
import { toast } from '@/utils/toast';
import ProductAutocomplete from '@/components/ui/ProductAutocomplete';

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
  purchaseCost?: string;
}

export default function PurchaseOrdersPage() {
  const { isAuthorized, isLoading: authLoading } = usePageGuard(['OWNER', 'ACCOUNTS']);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
  });

  useEffect(() => {
    if (isAuthorized) {
      fetchPurchaseOrders();
    }
  }, [filters, isAuthorized]);

  if (authLoading || !isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Verifying access...</p>
        </div>
      </div>
    );
  }

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
        <div className="responsive-grid responsive-grid-4">
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
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', 
            gap: '20px' 
          }}>
            {purchaseOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Status Badges */}
                <div style={{ 
                  position: 'absolute', 
                  top: '12px', 
                  right: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  alignItems: 'flex-end'
                }}>
                  <span style={{
                    padding: '4px 8px',
                    background: order.status === 'DELIVERED' ? '#d5f4e6' : 
                               order.status === 'PARTIAL' ? '#fff4e6' : 
                               order.status === 'CANCELLED' ? '#ffcdd2' : '#e3f2fd',
                    color: order.status === 'DELIVERED' ? '#00b894' : 
                           order.status === 'PARTIAL' ? '#e67e22' : 
                           order.status === 'CANCELLED' ? '#d32f2f' : '#0070f3',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {order.status}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    background: order.paymentStatus === 'PAID' ? '#d5f4e6' : 
                               order.paymentStatus === 'PARTIAL' ? '#fff4e6' : '#ffcdd2',
                    color: order.paymentStatus === 'PAID' ? '#00b894' : 
                           order.paymentStatus === 'PARTIAL' ? '#e67e22' : '#d32f2f',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {order.paymentStatus}
                  </span>
                </div>

                {/* Order Number */}
                <h3 style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '18px', 
                  fontWeight: 600,
                  color: '#0070f3',
                  fontFamily: 'monospace',
                  paddingRight: '100px'
                }}>
                  📦 {order.orderNumber}
                </h3>

                {/* Supplier Info */}
                <div style={{ 
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: '#333' }}>
                    🏢 {order.supplier.name}
                  </div>
                </div>

                {/* Order Details */}
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}>
                    <span style={{ color: '#666' }}>Order Date:</span>
                    <span style={{ fontWeight: 600 }}>{new Date(order.orderDate).toLocaleDateString()}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '13px'
                  }}>
                    <span style={{ color: '#666' }}>Items Count:</span>
                    <span style={{ fontWeight: 600 }}>{order.items?.length || 0}</span>
                  </div>
                </div>

                {/* Amount Section */}
                <div style={{ 
                  background: '#e3f2fd', 
                  padding: '12px', 
                  borderRadius: '6px',
                  marginBottom: '15px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: order.paidAmount > 0 ? '8px' : '0'
                  }}>
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Total Amount:</span>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#0070f3' }}>
                      ₹{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {order.paidAmount > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#00b894',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(0,112,243,0.2)'
                    }}>
                      <span>Paid Amount:</span>
                      <span style={{ fontWeight: 600 }}>₹{Number(order.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Link 
                  href={`/purchase-orders/${order.id}`}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: '#0070f3',
                    border: 'none',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'block',
                    transition: 'background 0.2s',
                    marginTop: 'auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#0051cc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#0070f3'}
                >
                  👁️ View Details
                </Link>
              </div>
            ))}
          </div>
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
    autoReceiveStock: false, // NEW: Auto-generate stock items
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    quantity: '1',
    unitPrice: '',
    purchaseCost: '',
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

  const handleAddItem = () => {
    if (!currentItem.productId || !currentItem.quantity || !currentItem.unitPrice) {
      toast.warning('Please fill in product, quantity, and unit price');
      return;
    }

    // If auto-receive is enabled, validate pricing fields
    if (formData.autoReceiveStock) {
      if (!currentItem.purchaseCost) {
        toast.warning('Purchase cost is required when auto-generating stock items');
        return;
      }
    }

    const product = products.find(p => p.id === currentItem.productId);
    if (!product) return;

    const newItem: OrderItem = {
      productId: currentItem.productId,
      productName: product.name,
      quantity: parseInt(currentItem.quantity),
      unitPrice: currentItem.unitPrice,
      purchaseCost: currentItem.purchaseCost,
    };

    setOrderItems([...orderItems, newItem]);
    setCurrentItem({
      productId: '',
      quantity: '1',
      unitPrice: '',
      purchaseCost: '',
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
        autoReceiveStock: formData.autoReceiveStock, // NEW: Include auto-receive flag
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          purchaseCost: item.purchaseCost ? parseFloat(item.purchaseCost) : parseFloat(item.unitPrice),
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
        const message = formData.autoReceiveStock 
          ? `Purchase order created successfully! Order #: ${result.data.orderNumber}\n${result.data.stockItemsCreated} stock items generated with unique tags and barcodes.`
          : `Purchase order created successfully! Order #: ${result.data.orderNumber}`;
        toast.success(message, 5000);
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
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '1200px' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>Create Purchase Order</h2>
          <button onClick={onClose} className="modal-close">×</button>
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

          <div className="responsive-grid responsive-grid-2" style={{ marginBottom: '20px' }}>
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

          <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <label style={{ display: 'flex', alignItems: 'start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.autoReceiveStock}
                onChange={(e) => setFormData({ ...formData, autoReceiveStock: e.target.checked })}
                style={{ marginRight: '10px', marginTop: '3px', cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '5px' }}>
                  🏷️ Auto-Generate Stock Items (Direct Purchase)
                </div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
                  Enable this for <strong>direct purchases</strong> where stock is received immediately.
                  System will auto-generate unique <strong>Tag IDs and Barcodes</strong> for each physical jewelry piece.
                  <br />
                  ⚠️ Requires purchase cost for each item. Selling price calculated automatically at sales time.
                </div>
              </div>
            </label>
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

          {/* Product Selection Card */}
          <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 600 }}>
              Add Product
            </h4>
            
            {/* Product Autocomplete - Full Width */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                🔍 Product Search {loadingProducts && '(Loading...)'}
              </label>
              <ProductAutocomplete
                value={currentItem.productId}
                onChange={(productId, product) => {
                  setCurrentItem({ ...currentItem, productId });
                }}
                disabled={loadingProducts || products.length === 0}
                placeholder="Type to search by name, code, or barcode..."
              />
            </div>

            {/* Quantity and Prices - Responsive Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: formData.autoReceiveStock 
                ? 'repeat(auto-fit, minmax(140px, 1fr))' 
                : 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '15px'
            }}>
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
                  placeholder="Cost per unit"
                />
              </div>

              {formData.autoReceiveStock && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                    Purchase Cost (₹) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentItem.purchaseCost}
                    onChange={(e) => setCurrentItem({ ...currentItem, purchaseCost: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    placeholder="Per piece"
                  />
                </div>
              )}
            </div>

            {/* Add Button */}
            <button
              type="button"
              onClick={handleAddItem}
              style={{
                width: '100%',
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px'
              }}
            >
              + Add Item to Order
            </button>
          </div>

          {orderItems.length > 0 && (
            <div className="table-wrapper" style={{ marginBottom: '20px' }}>
              <table className="table" style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    {formData.autoReceiveStock && (
                      <th>Purchase Cost</th>
                    )}
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
                      {formData.autoReceiveStock && (
                        <td>₹{item.purchaseCost ? parseFloat(item.purchaseCost).toFixed(2) : '-'}</td>
                      )}
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
              {formData.autoReceiveStock && (
                <div style={{ fontSize: '12px', color: '#28a745', marginTop: '10px', padding: '10px', background: '#d5f4e6', borderRadius: '4px' }}>
                  ✓ <strong>{orderItems.reduce((sum, item) => sum + item.quantity, 0)} stock items</strong> will be auto-generated with unique Tag IDs and Barcodes
                </div>
              )}
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

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={submitting || orderItems.length === 0}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '12px 20px',
                background: (submitting || orderItems.length === 0) ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (submitting || orderItems.length === 0) ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: 'clamp(14px, 2vw, 16px)',
              }}
            >
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 'clamp(14px, 2vw, 16px)',
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
