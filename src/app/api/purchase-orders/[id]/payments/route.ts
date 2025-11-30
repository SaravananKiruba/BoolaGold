// Purchase Order Payment API

import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/repositories/purchaseOrderRepository';
import { transactionRepository } from '@/repositories/transactionRepository';
import { PaymentMethod, PaymentStatus, TransactionType, TransactionCategory } from '@/domain/entities/types';
import { handleApiError, successResponse } from '@/utils/response';
import { logAudit } from '@/utils/audit';
import { AuditAction, AuditModule } from '@/domain/entities/types';
import prisma from '@/lib/prisma';

/**
 * POST /api/purchase-orders/[id]/payments
 * Record payment for a purchase order and create expense transaction
 * User Story 27: Purchase to Stock Workflow - Record Payment with Expense Transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const purchaseOrderId = params.id;

    const { amount, paymentMethod, referenceNumber, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    // Get purchase order
    const purchaseOrder = await purchaseOrderRepository.findById(purchaseOrderId);
    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    // Check if payment exceeds remaining amount
    const remainingAmount = Number(purchaseOrder.totalAmount) - Number(purchaseOrder.paidAmount);
    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: `Payment amount exceeds remaining balance of ${remainingAmount}` },
        { status: 400 }
      );
    }

    // Record payment and create expense transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Record payment
      const payment = await tx.purchasePayment.create({
        data: {
          purchaseOrderId,
          amount,
          paymentMethod: paymentMethod || PaymentMethod.CASH,
          referenceNumber,
          notes,
          paymentDate: new Date(),
        },
      });

      // Update purchase order paid amount and payment status
      const newPaidAmount = Number(purchaseOrder.paidAmount) + amount;
      const newPaymentStatus =
        newPaidAmount >= Number(purchaseOrder.totalAmount)
          ? PaymentStatus.PAID
          : PaymentStatus.PARTIAL;

      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus,
        },
      });

      // Create expense transaction (User Story 27 requirement)
      const transaction = await tx.transaction.create({
        data: {
          transactionDate: new Date(),
          transactionType: TransactionType.EXPENSE,
          amount,
          paymentMode: paymentMethod || PaymentMethod.CASH,
          category: TransactionCategory.PURCHASE,
          description: `Purchase Order ${purchaseOrder.orderNumber} - Payment to ${purchaseOrder.supplier.name}`,
          referenceNumber: referenceNumber || purchaseOrder.orderNumber,
          status: 'COMPLETED',
          currency: 'INR',
        },
      });

      return { payment, transaction, newPaidAmount, newPaymentStatus };
    });

    // Log audit
    await logAudit({
      action: AuditAction.UPDATE,
      module: AuditModule.PURCHASE_ORDERS,
      entityId: purchaseOrderId,
      afterData: {
        paymentId: result.payment.id,
        transactionId: result.transaction.id,
        amount,
        paymentMethod,
        newPaymentStatus: result.newPaymentStatus,
        newPaidAmount: result.newPaidAmount,
      },
    });

    return NextResponse.json(successResponse({
      payment: result.payment,
      transaction: result.transaction,
      remainingAmount: Number(purchaseOrder.totalAmount) - result.newPaidAmount,
      paymentStatus: result.newPaymentStatus,
      message: 'Payment recorded and expense transaction created successfully',
    }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/purchase-orders/[id]/payments
 * Get all payments for a purchase order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const purchaseOrderId = params.id;

    const purchaseOrder = await purchaseOrderRepository.findById(purchaseOrderId);
    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const totalAmount = Number(purchaseOrder.totalAmount);
    const paidAmount = Number(purchaseOrder.paidAmount);

    return NextResponse.json(successResponse({
      purchaseOrderId,
      orderNumber: purchaseOrder.orderNumber,
      summary: {
        totalAmount,
        paidAmount,
        outstandingAmount: totalAmount - paidAmount,
        paymentStatus: purchaseOrder.paymentStatus,
      },
      payments: purchaseOrder.payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
        notes: payment.notes,
        createdAt: payment.createdAt,
      })),
    }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
