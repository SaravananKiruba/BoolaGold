import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/auth/session - Get current user session
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    console.log('🔍 GET /api/auth/session - Session:', JSON.stringify(session, null, 2));

    if (!session) {
      console.log('❌ No session found');
      return createErrorResponse('Not authenticated', 401);
    }

    const userData = {
      user: {
        id: session.userId,
        username: session.username,
        name: session.name,
        role: session.role,
        shopId: session.shopId,
        shopName: session.shopName,
      },
    };
    console.log('✅ Session data:', JSON.stringify(userData, null, 2));

    return createSuccessResponse(userData);
  } catch (error) {
    console.error('❌ Error fetching session:', error);
    return createErrorResponse('Failed to fetch session');
  }
}
