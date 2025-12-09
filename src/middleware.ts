import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifyToken } from '@/lib/auth';

// Routes that don't require authentication
const publicRoutes = ['/login'];

// Debug routes - accessible to all authenticated users
const debugRoutes = ['/debug-auth'];

// Role-based route access control
const roleRoutes = {
  SUPER_ADMIN: ['/super-admin', '/shops', '/users'],
  OWNER: ['/dashboard', '/customers', '/sales-orders', '/transactions', '/products', '/stock', 
          '/suppliers', '/purchase-orders', '/rate-master', '/reports', '/users'],
  SALES: ['/dashboard', '/customers', '/sales-orders', '/products', '/stock', '/rate-master', '/reports'],
  ACCOUNTS: ['/dashboard', '/transactions', '/suppliers', '/purchase-orders', '/rate-master', '/reports'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow debug routes for authenticated users
  if (debugRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if user is authenticated using session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Redirect to login if not authenticated
  if (!sessionToken && pathname !== '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Verify token and check role-based access
  if (sessionToken) {
    try {
      const session = await verifyToken(sessionToken);
      
      if (!session) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }

      const userRole = session.role;
      const allowedRoutes = roleRoutes[userRole as keyof typeof roleRoutes] || [];

      console.log(`🔐 Middleware Check: ${userRole} accessing ${pathname}`);
      console.log(`📋 Allowed routes for ${userRole}:`, allowedRoutes);

      // Check if the current pathname is allowed for this user's role
      const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));
      console.log(`✅ Has access:`, hasAccess);
      
      // If the user doesn't have access to this route, check if it's a protected route
      if (!hasAccess) {
        // Check if this route is protected (exists in any role's routes)
        const isProtectedRoute = Object.values(roleRoutes)
          .flat()
          .some(route => pathname.startsWith(route));
        
        // Only block if it's a protected route
        if (isProtectedRoute) {
          console.log(`🚫 BLOCKED: ${userRole} attempted to access ${pathname}`);
          const url = request.nextUrl.clone();
          
          // Redirect to role's default page
          if (userRole === 'SUPER_ADMIN') {
            url.pathname = '/super-admin';
          } else if (userRole === 'SALES') {
            url.pathname = '/dashboard';
          } else if (userRole === 'ACCOUNTS') {
            url.pathname = '/transactions';
          } else {
            url.pathname = '/dashboard';
          }
          
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
