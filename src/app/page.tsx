import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 style={{ marginBottom: '10px' }}>Jewelry Store Management System</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>
        Production-ready Next.js application for jewelry store operations
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>📊 Dashboard</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Business overview, key metrics, and performance indicators
          </p>
          <Link href="/dashboard" className="button" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '10px' }}>
            View Dashboard
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>👥 Customer Management</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Register customers, manage profiles, track purchase history
          </p>
          <Link href="/customers" className="button" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '10px' }}>
            View Customers
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>💍 Product Management</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Manage jewelry products, calculate prices, track inventory
          </p>
          <Link href="/products" className="button" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '10px' }}>
            View Products
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>🛒 Sales Orders</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Create invoices, process sales, manage payments
          </p>
          <Link href="/sales-orders" className="button" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '10px' }}>
            View Orders
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>📦 Stock Management</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Track individual items, manage FIFO, monitor availability
          </p>
          <Link href="/stock" className="button" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '10px' }}>
            View Stock
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>🏭 Suppliers</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Manage supplier relationships and vendor information
          </p>
          <Link href="/suppliers" className="button" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '10px' }}>
            View Suppliers
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>📋 Purchase Orders</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Create purchase orders, receive stock, track payments
          </p>
          <Link href="/purchase-orders" className="button" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '10px' }}>
            View Purchase Orders
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>📊 Reports</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Sales reports, inventory analytics, financial statements
          </p>
          <Link href="/reports" className="button" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '10px' }}>
            View Reports
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: '40px', background: '#f8f9fa' }}>
        <h3 style={{ marginTop: 0 }}>🚀 Quick Start</h3>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Configure your database in <code>.env</code> file</li>
          <li>Run <code>npm run db:push</code> to sync database schema</li>
          <li>Run <code>npm run db:seed</code> to populate sample data</li>
          <li>Access API endpoints at <code>/api/*</code></li>
        </ol>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
        <p>Built with Next.js 14 • TypeScript • Prisma • MySQL</p>
      </div>
    </div>
  );
}
