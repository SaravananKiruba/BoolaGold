'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check user role from session
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          console.log('🔐 Navigation: Full Session Response =', JSON.stringify(data, null, 2));
          const role = data.data?.user?.role;
          console.log('🔐 Navigation: Extracted Role =', role);
          console.log('🔐 Navigation: Role Type =', typeof role);
          console.log('🔐 Navigation: Is SUPER_ADMIN? =', role === 'SUPER_ADMIN');
          setUserRole(role);
        } else {
          console.error('🔐 Navigation: Session fetch failed with status', response.status);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };
    checkPermissions();
  }, []);

  // Normalize and check role (trim whitespace and ensure uppercase)
  const normalizedRole = userRole?.trim().toUpperCase();
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN';
  const isOwner = normalizedRole === 'OWNER';
  const hasShopConfigPermission = isOwner;
  const hasAdminAccess = isSuperAdmin || isOwner;

  // Debug logging
  useEffect(() => {
    if (userRole) {
      console.log('🔍 DEBUG - Current State:', {
        userRole,
        isSuperAdmin,
        isOwner,
        pathname
      });
    }
  }, [userRole, isSuperAdmin, isOwner, pathname]);

  // FORCE REDIRECT: If Super Admin tries to access shop operational pages, redirect them
  // BUT allow access to /shops (shop management) and /users (user management)
  useEffect(() => {
    if (normalizedRole === 'SUPER_ADMIN') {
      const shopOperationalPages = ['/dashboard', '/customers', '/sales-orders', '/transactions', 
                        '/products', '/stock', '/suppliers', '/purchase-orders', 
                        '/rate-master', '/reports'];
      
      const allowedPages = ['/super-admin', '/shops', '/users'];
      const isAllowed = allowedPages.some(page => pathname.startsWith(page));
      
      console.log('🔐 Super Admin Navigation Check:', {
        pathname,
        isAllowed,
        willBlock: !isAllowed && shopOperationalPages.some(page => pathname.startsWith(page))
      });
      
      // Block only operational pages, NOT /shops or /users
      if (!isAllowed && shopOperationalPages.some(page => pathname.startsWith(page))) {
        console.log('🚫 BLOCKING SUPER ADMIN from shop operational page:', pathname);
        console.log('🔄 FORCE REDIRECTING to /super-admin');
        router.replace('/super-admin');
      }
    }
  }, [normalizedRole, pathname, router]);

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null;
  }

  // Super Admin Navigation - Only system management features
  const superAdminNavSections = [
    {
      title: 'System',
      items: [
        { href: '/super-admin', label: 'Dashboard', icon: '🎛️', desc: 'System Overview' },
        { href: '/shops', label: 'Shops', icon: '🏪', desc: 'Manage All Shops' },
        { href: '/users', label: 'All Users', icon: '👥', desc: 'System Users' },
      ],
    },
  ];

  // Shop User Navigation - Business operations for shop owners and staff
  const shopNavSections = [
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

  // Owner section - only visible to OWNER (not SUPER_ADMIN)
  const ownerSection = {
    title: 'Admin',
    items: [
      { href: '/users', label: 'Users', icon: '👤', desc: 'Manage Shop Users' },
    ],
  };

  // CRITICAL: Determine which navigation to show based on role
  // Super Admin sees ONLY system management, Shop users see business operations
  // If role is not loaded yet, show minimal navigation
  let navSections;
  let additionalSections: any[] = [];
  
  if (!userRole) {
    // Role not loaded yet - show minimal nav
    navSections = [{ title: 'Loading', items: [] }];
  } else if (normalizedRole === 'SUPER_ADMIN') {
    // SUPER ADMIN: Only system navigation
    navSections = superAdminNavSections;
    additionalSections = []; // NO additional sections for super admin
  } else {
    // SHOP USERS: Business navigation + owner section if applicable
    navSections = shopNavSections;
    if (normalizedRole === 'OWNER') {
      additionalSections = [ownerSection];
    }
  }

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
      {/* DEBUG BANNER - Remove after testing */}
      {userRole && (
        <div style={{
          background: isSuperAdmin ? '#fbbf24' : '#3b82f6',
          color: isSuperAdmin ? '#78350f' : 'white',
          padding: '8px 20px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          position: 'sticky',
          top: 0,
          zIndex: 101,
        }}>
          🐛 DEBUG MODE | Raw Role: "{userRole}" | Normalized: "{normalizedRole}" | Is Super Admin: {isSuperAdmin ? 'YES ✅' : 'NO ❌'} | Nav Type: {isSuperAdmin ? 'SUPER_ADMIN_NAV' : 'SHOP_NAV'}
        </div>
      )}
      
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
            <Link href={isSuperAdmin ? "/super-admin" : "/dashboard"} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              {isSuperAdmin && (
                <span style={{ 
                  fontSize: '0.7rem', 
                  background: '#fbbf24', 
                  color: '#78350f', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginLeft: '8px'
                }}>
                  🎛️ SUPER ADMIN
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="desktop-nav" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
              {navSections.flatMap(section => section.items)
                .concat(additionalSections.flatMap(section => section.items))
                .map((item) => {
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
          {[...navSections, ...additionalSections].map((section, idx) => (
            <div key={idx} style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: '8px' }}>
                {section.title}
              </div>
              {section.items.map((item: { href: string; label: string; icon: string; desc: string }) => {
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
