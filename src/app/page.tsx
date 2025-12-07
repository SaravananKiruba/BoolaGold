import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard
  redirect('/dashboard');

      {/* Main Feature Cards */}
      <div className="grid-3" style={{ marginBottom: '48px' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
            <h3>Dashboard</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Business overview, key metrics, and performance indicators
            </p>
            <span className="button" style={{ display: 'inline-block' }}>View Dashboard →</span>
          </div>
        </Link>

        <Link href="/customers" style={{ textDecoration: 'none' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👥</div>
            <h3>Customer Management</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Register customers, manage profiles, track purchase history
            </p>
            <span className="button" style={{ display: 'inline-block' }}>View Customers →</span>
          </div>
        </Link>

        <Link href="/products" style={{ textDecoration: 'none' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💍</div>
            <h3>Product Management</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            Manage jewelry products, calculate prices, track inventory
            </p>
            <span className="button" style={{ display: 'inline-block' }}>View Products →</span>
          </div>
        </Link>

        <Link href="/sales-orders" style={{ textDecoration: 'none' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛒</div>
            <h3>Sales Orders</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Create invoices, process sales, manage payments
            </p>
            <span className="button" style={{ display: 'inline-block' }}>View Orders →</span>
          </div>
        </Link>

        <Link href="/stock" style={{ textDecoration: 'none' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
            <h3>Stock Management</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Track individual items, manage FIFO, monitor availability
            </p>
            <span className="button" style={{ display: 'inline-block' }}>View Stock →</span>
          </div>
        </Link>

        <Link href="/suppliers" style={{ textDecoration: 'none' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏭</div>
            <h3>Suppliers</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Manage supplier relationships and vendor information
            </p>
            <span className="button" style={{ display: 'inline-block' }}>View Suppliers →</span>
          </div>
        </Link>

        <Link href="/purchase-orders" style={{ textDecoration: 'none' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
            <h3>Purchase Orders</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Create purchase orders, receive stock, track payments
            </p>
            <span className="button" style={{ display: 'inline-block' }}>View Purchase Orders →</span>
          </div>
        </Link>

        <Link href="/rate-master" style={{ textDecoration: 'none' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💰</div>
            <h3>Rate Master</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Manage metal rates, purity standards, and pricing rules
            </p>
            <span className="button button-gold" style={{ display: 'inline-block' }}>View Rates →</span>
          </div>
        </Link>

        <Link href="/reports" style={{ textDecoration: 'none' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📈</div>
            <h3>Reports & Analytics</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              Sales reports, inventory analytics, financial statements
            </p>
            <span className="button" style={{ display: 'inline-block' }}>View Reports →</span>
          </div>
        </Link>
      </div>

      {/* Quick Start Guide */}
      <div className="alert alert-info" style={{ marginBottom: '32px' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🚀</span> Quick Start Guide
        </h3>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.8', marginBottom: 0 }}>
          <li>Configure your database in <code>.env</code> file</li>
          <li>Run <code>npm run db:push</code> to sync database schema</li>
          <li>Run <code>npm run db:seed</code> to populate sample data</li>
          <li>Access API endpoints at <code>/api/*</code></li>
        </ol>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', paddingTop: '32px', borderTop: '2px solid var(--color-border)' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
          <strong>Built with Next.js 14 • TypeScript • Prisma • MySQL</strong>
        </p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
          © 2025 BoolaGold. All rights reserved.
        </p>
      </div>
    </div>
  );
}
