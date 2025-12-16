'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check user role from session - RE-FETCH on every pathname change
  useEffect(() => {
    const checkPermissions = async () => {
      setIsLoading(true);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 3000); // 3 second timeout
        
        const response = await fetch('/api/auth/session', {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const role = data.data?.user?.role;
          
          if (role) {
            setUserRole(role);
          } else {
            console.warn('⚠️ Navigation: No role in response, using fallback');
            setUserRole('OWNER');
          }
        } else {
          console.error('🔐 Navigation: Session fetch failed with status', response.status);
          setUserRole('OWNER'); // Default fallback
        }
      } catch (error: any) {
        console.error('❌ Error checking permissions:', error.message);
        setUserRole('OWNER'); // Default fallback
      } finally {
        setIsLoading(false);
      }
    };
    checkPermissions();
  }, [pathname]); // Re-fetch whenever pathname changes!

  // Normalize and check role (trim whitespace and ensure uppercase)
  const normalizedRole = userRole?.trim().toUpperCase();
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN';
  const isOwner = normalizedRole === 'OWNER';
  const hasShopConfigPermission = isOwner;
  const hasAdminAccess = isSuperAdmin || isOwner;



  // FORCE REDIRECT: If Super Admin tries to access shop operational pages, redirect them
  // BUT allow access to /shops (shop management) and /users (user management)
  useEffect(() => {
    if (normalizedRole === 'SUPER_ADMIN') {
      const shopOperationalPages = ['/dashboard', '/customers', '/sales-orders', '/transactions', 
                        '/products', '/stock', '/suppliers', '/purchase-orders', 
                        '/rate-master', '/reports'];
      
      const allowedPages = ['/super-admin', '/shops', '/users'];
      const isAllowed = allowedPages.some(page => pathname.startsWith(page));
      
      // Block only operational pages, NOT /shops or /users
      if (!isAllowed && shopOperationalPages.some(page => pathname.startsWith(page))) {
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
    {
      title: 'Business',
      items: [
        { href: '/super-admin/subscriptions', label: 'Subscriptions', icon: '📊', desc: 'Manage Subscriptions' },
      ],
    },
  ];

  // SALES Navigation - Customer-facing operations
  const salesNavSections = [
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
      title: 'Settings',
      items: [
        { href: '/rate-master', label: 'Rates', icon: '💰', desc: 'View Pricing' },
        { href: '/reports', label: 'Reports', icon: '📈', desc: 'Sales Reports' },
      ],
    },
  ];

  // ACCOUNTS Navigation - Financial operations
  const accountsNavSections = [
    {
      title: 'Overview',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: '📊', desc: 'Metrics' },
      ],
    },
    {
      title: 'Financial',
      items: [
        { href: '/transactions', label: 'Transactions', icon: '💳', desc: 'Payments' },
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
        { href: '/reports', label: 'Reports', icon: '📈', desc: 'Financial Reports' },
      ],
    },
  ];

  // OWNER Navigation - Full shop operations
  const ownerNavSections = [
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

  // Owner Admin section - only visible to OWNER
  const ownerAdminSection = {
    title: 'Admin',
    items: [
      { href: '/users', label: 'Users', icon: '👤', desc: 'Manage Shop Users' },
      { href: '/subscription', label: 'Subscription', icon: '💳', desc: 'Payments & Billing' },
    ],
  };

  // CRITICAL: Determine which navigation to show based on role
  // Super Admin sees ONLY system management, Shop users see role-specific operations
  let navSections;
  let additionalSections: any[] = [];
  
  if (!userRole || isLoading) {
    // Role not loaded yet - show OWNER navigation as default while loading
    navSections = ownerNavSections;
    additionalSections = [ownerAdminSection];
  } else if (normalizedRole === 'SUPER_ADMIN') {
    // SUPER ADMIN: Only system navigation
    navSections = superAdminNavSections;
    additionalSections = [];
  } else if (normalizedRole === 'OWNER') {
    // OWNER: Full shop operations + admin section
    navSections = ownerNavSections;
    additionalSections = [ownerAdminSection];
  } else if (normalizedRole === 'SALES') {
    // SALES: Customer-facing operations only
    navSections = salesNavSections;
    additionalSections = [];
  } else if (normalizedRole === 'ACCOUNTS') {
    // ACCOUNTS: Financial operations only
    navSections = accountsNavSections;
    additionalSections = [];
  } else {
    // Unknown role - show minimal navigation
    navSections = [{ title: 'Overview', items: [{ href: '/dashboard', label: 'Dashboard', icon: '📊', desc: 'Metrics' }] }];
    additionalSections = [];
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
      {/* DEBUG BANNER */}
      <div style={{
        background: isLoading ? '#f97316' : !userRole ? '#ef4444' : isSuperAdmin ? '#fbbf24' : isOwner ? '#22c55e' : normalizedRole === 'SALES' ? '#3b82f6' : normalizedRole === 'ACCOUNTS' ? '#8b5cf6' : '#6b7280',
        color: isLoading ? 'white' : !userRole ? 'white' : isSuperAdmin ? '#78350f' : 'white',
        padding: '8px 20px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        position: 'sticky',
        top: 0,
        zIndex: 101,
      }}>
        {isLoading ? '⏳ Loading Role... (showing default menu)' : !userRole ? '⚠️ No Role Detected' : `✅ RBAC ACTIVE | Role: ${userRole} | Menu Items: ${navSections.flatMap(s => s.items).length + additionalSections.flatMap(s => s.items).length}`}
        {!isLoading && normalizedRole === 'SUPER_ADMIN' && ' | System Admin 🎛️'}
        {!isLoading && normalizedRole === 'OWNER' && ' | Full Access 👑'}
        {!isLoading && normalizedRole === 'SALES' && ' | Sales Only 🛒'}
        {!isLoading && normalizedRole === 'ACCOUNTS' && ' | Finance Only 💰'}
      </div>
      
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
              {isOwner && (
                <span style={{ 
                  fontSize: '0.7rem', 
                  background: '#22c55e', 
                  color: '#14532d', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginLeft: '8px'
                }}>
                  👑 OWNER
                </span>
              )}
              {normalizedRole === 'SALES' && (
                <span style={{ 
                  fontSize: '0.7rem', 
                  background: '#3b82f6', 
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginLeft: '8px'
                }}>
                  🛒 SALES
                </span>
              )}
              {normalizedRole === 'ACCOUNTS' && (
                <span style={{ 
                  fontSize: '0.7rem', 
                  background: '#8b5cf6', 
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginLeft: '8px'
                }}>
                  💰 ACCOUNTS
                </span>
              )}
            </Link>

            {/* Desktop Navigation - Enhanced with Grouping (>1200px) */}
            <div className="desktop-nav" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap', flex: 1, overflow: 'auto' }}>
              {[...navSections, ...additionalSections].map((section, sectionIdx) => (
                <div key={sectionIdx} className="nav-group" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {/* Section Separator */}
                  {sectionIdx > 0 && (
                    <div style={{ 
                      width: '1px', 
                      height: '20px', 
                      background: 'rgba(255,255,255,0.3)', 
                      margin: '0 8px' 
                    }} />
                  )}
                  
                  {/* Section Items */}
                  {section.items.map((item: any) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={`${section.title}: ${item.desc}`}
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
                </div>
              ))}
            </div>
            
            {/* Logout Button - Always visible on desktop and tablet */}
            <button
              className="desktop-logout-btn"
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
                flexShrink: 0,
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
              <span className="logout-label">Logout</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
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
        /* Default styles - show desktop nav by default */
        .desktop-nav {
          display: flex !important;
          flex-wrap: nowrap !important;
        }
        
        .desktop-logout-btn {
          display: inline-flex !important;
        }
        
        .mobile-menu-btn {
          display: none;
        }
        
        /* DESKTOP (>1200px): Full horizontal nav with grouping and labels */
        @media (min-width: 1201px) {
          .desktop-nav {
            display: flex !important;
            flex-wrap: nowrap !important;
          }
          .desktop-logout-btn {
            display: inline-flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
          .nav-label, .logout-label {
            display: inline !important;
          }
        }
        
        /* TABLET (768px - 1200px): Hamburger menu like mobile */
        @media (min-width: 768px) and (max-width: 1200px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-logout-btn {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
        
        /* MOBILE (<768px): Hamburger menu */
        @media (max-width: 767px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-logout-btn {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
        
        /* Scrollbar styling for horizontal nav overflow */
        .desktop-nav::-webkit-scrollbar {
          height: 4px;
        }
        .desktop-nav::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
        }
        .desktop-nav::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
        }
      `}</style>
    </>
  );
}
