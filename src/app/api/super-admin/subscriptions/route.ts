import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';

// GET: List all shops with subscription info
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isSuperAdmin(session)) {
      return createErrorResponse('Unauthorized', 401);
    }

    const searchParams = req.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'ALL'; // ALL, TRIAL, LIFETIME
    const search = searchParams.get('search') || '';

    const whereClause: any = {
      deletedAt: null,
    };

    if (filter === 'TRIAL') {
      whereClause.subscriptionType = 'TRIAL';
    } else if (filter === 'LIFETIME') {
      whereClause.subscriptionType = 'LIFETIME';
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const shops = await prisma.shop.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        subscriptionType: true,
        trialStartDate: true,
        trialEndDate: true,
        lifetimeAmount: true,
        lifetimePaidAt: true,
        amcRenewalDate: true,
        amcLastRenewalDate: true,
        amcAmount: true,
        maxUsers: true,
        currentUserCount: true,
        isActive: true,
        deactivatedAt: true,
        deactivationReason: true,
        createdAt: true,
        _count: {
          select: {
            users: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate stats
    const stats = {
      total: shops.length,
      trial: shops.filter((s) => s.subscriptionType === 'TRIAL').length,
      lifetime: shops.filter((s) => s.subscriptionType === 'LIFETIME').length,
      active: shops.filter((s) => s.isActive).length,
      deactivated: shops.filter((s) => !s.isActive).length,
    };

    // Add computed fields
    const shopsWithDetails = shops.map((shop) => {
      let trialDaysRemaining = null;
      let amcDaysRemaining = null;

      if (shop.subscriptionType === 'TRIAL' && shop.trialEndDate) {
        const daysRemaining = Math.ceil(
          (new Date(shop.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        trialDaysRemaining = daysRemaining;
      }

      if (shop.amcRenewalDate) {
        const daysRemaining = Math.ceil(
          (new Date(shop.amcRenewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        amcDaysRemaining = daysRemaining;
      }

      return {
        ...shop,
        activeUserCount: shop._count.users,
        trialDaysRemaining,
        amcDaysRemaining,
        isTrialExpired: trialDaysRemaining !== null && trialDaysRemaining < 0,
        isAmcExpired: amcDaysRemaining !== null && amcDaysRemaining < 0,
      };
    });

    return createSuccessResponse({
      shops: shopsWithDetails,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return createErrorResponse('Failed to fetch subscriptions', 500);
  }
}

// POST: Perform actions on shops (convert to lifetime, deactivate, reactivate, update AMC)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isSuperAdmin(session)) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    const { action, shopId, data } = body;

    if (!action || !shopId) {
      return createErrorResponse('Missing required fields: action, shopId', 400);
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId, deletedAt: null },
    });

    if (!shop) {
      return createErrorResponse('Shop not found', 404);
    }

    let updatedShop;

    switch (action) {
      case 'convertToLifetime':
        // Convert TRIAL to LIFETIME
        const { lifetimeAmount } = data || {};
        
        if (!lifetimeAmount || lifetimeAmount < 0) {
          return createErrorResponse('Valid lifetime amount is required', 400);
        }

        updatedShop = await prisma.shop.update({
          where: { id: shopId },
          data: {
            subscriptionType: 'LIFETIME',
            lifetimeAmount: lifetimeAmount,
            lifetimePaidAt: new Date(),
            isActive: true,
            deactivatedAt: null,
            deactivationReason: null,
            // Set AMC renewal date to 1 year from now
            amcRenewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
        break;

      case 'deactivate':
        // Deactivate shop
        const { reason } = data || {};
        
        updatedShop = await prisma.shop.update({
          where: { id: shopId },
          data: {
            isActive: false,
            deactivatedAt: new Date(),
            deactivationReason: reason || 'Deactivated by Super Admin',
          },
        });
        break;

      case 'reactivate':
        // Reactivate shop
        updatedShop = await prisma.shop.update({
          where: { id: shopId },
          data: {
            isActive: true,
            deactivatedAt: null,
            deactivationReason: null,
          },
        });
        break;

      case 'updateAMC':
        // Update AMC renewal date
        const { amcRenewalDate } = data || {};
        
        if (!amcRenewalDate) {
          return createErrorResponse('AMC renewal date is required', 400);
        }

        updatedShop = await prisma.shop.update({
          where: { id: shopId },
          data: {
            amcRenewalDate: new Date(amcRenewalDate),
            amcLastRenewalDate: new Date(),
            isActive: true, // Reactivate if AMC renewed
            deactivatedAt: null,
            deactivationReason: null,
          },
        });
        break;

      case 'extendTrial':
        // Extend trial period
        const { days } = data || {};
        
        if (!days || days <= 0) {
          return createErrorResponse('Valid number of days is required', 400);
        }

        if (shop.subscriptionType !== 'TRIAL') {
          return createErrorResponse('Can only extend trial for TRIAL subscriptions', 400);
        }

        const currentEndDate = shop.trialEndDate || new Date();
        const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);

        updatedShop = await prisma.shop.update({
          where: { id: shopId },
          data: {
            trialEndDate: newEndDate,
            isActive: true,
            deactivatedAt: null,
            deactivationReason: null,
          },
        });
        break;

      default:
        return createErrorResponse('Invalid action', 400);
    }

    return createSuccessResponse({
      message: `Action ${action} completed successfully`,
      shop: updatedShop,
    });
  } catch (error: any) {
    console.error('Error performing action:', error);
    return createErrorResponse('Failed to perform action', 500);
  }
}
