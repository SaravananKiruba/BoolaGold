'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null;
  }

  const navSections = [
    {
      title: 'Overview',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: '📊', desc: 'Metrics' },
      ],
    },
    {
      title: 'Sales',
      items: [
        { href: '/customers', label: 'Customers', icon: '👥', desc: 'Manage' },
        { href: '/sales-orders', label: 'Sales', icon: '🛒', desc: 'Orders' },
        { href: '/transactions', label: 'Transactions', icon: '💳', desc: 'Payments' },
      ],
    },
    {
      title: 'Inventory',
      items: [
        { href: '/products', label: 'Products', icon: '💍', desc: 'Catalog' },
        { href: '/stock', label: 'Stock', icon: '📦', desc: 'Items' },
      ],
    },
    {
      title: 'Procurement',
      items: [
        { href: '/suppliers', label: 'Suppliers', icon: '🏭', desc: 'Vendors' },
        { href: '/purchase-orders', label: 'Purchase', icon: '📋', desc: 'Orders' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { href: '/rate-master', label: 'Rates', icon: '💰', desc: 'Pricing' },
        { href: '/reports', label: 'Reports', icon: '📈', desc: 'Analytics' },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      // Fallback: clear cookies client-side
      document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/login');
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
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
        <div style={{ padding: '12px 20px', maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            {/* Logo */}
            <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
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

            {/* Desktop Navigation */}
            <div className="desktop-nav" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
              {navSections.flatMap(section => section.items).map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.desc}
                    style={{
                      textDecoration: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: isActive ? 'var(--color-primary)' : 'white',
                      background: isActive ? 'white' : 'rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: isActive ? '2px solid var(--color-gold)' : '2px solid transparent',
                      whiteSpace: 'nowrap',
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
                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 14px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🚪</span>
                <span className="nav-label">Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: 'none',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          className="mobile-menu"
          style={{
            position: 'fixed',
            top: '68px',
            left: 0,
            right: 0,
            background: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 99,
            maxHeight: 'calc(100vh - 68px)',
            overflowY: 'auto',
          }}
        >
          {navSections.map((section, idx) => (
            <div key={idx} style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      textDecoration: 'none',
                      color: isActive ? 'var(--color-primary)' : '#333',
                      background: isActive ? '#f0f4ff' : 'transparent',
                      borderRadius: '8px',
                      marginBottom: '4px',
                      borderLeft: isActive ? '4px solid var(--color-primary)' : '4px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: isActive ? 600 : 500 }}>{item.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
          <div style={{ padding: '16px 20px' }}>
            <button
              onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              style={{
                width: '100%',
                padding: '12px',
                background: '#fee',
                border: '2px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>🚪</span>
              Logout
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 1200px) {
          .nav-label {
            display: none !important;
          }
        }
        
        @media (max-width: 968px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
