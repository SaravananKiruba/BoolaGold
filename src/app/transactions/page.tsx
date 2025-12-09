'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageGuard } from '@/hooks/usePageGuard';

interface Transaction {
  id: string;
  transactionDate: string;
  transactionType: 'INCOME' | 'EXPENSE' | 'EMI' | 'METAL_PURCHASE' | 'GOLD_SCHEME' | 'ADJUSTMENT';
  amount: number;
  paymentMode: string;
  category: string;
  description: string;
  referenceNumber?: string;
  status: string;
  customer?: { id: string; name: string };
  salesOrder?: { id: string; invoiceNumber: string };
}

interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  incomeCount: number;
  expenseCount: number;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { isAuthorized, isLoading: authLoading } = usePageGuard(['OWNER', 'ACCOUNTS']);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    expenseType: 'SALARY',
    category: 'OPERATIONAL',
    amount: '',
    paymentMode: 'CASH',
    description: '',
    referenceNumber: '',
  });
  const [filters, setFilters] = useState({
    transactionType: '',
    category: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      });

      const response = await fetch(`/api/transactions?${params}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Handle both nested and flat response structures
        const transactions = result.data.data || result.data;
        const meta = result.data.meta || {};
        
        setTransactions(Array.isArray(transactions) ? transactions : []);
        setTotalPages(meta.totalPages || 1);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      );

      const response = await fetch(`/api/transactions/summary?${params}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Transform the API response to match our interface
        const data = result.data;
        setSummary({
          totalIncome: data.income?.totalIncome || 0,
          totalExpense: data.expense?.totalExpense || 0,
          netAmount: data.netIncome || 0,
          incomeCount: data.income?.incomeCount || 0,
          expenseCount: data.expense?.expenseCount || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return '#10b981';
      case 'EXPENSE':
        return '#ef4444';
      case 'METAL_PURCHASE':
        return '#f59e0b';
      case 'EMI':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return '💰';
      case 'EXPENSE':
        return '💸';
      case 'METAL_PURCHASE':
        return '🏆';
      case 'EMI':
        return '📅';
      default:
        return '🔄';
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchTransactions();
      fetchSummary();
    }
  }, [filters, page, isAuthorized]);

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

  return (
    <div className="container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
            💳 Transactions
          </h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Track all income and expense transactions
          </p>
        </div>
        <button
          onClick={() => setShowExpenseModal(true)}
          style={{
            padding: '12px 24px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
      </div>

      {/* Other Expense Modal */}
      {showExpenseModal && (
        <div
          style={{
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
          }}
          onClick={() => setShowExpenseModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>💸 Record Other Expense</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Expense Type *
              </label>
              <select
                value={expenseForm.expenseType}
                onChange={(e) => setExpenseForm({ ...expenseForm, expenseType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="SALARY">Salary</option>
                <option value="RENT">Rent</option>
                <option value="EB">Electricity Bill (EB)</option>
                <option value="WATER">Water Bill</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="TRANSPORT">Transport</option>
                <option value="OFFICE_SUPPLIES">Office Supplies</option>
                <option value="MARKETING">Marketing</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Category *
              </label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="OPERATIONAL">Operational Expense</option>
                <option value="OTHER_EXPENSES">Capital Expense</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Amount *
              </label>
              <input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Payment Mode *
              </label>
              <select
                value={expenseForm.paymentMode}
                onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Description / Remarks *
              </label>
              <textarea
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Enter description or remarks"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Reference Number
              </label>
              <input
                type="text"
                value={expenseForm.referenceNumber}
                onChange={(e) => setExpenseForm({ ...expenseForm, referenceNumber: e.target.value })}
                placeholder="Invoice number, receipt number, etc."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
                    alert('Please enter a valid amount');
                    return;
                  }
                  if (!expenseForm.description) {
                    alert('Please enter description/remarks');
                    return;
                  }

                  fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      transactionType: 'EXPENSE',
                      category: expenseForm.category,
                      amount: Number(expenseForm.amount),
                      paymentMode: expenseForm.paymentMode,
                      description: `${expenseForm.expenseType} - ${expenseForm.description}`,
                      referenceNumber: expenseForm.referenceNumber || undefined,
                      status: 'COMPLETED',
                    }),
                  })
                    .then(res => res.json())
                    .then(result => {
                      if (result.success) {
                        alert('Expense recorded successfully!');
                        setShowExpenseModal(false);
                        setExpenseForm({
                          expenseType: 'SALARY',
                          category: 'OPERATIONAL',
                          amount: '',
                          paymentMode: 'CASH',
                          description: '',
                          referenceNumber: '',
                        });
                        fetchTransactions();
                        fetchSummary();
                      } else {
                        alert('Failed to record expense: ' + (result.error || 'Unknown error'));
                      }
                    })
                    .catch(err => alert('Error: ' + err.message));
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Record Expense
              </button>
              <button
                onClick={() => {
                  setShowExpenseModal(false);
                  setExpenseForm({
                    expenseType: 'SALARY',
                    category: 'OPERATIONAL',
                    amount: '',
                    paymentMode: 'CASH',
                    description: '',
                    referenceNumber: '',
                  });
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */},
            alignItems: 'center',
            gap: '8px',
          }}
        >
          💸 Record Other Expense
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Total Income
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
              ₹{Number(summary.totalIncome).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {summary.incomeCount} transactions
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Total Expense
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>
              ₹{Number(summary.totalExpense).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {summary.expenseCount} transactions
            </div>
          </div>

          <div
            className="card"
            style={{
              borderLeft: `4px solid ${summary.netAmount >= 0 ? '#10b981' : '#ef4444'}`,
            }}
          >
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Net Amount
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: summary.netAmount >= 0 ? '#10b981' : '#ef4444',
              }}
            >
              ₹{Number(summary.netAmount).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {summary.netAmount >= 0 ? 'Profit' : 'Loss'}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Filters</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Transaction Type
            </label>
            <select
              value={filters.transactionType}
              onChange={(e) => {
                setFilters({ ...filters, transactionType: e.target.value });
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="METAL_PURCHASE">Metal Purchase</option>
              <option value="EMI">EMI</option>
              <option value="GOLD_SCHEME">Gold Scheme</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="">All Categories</option>
              <option value="SALES">Sales</option>
              <option value="PURCHASE">Purchase</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="OTHER_EXPENSES">Other Expenses</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>

        <button
          onClick={() => {
            setFilters({
              transactionType: '',
              category: '',
              startDate: '',
              endDate: '',
            });
            setPage(1);
          }}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Transactions List */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
          Transactions ({transactions?.length || 0})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : !transactions || transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No transactions found
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Reference</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Payment</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      style={{
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'white';
                      }}
                      onClick={() => {
                        if (transaction.salesOrder) {
                          router.push(`/sales-orders/${transaction.salesOrder.id}`);
                        }
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        {new Date(transaction.transactionDate).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{getTypeIcon(transaction.transactionType)}</span>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: 'white',
                              background: getTypeColor(transaction.transactionType),
                            }}
                          >
                            {transaction.transactionType}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '14px' }}>{transaction.description}</div>
                        {transaction.customer && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {transaction.customer.name}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {transaction.referenceNumber || '-'}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: transaction.transactionType === 'INCOME' ? '#10b981' : '#ef4444',
                        }}
                      >
                        {transaction.transactionType === 'INCOME' ? '+' : '-'}₹
                        {Number(transaction.amount).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {transaction.paymentMode}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background:
                              transaction.status === 'COMPLETED'
                                ? '#d1fae5'
                                : transaction.status === 'PENDING'
                                ? '#fef3c7'
                                : '#fee2e2',
                            color:
                              transaction.status === 'COMPLETED'
                                ? '#065f46'
                                : transaction.status === 'PENDING'
                                ? '#92400e'
                                : '#991b1b',
                          }}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '20px',
                }}
              >
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: page === 1 ? '#f3f4f6' : 'white',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: '8px 16px' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: page === totalPages ? '#f3f4f6' : 'white',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
