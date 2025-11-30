// Sales Order Complete API - Complete a pending sales order
// POST /api/sales-orders/[id]/complete - Complete pending order and mark stock as SOLD

import { NextRequest, NextResponse } from 'next/server';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { transactionRepository } from '@/repositories/transactionRepository';
import { successResponse, errorResponse, notFoundResponse } from '@/utils/response';
import { TransactionType, TransactionCategory, SalesOrderStatus, AuditModule } from '@/domain/entities/types';
import { logUpdate } from '@/utils/audit';
import prisma from '@/lib/prisma';

export async function POST(
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

    // Check if order is pending
    if (salesOrder.status !== SalesOrderStatus.PENDING) {
      return NextResponse.json(
        errorResponse(`Cannot complete order with status: ${salesOrder.status}`),
        { status: 400 }
      );
    }

    // Complete the order
    const result = await prisma.$transaction(async (tx) => {
      // Update order status to COMPLETED
      const completedOrder = await tx.salesOrder.update({
        where: { id: salesOrderId },
        data: {
          status: SalesOrderStatus.COMPLETED,
        },
        include: {
          customer: true,
          lines: {
            include: {
              stockItem: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      // Update stock items from RESERVED to SOLD
      for (const line of completedOrder.lines) {
        await tx.stockItem.update({
          where: { id: line.stockItemId },
          data: {
            status: 'SOLD',
            saleDate: new Date(),
          },
        });
      }

      // Create income transaction
      await tx.transaction.create({
        data: {
          transactionDate: new Date(),
          transactionType: TransactionType.INCOME,
          amount: completedOrder.finalAmount,
          paymentMode: completedOrder.paymentMethod,
          category: TransactionCategory.SALES,
          description: `Sales Order ${completedOrder.invoiceNumber} - Completed`,
          referenceNumber: completedOrder.invoiceNumber,
          customerId: completedOrder.customerId,
          salesOrderId: completedOrder.id,
          status: 'COMPLETED',
          currency: 'INR',
        },
      });

      return completedOrder;
    });

    // Log the update
    await logUpdate(AuditModule.SALES_ORDERS, salesOrderId, salesOrder, result);

    return NextResponse.json(
      successResponse({
        message: 'Sales order completed successfully',
        salesOrder: result,
      })
    );
  } catch (error: any) {
    console.error('Error completing sales order:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
