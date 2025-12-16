import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';

// GET: View own subscription details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 [Subscription API] Starting request');
    
    const session = await getSession();
    if (!session) {
      console.log('❌ [Subscription API] Auth failed');
      return createErrorResponse('Unauthorized', 401);
    }

    console.log('🔍 [Subscription API] Awaiting params...');
    const { id: shopId } = await params;
    console.log('✅ [Subscription API] Got shopId:', shopId);

    // Only OWNER can view their own shop, or SUPER_ADMIN can view any
    if (!isSuperAdmin(session) && session.shopId !== shopId) {
      console.log('❌ [Subscription API] Permission denied:', { userRole: session.role, userShopId: session.shopId, requestedShopId: shopId });
      return createErrorResponse('You can only view your own shop subscription', 403);
    }

    console.log('🔍 [Subscription API] Fetching shop from database...');
    const shop = await prisma.shop.findUnique({
      where: { id: shopId, deletedAt: null },
      include: {
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
    });

    if (!shop) {
      console.log('❌ [Subscription API] Shop not found:', shopId);
      return createErrorResponse('Shop not found', 404);
    }

    console.log('✅ [Subscription API] Shop found, processing subscription details...');
    
    // Calculate days remaining
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

    const subscriptionDetails = {
      subscriptionType: shop.subscriptionType,
      trialStartDate: shop.trialStartDate,
      trialEndDate: shop.trialEndDate,
      lifetimeAmount: shop.lifetimeAmount,
      lifetimePaidAt: shop.lifetimePaidAt,
      amcRenewalDate: shop.amcRenewalDate,
      amcLastRenewalDate: shop.amcLastRenewalDate,
      amcAmount: shop.amcAmount,
      maxUsers: shop.maxUsers,
      activeUserCount: shop._count.users,
      isActive: shop.isActive,
      deactivatedAt: shop.deactivatedAt,
      deactivationReason: shop.deactivationReason,
      trialDaysRemaining,
      amcDaysRemaining,
      isTrialExpired: trialDaysRemaining !== null && trialDaysRemaining < 0,
      isAmcExpired: amcDaysRemaining !== null && amcDaysRemaining < 0,
      // Payment info for shop owners
      paymentInfo: {
        trialFee: 500,
        lifetimeFee: 65000,
        amcFee: 10000,
        upiId: 'boolagold@upi', // Replace with actual UPI ID
        qrCodeUrl: '/payment-qr.png', // Replace with actual QR code URL
      },
    };

    return createSuccessResponse(subscriptionDetails);
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return createErrorResponse('Failed to fetch subscription details', 500);
  }
}
