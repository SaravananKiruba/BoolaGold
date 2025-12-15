/**
 * SHOP PAYMENT API - Shop Owner Initiated Payments
 * Allows shop owners to submit payment proofs for verification
 * 
 * Features:
 * - View payment history
 * - Submit new payment with UPI transaction ID
 * - Check subscription status
 */

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/shops/[id]/payments - Get payment history for a shop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shopId } = await params;
    const session = await getSession();
    
    if (!session) {
      return createErrorResponse('Unauthorized', 403);
    }

    // Security: Users can only view their own shop's payments
    if (session.role !== 'SUPER_ADMIN' && session.shopId !== shopId) {
      return createErrorResponse('Unauthorized: Cannot view other shop payments', 403);
    }

    const payments = await prisma.shopPayment.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        trialEndDate: true,
        amcStatus: true,
        amcEndDate: true,
        currentUserCount: true,
        maxUsers: true,
        lastPaymentDate: true,
        lastPaymentAmount: true,
        nextPaymentDue: true,
      },
    });

    return createSuccessResponse({
      payments,
      shop,
    });
  } catch (error) {
    console.error('❌ Error fetching shop payments:', error);
    return createErrorResponse('Failed to fetch payments');
  }
}

/**
 * POST /api/shops/[id]/payments - Submit payment proof
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shopId } = await params;
    const session = await getSession();
    
    if (!session) {
      return createErrorResponse('Unauthorized', 403);
    }

    // Security: Users can only submit payments for their own shop
    if (session.role !== 'SUPER_ADMIN' && session.shopId !== shopId) {
      return createErrorResponse('Unauthorized: Cannot submit payment for other shops', 403);
    }

    const body = await request.json();
    const { amount, paymentType, transactionId, upiId, remarks } = body;

    // Validate required fields
    if (!amount || !paymentType || !transactionId) {
      return createErrorResponse('Missing required fields: amount, paymentType, transactionId', 400);
    }

    // Validate payment type
    const validTypes = ['TRIAL', 'SUBSCRIPTION', 'AMC_RENEWAL', 'REACTIVATION'];
    if (!validTypes.includes(paymentType)) {
      return createErrorResponse(`Invalid paymentType. Use: ${validTypes.join(', ')}`, 400);
    }

    // Validate amount based on payment type
    const expectedAmounts: { [key: string]: number } = {
      TRIAL: 500,
      SUBSCRIPTION: 40000,
      AMC_RENEWAL: 10000,
      REACTIVATION: 40000,
    };

    if (amount !== expectedAmounts[paymentType]) {
      return createErrorResponse(
        `Invalid amount for ${paymentType}. Expected: ₹${expectedAmounts[paymentType]}`,
        400
      );
    }

    // Check for duplicate transaction ID
    const existingPayment = await prisma.shopPayment.findFirst({
      where: {
        transactionId,
        status: { in: ['PENDING', 'PAID'] },
      },
    });

    if (existingPayment) {
      return createErrorResponse('Transaction ID already submitted', 400);
    }

    // Create payment record
    const payment = await prisma.shopPayment.create({
      data: {
        shopId,
        amount,
        paymentType,
        paymentMethod: 'UPI',
        transactionId,
        upiId: upiId || null,
        status: 'PENDING',
        paidAt: new Date(),
        remarks: remarks || null,
      },
    });

    return createSuccessResponse({
      payment,
      message: 'Payment submitted successfully. Awaiting Super Admin verification.',
    });
  } catch (error) {
    console.error('❌ Error submitting payment:', error);
    return createErrorResponse('Failed to submit payment');
  }
}
