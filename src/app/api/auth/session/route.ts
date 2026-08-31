import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/session - Current user session + minimal shop context.
 * shopBusinessType is used by the UI to switch between retail/wholesale flows.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return createErrorResponse('Not authenticated', 401);
    }

    let shop: {
      id: string;
      name: string;
      shopBusinessType: 'RETAIL' | 'WHOLESALE';
      subscriptionType: string;
      isActive: boolean;
      primaryColor: string | null;
      logo: string | null;
    } | null = null;

    if (session.shopId) {
      const s = await prisma.shop.findFirst({
        where: { id: session.shopId, deletedAt: null },
        select: {
          id: true,
          name: true,
          shopBusinessType: true,
          subscriptionType: true,
          isActive: true,
          primaryColor: true,
          logo: true,
        },
      });
      if (s) {
        shop = {
          id: s.id,
          name: s.name,
          shopBusinessType: s.shopBusinessType as 'RETAIL' | 'WHOLESALE',
          subscriptionType: s.subscriptionType as string,
          isActive: s.isActive,
          primaryColor: s.primaryColor,
          logo: s.logo,
        };
      }
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
      shop,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return createErrorResponse('Failed to fetch session');
  }
}
