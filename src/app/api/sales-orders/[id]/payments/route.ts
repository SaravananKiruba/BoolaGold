// Sales Order Payment API - Record payments against sales orders (User Story 17)
// POST /api/sales-orders/[id]/payments - Record payment for a sales order
// GET /api/sales-orders/[id]/payments - Get all payments for a sales order

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { transactionRepository } from '@/repositories/transactionRepository';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/utils/response';
import { amountSchema } from '@/utils/validation';
import { PaymentMethod, PaymentStatus, TransactionType, TransactionCategory, AuditModule } from '@/domain/entities/types';
import { logUpdate } from '@/utils/audit';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const recordPaymentSchema = z.object({
  amount: amountSchema,
  paymentMethod: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const salesOrderId = params.id;

    // Check if sales order exists
    const salesOrder = await salesOrderRepository.findById(salesOrderId);
    if (!salesOrder) {
      return NextResponse.json(notFoundResponse('Sales Order'), { status: 404 });
    }

    // Get all payments
    const payments = await prisma.salesPayment.findMany({
      where: { salesOrderId },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json(
      successResponse({
        salesOrder: {
          id: salesOrder.id,
          invoiceNumber: salesOrder.invoiceNumber,
          orderTotal: salesOrder.orderTotal,
          discountAmount: salesOrder.discountAmount,
          finalAmount: salesOrder.finalAmount,
          paidAmount: salesOrder.paidAmount,
          paymentStatus: salesOrder.paymentStatus,
          pendingAmount: Number(salesOrder.finalAmount) - Number(salesOrder.paidAmount),
        },
        payments,
      })
    );
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const body = await request.json();
    const salesOrderId = params.id;

    // Validate input
    const validation = recordPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Check if sales order exists
    const salesOrder = await salesOrderRepository.findById(salesOrderId);
    if (!salesOrder) {
      return NextResponse.json(notFoundResponse('Sales Order'), { status: 404 });
    }

    // Calculate pending amount
    const pendingAmount = Number(salesOrder.finalAmount) - Number(salesOrder.paidAmount);

    if (pendingAmount <= 0) {
      return NextResponse.json(
        errorResponse('Sales order is already fully paid'),
        { status: 400 }
      );
    }

    if (data.amount > pendingAmount) {
      return NextResponse.json(
        errorResponse(`Payment amount exceeds pending balance of ${pendingAmount}`),
        { status: 400 }
      );
    }

    // Record payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.salesPayment.create({
        data: {
          salesOrderId,
          amount: data.amount,
          paymentDate: new Date(),
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || null,
          notes: data.notes || null,
        },
      });

      // Update sales order paid amount and payment status
      const newPaidAmount = Number(salesOrder.paidAmount) + data.amount;
      let newPaymentStatus: PaymentStatus = PaymentStatus.PARTIAL;

      if (newPaidAmount >= Number(salesOrder.finalAmount)) {
        newPaymentStatus = PaymentStatus.PAID;
      } else if (newPaidAmount > 0) {
        newPaymentStatus = PaymentStatus.PARTIAL;
      } else {
        newPaymentStatus = PaymentStatus.PENDING;
      }

      const updatedSalesOrder = await tx.salesOrder.update({
        where: { id: salesOrderId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus,
        },
      });

      // Create transaction record (if not already created)
      const existingTransaction = await tx.transaction.findFirst({
        where: {
          salesOrderId,
          amount: data.amount,
          paymentMode: data.paymentMethod,
        },
      });

      if (!existingTransaction) {
        await tx.transaction.create({
          data: {
            shopId: session!.shopId!,
            transactionDate: new Date(),
            transactionType: TransactionType.INCOME,
            amount: data.amount,
            paymentMode: data.paymentMethod,
            category: TransactionCategory.SALES,
            description: `Payment for Sales Order ${salesOrder.invoiceNumber}`,
            referenceNumber: data.referenceNumber || salesOrder.invoiceNumber,
            customerId: salesOrder.customerId,
            salesOrderId,
            status: 'COMPLETED',
            currency: 'INR',
          },
        });
      }

      return {
        payment,
        updatedSalesOrder,
        newPaidAmount,
        newPaymentStatus,
        pendingAmount: Number(salesOrder.finalAmount) - newPaidAmount,
      };
    });

    // Log the update
    await logUpdate(AuditModule.SALES_ORDERS, salesOrderId, salesOrder, result.updatedSalesOrder, session!.shopId!);

    return NextResponse.json(successResponse(result), { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
