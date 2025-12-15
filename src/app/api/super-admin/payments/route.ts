/**
 * PAYMENT MANAGEMENT API - Super Admin Only
 * Manual UPI Payment Verification System
 * 
 * Features:
 * - View all pending/verified payments
 * - Verify UPI transaction IDs manually
 * - Track payment history
 * - Auto-update subscription on verification
 */

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, isSuperAdmin } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/super-admin/payments - Get all payments with filters
 * Query params: status, paymentType, shopId
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!isSuperAdmin(session)) {
      return createErrorResponse('Unauthorized: Super Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentType = searchParams.get('paymentType');
    const shopId = searchParams.get('shopId');

    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    if (paymentType) {
      whereClause.paymentType = paymentType;
    }
    if (shopId) {
      whereClause.shopId = shopId;
    }

    const payments = await prisma.shopPayment.findMany({
      where: whereClause,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            subscriptionStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get summary stats
    const stats = await prisma.shopPayment.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    return createSuccessResponse({
      payments,
      stats,
      total: payments.length,
    });
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    return createErrorResponse('Failed to fetch payments');
  }
}

/**
 * POST /api/super-admin/payments/verify - Verify a payment and update subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!isSuperAdmin(session)) {
      return createErrorResponse('Unauthorized: Super Admin access required', 403);
    }

    const body = await request.json();
    const { paymentId, action, remarks } = body;

    if (!paymentId || !action) {
      return createErrorResponse('Missing required fields: paymentId, action', 400);
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return createErrorResponse('Invalid action. Use: APPROVE or REJECT', 400);
    }

    const payment = await prisma.shopPayment.findUnique({
      where: { id: paymentId },
      include: { shop: true },
    });

    if (!payment) {
      return createErrorResponse('Payment not found', 404);
    }

    if (payment.status !== 'PENDING') {
      return createErrorResponse(
        `Payment already ${payment.status.toLowerCase()}. Cannot modify.`,
        400
      );
    }

    // Process payment verification in transaction
    const result = await prisma.$transaction(async (tx) => {
      if (action === 'APPROVE') {
        // Update payment status
        const updatedPayment = await tx.shopPayment.update({
          where: { id: paymentId },
          data: {
            status: 'PAID',
            verifiedAt: new Date(),
            verifiedBy: session.userId,
            remarks: remarks || 'Payment verified by Super Admin',
          },
        });

        // Calculate dates based on payment type
        const now = new Date();
        const oneYear = new Date(now);
        oneYear.setFullYear(oneYear.getFullYear() + 1);
        
        const oneWeek = new Date(now);
        oneWeek.setDate(oneWeek.getDate() + 7);

        let shopUpdate: any = {
          lastPaymentDate: now,
          lastPaymentAmount: payment.amount,
        };

        // Update shop subscription based on payment type
        switch (payment.paymentType) {
          case 'TRIAL':
            // Trial payment just records the payment
            shopUpdate.nextPaymentDue = oneWeek;
            break;

          case 'SUBSCRIPTION':
          case 'REACTIVATION':
            // Activate full subscription
            shopUpdate.subscriptionStatus = 'ACTIVE';
            shopUpdate.subscriptionStartDate = now;
            shopUpdate.subscriptionEndDate = oneYear;
            shopUpdate.amcStatus = 'ACTIVE';
            shopUpdate.amcStartDate = now;
            shopUpdate.amcEndDate = oneYear;
            shopUpdate.isPaused = false;
            shopUpdate.pausedAt = null;
            shopUpdate.nextPaymentDue = oneYear;
            break;

          case 'AMC_RENEWAL':
            // Extend AMC only
            const currentAmcEnd = payment.shop.amcEndDate || now;
            const newAmcEnd = new Date(currentAmcEnd);
            newAmcEnd.setFullYear(newAmcEnd.getFullYear() + 1);
            
            shopUpdate.amcStatus = 'ACTIVE';
            shopUpdate.amcLastRenewalDate = now;
            shopUpdate.amcEndDate = newAmcEnd;
            shopUpdate.nextPaymentDue = newAmcEnd;
            break;
        }

        // Update shop
        const updatedShop = await tx.shop.update({
          where: { id: payment.shopId },
          data: shopUpdate,
        });

        return { payment: updatedPayment, shop: updatedShop, action: 'APPROVED' };

      } else {
        // REJECT payment
        const updatedPayment = await tx.shopPayment.update({
          where: { id: paymentId },
          data: {
            status: 'FAILED',
            verifiedAt: new Date(),
            verifiedBy: session.userId,
            remarks: remarks || 'Payment rejected by Super Admin',
          },
        });

        return { payment: updatedPayment, action: 'REJECTED' };
      }
    });

    return createSuccessResponse(result);
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    return createErrorResponse('Failed to verify payment');
  }
}
