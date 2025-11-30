// Purchase Orders Page

'use client';

import { useState, useEffect } from 'react';

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

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
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
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);

      const response = await fetch(`/api/purchase-orders?${params}`);
      const result = await response.json();

      if (result.success) {
        setPurchaseOrders(result.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Purchase Orders</h1>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border rounded px-3 py-2"
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
            <label className="block text-sm font-medium mb-1">Payment Status</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="">All Payment Status</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Orders List */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.supplier.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                      order.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ₹{Number(order.totalAmount).toLocaleString()}
                    {order.paidAmount > 0 && (
                      <div className="text-xs text-gray-500">
                        Paid: ₹{Number(order.paidAmount).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                      View
                    </button>
                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <button className="text-green-600 hover:text-green-800">
                        Receive Stock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {purchaseOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No purchase orders found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
