'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/customers', label: 'Customers', icon: '👥' },
    { href: '/products', label: 'Products', icon: '💍' },
    { href: '/sales-orders', label: 'Sales', icon: '🛒' },
    { href: '/stock', label: 'Stock', icon: '📦' },
    { href: '/suppliers', label: 'Suppliers', icon: '🏭' },
    { href: '/purchase-orders', label: 'Purchase', icon: '📋' },
    { href: '/rate-master', label: 'Rates', icon: '💰' },
    { href: '/reports', label: 'Reports', icon: '📈' },
  ];

  return (
    <nav
      style={{
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
        borderBottom: '4px solid var(--color-gold)',
        boxShadow: '0 4px 20px var(--color-shadow)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="container" style={{ padding: '12px clamp(16px, 3vw, 40px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '2rem' }}>💎</span>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              BoolaGold
            </span>
          </Link>

          {/* Navigation Links */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {navItems.slice(1).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: isActive ? 'var(--color-primary)' : 'white',
                    background: isActive
                      ? 'white'
                      : 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    transition: 'var(--transition)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: isActive ? '2px solid var(--color-gold)' : '2px solid transparent',
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <span>{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .nav-label {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
