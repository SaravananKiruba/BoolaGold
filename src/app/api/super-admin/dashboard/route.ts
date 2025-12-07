import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { errorResponse, successResponse } from '@/utils/response';

/**
 * GET /api/super-admin/dashboard - Super Admin Dashboard Stats
 * ⚠️ CRITICAL: Only SUPER_ADMIN can access
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // 🔒 SECURITY: Only SUPER_ADMIN can access system dashboard
    if (!hasPermission(session, 'SUPER_ADMIN_SYSTEM_VIEW')) {
      return NextResponse.json(
        errorResponse('Unauthorized: Super Admin access required'),
        { status: 403 }
      );
    }

    // Fetch all shops with counts
    const shops = await prisma.shop.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            products: true,
            salesOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all users count
    const totalUsers = await prisma.user.count({
      where: { deletedAt: null },
    });

    const activeUsers = await prisma.user.count({
      where: { deletedAt: null, isActive: true },
    });

    const dashboardStats = {
      totalShops: shops.length,
      activeShops: shops.filter(shop => shop.isActive).length,
      totalUsers,
      activeUsers,
      shops,
    };

    return NextResponse.json(successResponse(dashboardStats));
  } catch (error) {
    console.error('Error fetching super admin dashboard:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch dashboard data'),
      { status: 500 }
    );
  }
}
