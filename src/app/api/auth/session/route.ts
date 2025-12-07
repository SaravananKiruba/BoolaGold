import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/auth/session - Get current user session
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return createErrorResponse('Not authenticated', 401);
    }

    return createSuccessResponse({
      user: {
        id: session.userId,
        username: session.username,
        name: session.name,
        role: session.role,
        shopId: session.shopId,
        shopName: session.shopName,
      },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return createErrorResponse('Failed to fetch session');
  }
}
