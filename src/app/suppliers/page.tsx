'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/utils/toast';
import Link from 'next/link';

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  isActive: boolean;
  registrationDate: string;
}

interface SupplierDetails extends Supplier {
  stats: {
    totalPurchaseOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalProductsSupplied: number;
    totalAmountPurchased: number;
    totalAmountPaid: number;
    outstandingAmount: number;
  };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDetails | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // Search and Filter States
  const [searchName, setSearchName] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchSuppliers();
  }, [searchName, filterCity, filterStatus, currentPage]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('pageSize', '20');
      
      if (searchName) params.append('name', searchName);
      if (filterCity) params.append('city', filterCity);
      if (filterStatus) params.append('isActive', filterStatus);
      
      const response = await fetch(`/api/suppliers?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setSuppliers(result.data);
        if (result.meta) {
          setTotalPages(result.meta.totalPages);
          setTotalCount(result.meta.totalCount);
        }
      } else {
        setError(result.error?.message || 'Failed to fetch suppliers');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierDetails = async (supplierId: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`);
      const result = await response.json();

      if (result.success) {
        setSelectedSupplier(result.data);
        setShowDetailModal(true);
      }
    } catch (err: any) {
      toast.error('Failed to load supplier details');
    }
  };

  const handleResetFilters = () => {
    setSearchName('');
    setFilterCity('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setShowFormModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowFormModal(true);
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Supplier Management</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Register and manage supplier records</p>
        </div>
        <Link href="/" style={{ textDecoration: 'none', padding: '10px 20px', background: '#666', color: 'white', borderRadius: '4px' }}>
          ← Back to Home
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Search & Filters</h3>
        
        <div className="responsive-grid responsive-grid-3">
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Search by Name
            </label>
            <input
              type="text"
              placeholder="Enter supplier name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              City
            </label>
            <input
              type="text"
              placeholder="Filter by city..."
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
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

      {/* Supplier List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Suppliers ({totalCount})</h2>
          <button className="button" onClick={handleAddSupplier}>+ Add Supplier</button>
        </div>

        {loading && <p>Loading suppliers...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!loading && !error && suppliers.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
            No suppliers found. {searchName || filterCity || filterStatus ? 'Try adjusting your filters.' : 'Create your first supplier to get started.'}
          </p>
        )}

        {!loading && !error && suppliers.length > 0 && (
          <>
            <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td style={{ fontWeight: 500 }}>{supplier.name}</td>
                    <td>{supplier.contactPerson || '-'}</td>
                    <td>{supplier.phone}</td>
                    <td>{supplier.email || '-'}</td>
                    <td>{supplier.city || '-'}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        background: supplier.isActive ? '#d5f4e6' : '#ffcdd2', 
                        color: supplier.isActive ? '#00b894' : '#d32f2f',
                        borderRadius: '4px', 
                        fontSize: '12px' 
                      }}>
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(supplier.registrationDate).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => fetchSupplierDetails(supplier.id)}
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
                        onClick={() => handleEditSupplier(supplier)}
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
            </div>

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

      {/* Supplier Detail Modal */}
      {showDetailModal && selectedSupplier && (
        <SupplierDetailModal
          supplier={selectedSupplier}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Supplier Form Modal */}
      {showFormModal && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => {
            setShowFormModal(false);
            fetchSuppliers();
          }}
        />
      )}
    </div>
  );
}

// Supplier Detail Modal Component
function SupplierDetailModal({ supplier, onClose }: { supplier: SupplierDetails; onClose: () => void }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>Supplier Details</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        {/* Basic Info */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
            Basic Information
          </h3>
          <div className="responsive-grid responsive-grid-2">
            <div>
              <strong>Supplier Name:</strong> {supplier.name}
            </div>
            <div>
              <strong>Contact Person:</strong> {supplier.contactPerson || 'N/A'}
            </div>
            <div>
              <strong>Phone:</strong> {supplier.phone}
            </div>
            <div>
              <strong>Email:</strong> {supplier.email || 'N/A'}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <strong>Address:</strong> {supplier.address || 'N/A'}
            </div>
            <div>
              <strong>City:</strong> {supplier.city || 'N/A'}
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <span style={{
                padding: '4px 8px',
                background: supplier.isActive ? '#d5f4e6' : '#ffcdd2',
                color: supplier.isActive ? '#00b894' : '#d32f2f',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                {supplier.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <strong>Registered:</strong> {new Date(supplier.registrationDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px', marginBottom: '15px' }}>
            Purchase Statistics
          </h3>
          <div className="responsive-grid responsive-grid-3">
            <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1565c0' }}>
                {supplier.stats.totalPurchaseOrders}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Orders</div>
            </div>
            <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                {supplier.stats.completedOrders}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Completed</div>
            </div>
            <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e65100' }}>
                {supplier.stats.pendingOrders}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Pending</div>
            </div>
            <div style={{ background: '#f3e5f5', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7b1fa2' }}>
                {supplier.stats.totalProductsSupplied}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Products</div>
            </div>
            <div style={{ background: '#e1f5fe', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#01579b' }}>
                ₹{supplier.stats.totalAmountPurchased.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Purchased</div>
            </div>
            <div style={{ background: '#ffebee', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#c62828' }}>
                ₹{supplier.stats.outstandingAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Outstanding</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href={`/suppliers/${supplier.id}/products`}
            style={{
              flex: 1,
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              textAlign: 'center',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            View Products
          </Link>
          <Link
            href={`/suppliers/${supplier.id}/purchase-orders`}
            style={{
              flex: 1,
              padding: '10px 20px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              textAlign: 'center',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            View Purchase Orders
          </Link>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '15px',
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

// Supplier Form Modal Component
function SupplierFormModal({ supplier, onClose, onSuccess }: {
  supplier: Supplier | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    isActive: supplier?.isActive ?? true,
  });

  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const url = supplier ? `/api/suppliers/${supplier.id}` : '/api/suppliers';
      const method = supplier ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(supplier ? 'Supplier updated successfully!' : 'Supplier created successfully!');
        onSuccess();
      } else {
        toast.error(result.error?.message || 'Failed to save supplier');
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Supplier Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Contact Person Name
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Phone Number <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="tel"
                required
                pattern="[0-9]{10,15}"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="10-15 digits"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                Physical Address
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
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Active Supplier</span>
              </label>
            </div>
          </div>

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
              {submitting ? 'Saving...' : (supplier ? 'Update Supplier' : 'Create Supplier')}
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
