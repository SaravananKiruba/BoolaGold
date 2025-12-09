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
        console.log('🔐 Navigation: Fetching session... [pathname changed]');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏱️ Navigation: Session fetch timeout!');
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
        
        console.log('🔐 Navigation: Response status =', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('🔐 Navigation: Full Session Response =', JSON.stringify(data, null, 2));
          const role = data.data?.user?.role;
          console.log('🔐 Navigation: Extracted Role =', role);
          
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
    console.log('⏳ Navigation: Loading, showing default owner nav...');
  } else if (normalizedRole === 'SUPER_ADMIN') {
    // SUPER ADMIN: Only system navigation
    navSections = superAdminNavSections;
    additionalSections = []; // NO additional sections for super admin
    console.log('🎛️ Navigation: SUPER_ADMIN mode - showing system nav');
  } else if (normalizedRole === 'OWNER') {
    // OWNER: Full shop operations + admin section
    navSections = ownerNavSections;
    additionalSections = [ownerAdminSection];
    console.log('👑 Navigation: OWNER mode - showing full shop nav + admin section');
  } else if (normalizedRole === 'SALES') {
    // SALES: Customer-facing operations only
    navSections = salesNavSections;
    additionalSections = [];
    console.log('🛒 Navigation: SALES mode - showing sales operations only');
  } else if (normalizedRole === 'ACCOUNTS') {
    // ACCOUNTS: Financial operations only
    navSections = accountsNavSections;
    additionalSections = [];
    console.log('💰 Navigation: ACCOUNTS mode - showing financial operations only');
  } else {
    // Unknown role - show minimal navigation
    navSections = [{ title: 'Overview', items: [{ href: '/dashboard', label: 'Dashboard', icon: '📊', desc: 'Metrics' }] }];
    additionalSections = [];
    console.log('⚠️ Navigation: Unknown role - showing minimal nav');
  }
  
  console.log('📋 Navigation Sections:', navSections.length, 'sections with', navSections.flatMap(s => s.items).length, 'items');
  console.log('📋 Full navSections:', JSON.stringify(navSections, null, 2));

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

            {/* Desktop Navigation */}
            <div className="desktop-nav" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
              {(() => {
                const allItems = navSections.flatMap(section => section.items)
                  .concat(additionalSections.flatMap(section => section.items));
                console.log('🔍 Rendering', allItems.length, 'navigation items:', allItems.map(i => i.label));
                return allItems.map((item) => {
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
                });
              })()}
              
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
        /* Hide mobile menu button by default on desktop */
        .mobile-menu-btn {
          display: none;
        }
        
        /* On medium screens, hide nav labels but keep icons */
        @media (max-width: 1200px) {
          .nav-label {
            display: none !important;
          }
        }
        
        /* On small screens, hide desktop nav and show mobile menu button */
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
