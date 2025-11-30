'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  dateOfBirth?: string;
  anniversaryDate?: string;
  customerType: string;
  isActive: boolean;
  registrationDate: string;
  _count?: {
    salesOrders: number;
  };
}

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  dateOfBirth?: string;
  anniversary?: string;
}

interface CustomerDetails extends Customer {
  familyMembers: FamilyMember[];
  statistics?: {
    totalOrders: number;
    totalPurchases: number;
    pendingAmount: number;
  };
  salesOrders?: Array<{
    id: string;
    invoiceNumber: string;
    orderDate: string;
    finalAmount: number;
    status: string;
    lines: Array<{
      stockItem: {
        product: {
          name: string;
        };
      };
    }>;
  }>;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, filterType, filterStatus, startDate, endDate, currentPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('pageSize', '20');
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterType) params.append('customerType', filterType);
      if (filterStatus) params.append('isActive', filterStatus);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/customers?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data);
        if (result.meta) {
          setTotalPages(result.meta.totalPages);
          setTotalCount(result.meta.totalCount);
        }
      } else {
        setError(result.error?.message || 'Failed to fetch customers');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      const result = await response.json();

      if (result.success) {
        setSelectedCustomer(result.data);
        setShowDetailModal(true);
      }
    } catch (err: any) {
      alert('Failed to load customer details');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowFormModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowFormModal(true);
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Customer Management</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Register and manage customer records</p>
        </div>
        <Link href="/" style={{ textDecoration: 'none', padding: '10px 20px', background: '#666', color: 'white', borderRadius: '4px' }}>
          ← Back to Home
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Search & Filters</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Search by Name/Phone
            </label>
            <input
              type="text"
              placeholder="Enter name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Customer Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">All Types</option>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Registration From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Registration To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={handleResetFilters}
              style={{
                width: '100%',
                padding: '8px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Customers ({totalCount})</h2>
          <button className="button" onClick={handleAddCustomer}>+ Add Customer</button>
        </div>

        {loading && <p>Loading customers...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!loading && !error && customers.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
            No customers found. {searchTerm || filterType || filterStatus ? 'Try adjusting your filters.' : 'Create your first customer to get started.'}
          </p>
        )}

        {!loading && !error && customers.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Total Orders</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 500 }}>{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || '-'}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        background: customer.customerType === 'VIP' ? '#ffeaa7' : customer.customerType === 'WHOLESALE' ? '#a29bfe' : '#dfe6e9', 
                        borderRadius: '4px', 
                        fontSize: '12px' 
                      }}>
                        {customer.customerType}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        background: customer.isActive ? '#d5f4e6' : '#ffcdd2', 
                        color: customer.isActive ? '#00b894' : '#d32f2f',
                        borderRadius: '4px', 
                        fontSize: '12px' 
                      }}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{customer._count?.salesOrders || 0}</td>
                    <td>{new Date(customer.registrationDate).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => fetchCustomerDetails(customer.id)}
                        style={{ 
                          padding: '4px 12px', 
                          background: 'transparent', 
                          border: '1px solid #0070f3', 
                          color: '#0070f3', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginRight: '5px'
                        }}>
                        View
                      </button>
                      <button 
                        onClick={() => handleEditCustomer(customer)}
                        style={{ 
                          padding: '4px 12px', 
                          background: 'transparent', 
                          border: '1px solid #28a745', 
                          color: '#28a745', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === 1 ? '#f5f5f5' : '#0070f3',
                    color: currentPage === 1 ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === totalPages ? '#f5f5f5' : '#0070f3',
                    color: currentPage === totalPages ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Customer Form Modal */}
      {showFormModal && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => {
            setShowFormModal(false);
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
}

// Customer Detail Modal Component
function CustomerDetailModal({ customer, onClose }: { customer: CustomerDetails; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Customer Details</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
          }}>×</button>
        </div>

        {/* Basic Info */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
            Basic Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <strong>Name:</strong> {customer.name}
            </div>
            <div>
              <strong>Phone:</strong> {customer.phone}
            </div>
            <div>
              <strong>Email:</strong> {customer.email || 'N/A'}
            </div>
            <div>
              <strong>WhatsApp:</strong> {customer.whatsapp || 'N/A'}
            </div>
            <div>
              <strong>Customer Type:</strong>{' '}
              <span style={{
                padding: '4px 8px',
                background: customer.customerType === 'VIP' ? '#ffeaa7' : '#dfe6e9',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                {customer.customerType}
              </span>
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <span style={{
                padding: '4px 8px',
                background: customer.isActive ? '#d5f4e6' : '#ffcdd2',
                color: customer.isActive ? '#00b894' : '#d32f2f',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <strong>Date of Birth:</strong> {customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : 'N/A'}
            </div>
            <div>
              <strong>Anniversary:</strong> {customer.anniversaryDate ? new Date(customer.anniversaryDate).toLocaleDateString() : 'N/A'}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <strong>Address:</strong> {customer.address || 'N/A'}
            </div>
            <div>
              <strong>City:</strong> {customer.city || 'N/A'}
            </div>
            <div>
              <strong>Registered:</strong> {new Date(customer.registrationDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Statistics */}
        {customer.statistics && (
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
              Purchase Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                  {customer.statistics.totalOrders}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Orders</div>
              </div>
              <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1565c0' }}>
                  ₹{customer.statistics.totalPurchases.toLocaleString()}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Purchases</div>
              </div>
              <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e65100' }}>
                  ₹{customer.statistics.pendingAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Pending Amount</div>
              </div>
            </div>
          </div>
        )}

        {/* Family Members */}
        {customer.familyMembers && customer.familyMembers.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
              Family Members
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Relation</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Date of Birth</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Anniversary</th>
                </tr>
              </thead>
              <tbody>
                {customer.familyMembers.map((member) => (
                  <tr key={member.id}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{member.name}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{member.relation}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {member.anniversary ? new Date(member.anniversary).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Purchase History */}
        {customer.salesOrders && customer.salesOrders.length > 0 && (
          <div>
            <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
              Recent Purchase History
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Invoice</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Date</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Items</th>
                  <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Amount</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {customer.salesOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{order.invoiceNumber}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {order.lines.map(line => line.stockItem.product.name).join(', ')}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                      ₹{order.finalAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <span style={{
                        padding: '4px 8px',
                        background: order.status === 'COMPLETED' ? '#d5f4e6' : '#fff3e0',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Customer Form Modal Component
function CustomerFormModal({ customer, onClose, onSuccess }: {
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    whatsapp: customer?.whatsapp || '',
    address: customer?.address || '',
    city: customer?.city || '',
    dateOfBirth: customer?.dateOfBirth?.split('T')[0] || '',
    anniversaryDate: customer?.anniversaryDate?.split('T')[0] || '',
    customerType: customer?.customerType || 'RETAIL',
    isActive: customer?.isActive ?? true,
  });

  const [familyMembers, setFamilyMembers] = useState<Array<{
    name: string;
    relation: string;
    dateOfBirth: string;
    anniversary: string;
  }>>([]);

  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        familyMembers: familyMembers.filter(m => m.name.trim() !== ''),
      };

      const url = customer ? `/api/customers/${customer.id}` : '/api/customers';
      const method = customer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert(customer ? 'Customer updated successfully!' : 'Customer created successfully!');
        onSuccess();
      } else {
        if (result.error?.errors) {
          const errorMap: any = {};
          result.error.errors.forEach((err: any) => {
            errorMap[err.path?.[0] || 'general'] = err.message;
          });
          setErrors(errorMap);
        } else {
          alert(result.error?.message || 'Failed to save customer');
        }
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { name: '', relation: '', dateOfBirth: '', anniversary: '' }]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
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
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
            Basic Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Customer Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              {errors.name && <span style={{ color: 'red', fontSize: '12px' }}>{errors.name}</span>}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Phone Number <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="10 digits"
              />
              {errors.phone && <span style={{ color: 'red', fontSize: '12px' }}>{errors.phone}</span>}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                WhatsApp Number
              </label>
              <input
                type="tel"
                pattern="[0-9]{10}"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="10 digits"
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              {errors.email && <span style={{ color: 'red', fontSize: '12px' }}>{errors.email}</span>}
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Customer Type
              </label>
              <select
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="VIP">VIP</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Anniversary Date
              </label>
              <input
                type="date"
                value={formData.anniversaryDate}
                onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', marginTop: '28px' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Active Customer</span>
              </label>
            </div>
          </div>

          {/* Family Members */}
          {!customer && (
            <>
              <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
                Family Members (Optional)
              </h3>

              {familyMembers.map((member, index) => (
                <div key={index} style={{
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '15px',
                  marginBottom: '15px',
                  position: 'relative',
                }}>
                  <button
                    type="button"
                    onClick={() => removeFamilyMember(index)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Remove
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => {
                          const updated = [...familyMembers];
                          updated[index].name = e.target.value;
                          setFamilyMembers(updated);
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                        Relation
                      </label>
                      <input
                        type="text"
                        value={member.relation}
                        onChange={(e) => {
                          const updated = [...familyMembers];
                          updated[index].relation = e.target.value;
                          setFamilyMembers(updated);
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        placeholder="e.g., Spouse, Child, Parent"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={member.dateOfBirth}
                        onChange={(e) => {
                          const updated = [...familyMembers];
                          updated[index].dateOfBirth = e.target.value;
                          setFamilyMembers(updated);
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                        Anniversary
                      </label>
                      <input
                        type="date"
                        value={member.anniversary}
                        onChange={(e) => {
                          const updated = [...familyMembers];
                          updated[index].anniversary = e.target.value;
                          setFamilyMembers(updated);
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addFamilyMember}
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                }}
              >
                + Add Family Member
              </button>
            </>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '10px 20px',
                background: submitting ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              {submitting ? 'Saving...' : (customer ? 'Update Customer' : 'Create Customer')}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 20px',
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
