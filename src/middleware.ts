import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

// Routes that don't require authentication
const publicRoutes = ['/login'];

// Routes restricted to SUPER_ADMIN only (SaaS Provider)
const superAdminRoutes = ['/shops', '/super-admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
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

  // 🔒 SECURITY: Super Admin route protection & Shop Deactivation Check
  // Note: Basic authentication check here. Full role and shop status verification 
  // happens in API routes using validateSession() which checks:
  // 1. Valid session
  // 2. User role permissions
  // 3. Shop activation status (blocks deactivated shops)
  
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
