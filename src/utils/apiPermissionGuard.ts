/**
 * API Permission Guard Utility
 * Provides centralized permission checking with proper error responses
 * Ensures all APIs return consistent error format when unauthorized
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionPayload, hasPermission, getSession } from '@/lib/auth';
import { unauthorizedResponse, errorResponse } from '@/utils/response';

export interface PermissionCheckResult {
  authorized: boolean;
  session: SessionPayload | null;
  error?: NextResponse;
}

/**
 * Check if user has permission and is authenticated
 * Returns error response if not authorized
 */
export async function checkPermission(
  request: NextRequest,
  requiredPermission: keyof typeof import('@/lib/auth').PERMISSIONS
): Promise<PermissionCheckResult> {
  try {
    const session = await getSession();

    if (!session) {
      return {
        authorized: false,
        session: null,
        error: NextResponse.json(unauthorizedResponse(), { status: 401 }),
      };
    }

    if (!hasPermission(session, requiredPermission)) {
      return {
        authorized: false,
        session,
        error: NextResponse.json(
          errorResponse(
            `Insufficient permissions for action: ${requiredPermission}`,
            'PERMISSION_DENIED'
          ),
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      session,
    };
  } catch (error) {
    return {
      authorized: false,
      session: null,
      error: NextResponse.json(
        errorResponse('Authentication check failed'),
        { status: 500 }
      ),
    };
  }
}

/**
 * Check if user has ANY of the required permissions
 */
export async function checkAnyPermission(
  request: NextRequest,
  permissions: (keyof typeof import('@/lib/auth').PERMISSIONS)[]
): Promise<PermissionCheckResult> {
  try {
    const session = await getSession();

    if (!session) {
      return {
        authorized: false,
        session: null,
        error: NextResponse.json(unauthorizedResponse(), { status: 401 }),
      };
    }

    const { PERMISSIONS } = await import('@/lib/auth');
    const hasAny = permissions.some(p => PERMISSIONS[p].includes(session.role));

    if (!hasAny) {
      return {
        authorized: false,
        session,
        error: NextResponse.json(
          errorResponse(
            `Insufficient permissions for actions: ${permissions.join(', ')}`,
            'PERMISSION_DENIED'
          ),
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      session,
    };
  } catch (error) {
    return {
      authorized: false,
      session: null,
      error: NextResponse.json(
        errorResponse('Authentication check failed'),
        { status: 500 }
      ),
    };
  }
}

/**
 * Check if user has ALL required permissions
 */
export async function checkAllPermissions(
  request: NextRequest,
  permissions: (keyof typeof import('@/lib/auth').PERMISSIONS)[]
): Promise<PermissionCheckResult> {
  try {
    const session = await getSession();

    if (!session) {
      return {
        authorized: false,
        session: null,
        error: NextResponse.json(unauthorizedResponse(), { status: 401 }),
      };
    }

    const { PERMISSIONS } = await import('@/lib/auth');
    const hasAll = permissions.every(p => PERMISSIONS[p].includes(session.role));

    if (!hasAll) {
      return {
        authorized: false,
        session,
        error: NextResponse.json(
          errorResponse(
            `All of the following permissions required: ${permissions.join(', ')}`,
            'PERMISSION_DENIED'
          ),
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      session,
    };
  } catch (error) {
    return {
      authorized: false,
      session: null,
      error: NextResponse.json(
        errorResponse('Authentication check failed'),
        { status: 500 }
      ),
    };
  }
}
