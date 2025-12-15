/**
 * SUBSCRIPTION MANAGEMENT API - Super Admin Only
 * Manual subscription lifecycle management
 * 
 * Features:
 * - Pause/Resume shops
 * - Extend subscriptions manually
 * - View expiring subscriptions
 * - Cancel subscriptions
 */

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/super-admin/subscriptions - Get subscription overview
 * Query params: status, expiring (days)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!isSuperAdmin(session)) {
      return createErrorResponse('Unauthorized: Super Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const expiringDays = searchParams.get('expiring');

    const whereClause: any = { deletedAt: null };
    
    if (status) {
      whereClause.subscriptionStatus = status;
    }

    // Get expiring subscriptions
    if (expiringDays) {
      const days = parseInt(expiringDays);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      whereClause.subscriptionEndDate = {
        gte: new Date(),
        lte: futureDate,
      };
      whereClause.subscriptionStatus = 'ACTIVE';
    }

    const shops = await prisma.shop.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        trialStartDate: true,
        trialEndDate: true,
        amcStatus: true,
        amcEndDate: true,
        isPaused: true,
        pausedAt: true,
        currentUserCount: true,
        maxUsers: true,
        lastPaymentDate: true,
        lastPaymentAmount: true,
        nextPaymentDue: true,
        _count: {
          select: {
            users: { where: { deletedAt: null, isActive: true } },
            customers: { where: { deletedAt: null } },
            salesOrders: true,
          },
        },
      },
      orderBy: { subscriptionEndDate: 'asc' },
    });

    // Get summary stats
    const stats = await prisma.shop.groupBy({
      by: ['subscriptionStatus'],
      where: { deletedAt: null },
      _count: { id: true },
    });

    return createSuccessResponse({
      shops,
      stats,
      total: shops.length,
    });
  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error);
    return createErrorResponse('Failed to fetch subscriptions');
  }
}

/**
 * POST /api/super-admin/subscriptions - Perform subscription actions
 * Actions: PAUSE, RESUME, EXTEND, CANCEL
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!isSuperAdmin(session)) {
      return createErrorResponse('Unauthorized: Super Admin access required', 403);
    }

    const body = await request.json();
    const { shopId, action, reason, extendDays } = body;

    if (!shopId || !action) {
      return createErrorResponse('Missing required fields: shopId, action', 400);
    }

    const validActions = ['PAUSE', 'RESUME', 'EXTEND', 'CANCEL'];
    if (!validActions.includes(action)) {
      return createErrorResponse(
        `Invalid action. Use: ${validActions.join(', ')}`,
        400
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return createErrorResponse('Shop not found', 404);
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'PAUSE':
        updateData = {
          isPaused: true,
          pausedAt: new Date(),
          pauseReason: reason || 'Paused by Super Admin',
          subscriptionStatus: 'PAUSED',
        };
        message = 'Shop paused successfully';
        break;

      case 'RESUME':
        if (!shop.isPaused) {
          return createErrorResponse('Shop is not paused', 400);
        }
        updateData = {
          isPaused: false,
          pausedAt: null,
          pauseReason: null,
          subscriptionStatus: shop.subscriptionEndDate && shop.subscriptionEndDate > new Date()
            ? 'ACTIVE'
            : 'EXPIRED',
        };
        message = 'Shop resumed successfully';
        break;

      case 'EXTEND':
        if (!extendDays || extendDays < 1) {
          return createErrorResponse('Invalid extendDays. Must be >= 1', 400);
        }
        
        const currentEnd = shop.subscriptionEndDate || new Date();
        const newEnd = new Date(currentEnd);
        newEnd.setDate(newEnd.getDate() + extendDays);
        
        updateData = {
          subscriptionEndDate: newEnd,
          subscriptionStatus: 'ACTIVE',
          nextPaymentDue: newEnd,
        };
        message = `Subscription extended by ${extendDays} days`;
        break;

      case 'CANCEL':
        updateData = {
          subscriptionStatus: 'CANCELLED',
          isActive: false,
          canReactivate: false,
        };
        message = 'Subscription cancelled permanently';
        break;
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: updateData,
    });

    return createSuccessResponse({
      shop: updatedShop,
      message,
      action,
    });
  } catch (error) {
    console.error('❌ Error performing subscription action:', error);
    return createErrorResponse('Failed to perform subscription action');
  }
}
