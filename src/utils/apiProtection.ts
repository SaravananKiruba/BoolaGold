/**
 * 🛡️ Multi-Tenant API Protection Layer
 * 
 * SECURITY FEATURES:
 * - JWT validation (authentication)
 * - Shop activation check (subscription enforcement)
 * - Role-based permissions (authorization)
 * - Rate limiting (abuse prevention)
 * - Tenant isolation verification
 * 
 * For 300+ shops: Every API must use protectRoute() or protectRouteWithPermission()
 */

import { NextResponse, NextRequest } from 'next/server';
import { validateSession, SessionPayload, hasPermission } from '@/lib/auth';
import { createErrorResponse } from '@/utils/response';
import { checkShopRateLimit, createRateLimitHeaders } from '@/utils/rateLimiter';

/**
 * 🔒 Protect API route with multi-tenant security checks
 * 
 * Validation Order:
 * 1. Authentication (JWT token)
 * 2. Shop activation (subscription valid)
 * 3. Rate limiting (per shop)
 * 4. Returns session if valid
 * 
 * Usage in API routes:
 * const result = await protectRoute(request);
 * if (result instanceof NextResponse) return result;
 * const session = result;
 */
export async function protectRoute(request?: NextRequest): Promise<SessionPayload | NextResponse | Response> {
  const { session, isValid, message } = await validateSession();
  
  if (!isValid) {
    return createErrorResponse(message || 'Unauthorized', 403);
  }

  // Rate limiting (only for non-SUPER_ADMIN)
  if (session!.role !== 'SUPER_ADMIN' && session!.shopId) {
    const rateLimit = checkShopRateLimit(session!.shopId);
    if (!rateLimit.allowed) {
      const response = createErrorResponse(
        'Rate limit exceeded. Please try again later.',
        429
      );
      Object.entries(createRateLimitHeaders(rateLimit)).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
  }
  
  return session!;
}

/**
 * 🔒 Protect API route with permission check + rate limiting
 * 
 * Usage in API routes:
 * const result = await protectRouteWithPermission(request, 'PRODUCT_CREATE');
 * if (result instanceof NextResponse) return result;
 * const session = result;
 */
export async function protectRouteWithPermission(
  request: NextRequest | undefined,
  permission: Parameters<typeof hasPermission>[1]
): Promise<SessionPayload | NextResponse | Response> {
  // First do standard protection
  const result = await protectRoute(request);
  if (result instanceof NextResponse) return result;

  const session = result;
  
  // Check permission
  if (!hasPermission(session, permission)) {
    return createErrorResponse('Insufficient permissions', 403);
  }
  
  return session;
}

/**
 * Check if response is an error response (to use with protectRoute)
 */
export function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse;
}
