/**
 * API Route Protection Utilities
 * Use these helpers to protect API routes with authentication and shop validation
 */

import { NextResponse } from 'next/server';
import { validateSession, SessionPayload, hasPermission } from '@/lib/auth';
import { createErrorResponse } from '@/utils/response';

/**
 * Protect API route with authentication and shop activation check
 * Returns session if valid, or error response if not
 * 
 * Usage in API routes:
 * const result = await protectRoute();
 * if (result instanceof NextResponse) return result;
 * const session = result;
 */
export async function protectRoute(): Promise<SessionPayload | NextResponse | Response> {
  const { session, isValid, message } = await validateSession();
  
  if (!isValid) {
    return createErrorResponse(message || 'Unauthorized', 403);
  }
  
  return session!;
}

/**
 * Protect API route with authentication, shop activation check, AND permission check
 * Returns session if valid, or error response if not
 * 
 * Usage in API routes:
 * const result = await protectRouteWithPermission('PRODUCT_CREATE');
 * if (result instanceof NextResponse) return result;
 * const session = result;
 */
export async function protectRouteWithPermission(
  permission: Parameters<typeof hasPermission>[1]
): Promise<SessionPayload | NextResponse | Response> {
  const { session, isValid, message } = await validateSession();
  
  if (!isValid) {
    return createErrorResponse(message || 'Unauthorized', 403);
  }
  
  if (!hasPermission(session, permission)) {
    return createErrorResponse('Insufficient permissions', 403);
  }
  
  return session!;
}

/**
 * Check if response is an error response (to use with protectRoute)
 */
export function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse;
}
