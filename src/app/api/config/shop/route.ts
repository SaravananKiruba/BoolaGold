import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getShopConfig } from '@/lib/shopConfig';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/config/shop - Get current shop configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return createErrorResponse('Not authenticated', 401);
    }

    const config = await getShopConfig(session);

    if (!config) {
      return createErrorResponse('Shop configuration not found', 404);
    }

    return createSuccessResponse(config);
  } catch (error) {
    console.error('Error fetching shop config:', error);
    return createErrorResponse('Failed to fetch shop configuration');
  }
}
