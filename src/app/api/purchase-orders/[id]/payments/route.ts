// Purchase Order Payment API

import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/repositories/purchaseOrderRepository';
import { PaymentMethod, PaymentStatus } from '@/domain/entities/types';
import { handleApiError, successResponse } from '@/utils/response';
import { logAudit } from '@/utils/audit';
import { AuditAction, AuditModule } from '@/domain/entities/types';

/**
 * POST /api/purchase-orders/[id]/payments
 * Record payment for a purchase order
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

    // Record payment
    const payment = await purchaseOrderRepository.recordPayment({
      purchaseOrder: {
        connect: { id: purchaseOrderId },
      },
      amount,
      paymentMethod: paymentMethod || PaymentMethod.CASH,
      referenceNumber,
      notes,
    });

    // Update purchase order paid amount and payment status
    const newPaidAmount = Number(purchaseOrder.paidAmount) + amount;
    const newPaymentStatus =
      newPaidAmount >= Number(purchaseOrder.totalAmount)
        ? PaymentStatus.PAID
        : PaymentStatus.PARTIAL;

    await purchaseOrderRepository.updatePaymentStatus(
      purchaseOrderId,
      newPaymentStatus,
      newPaidAmount
    );

    // Log audit
    await logAudit({
      action: AuditAction.UPDATE,
      module: AuditModule.PURCHASE_ORDERS,
      entityId: purchaseOrderId,
      afterData: {
        paymentId: payment.id,
        amount,
        paymentMethod,
        newPaymentStatus,
        newPaidAmount,
      },
    });

    return successResponse({
      payment,
      remainingAmount: Number(purchaseOrder.totalAmount) - newPaidAmount,
      paymentStatus: newPaymentStatus,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
