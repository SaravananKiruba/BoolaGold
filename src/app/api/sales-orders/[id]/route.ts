// Sales Order API Route - GET by ID, PATCH update, DELETE cancel
// GET /api/sales-orders/[id] - Get sales order details
// PATCH /api/sales-orders/[id] - Update sales order (cancel, etc.)
// DELETE /api/sales-orders/[id] - Cancel sales order and release stock

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SalesOrderRepository } from '@/repositories/salesOrderRepository';
import { StockItemRepository } from '@/repositories/stockItemRepository';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/utils/response';
import { SalesOrderStatus, AuditModule } from '@/domain/entities/types';
import { logUpdate, logDelete } from '@/utils/audit';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';

const updateSalesOrderSchema = z.object({
  status: z.nativeEnum(SalesOrderStatus).optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'SALES_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const repository = new SalesOrderRepository({ session });
    const salesOrder = await repository.findById(params.id);

    if (!salesOrder) {
      return NextResponse.json(notFoundResponse('Sales Order'), { status: 404 });
    }

    return NextResponse.json(successResponse(salesOrder), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching sales order:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'SALES_EDIT')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = updateSalesOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Initialize repository
    const salesOrderRepository = new SalesOrderRepository({ session });

    // Check if sales order exists
    const existingSalesOrder = await salesOrderRepository.findById(params.id);
    if (!existingSalesOrder) {
      return NextResponse.json(notFoundResponse('Sales Order'), { status: 404 });
    }

    // If cancelling, release stock items
    if (data.status === SalesOrderStatus.CANCELLED && existingSalesOrder.status !== SalesOrderStatus.CANCELLED) {
      // Release all stock items back to AVAILABLE
      await prisma.$transaction(async (tx) => {
        for (const line of existingSalesOrder.lines) {
          await tx.stockItem.update({
            where: { id: line.stockItemId },
            data: {
              status: 'AVAILABLE',
              saleDate: null,
              salesOrderLineId: null,
            },
          });
        }

        // Update sales order
        await tx.salesOrder.update({
          where: { id: params.id },
          data: {
            status: SalesOrderStatus.CANCELLED,
            notes: data.notes || existingSalesOrder.notes,
          },
        });
      });
    } else {
      // Regular update
      await salesOrderRepository.update(params.id, data);
    }

    const updatedSalesOrder = await salesOrderRepository.findById(params.id);

    // Log the update
    await logUpdate(AuditModule.SALES_ORDERS, params.id, existingSalesOrder, updatedSalesOrder);

    return NextResponse.json(successResponse(updatedSalesOrder), { status: 200 });
  } catch (error: any) {
    console.error('Error updating sales order:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if sales order exists
    const existingSalesOrder = await salesOrderRepository.findById(params.id);
    if (!existingSalesOrder) {
      return NextResponse.json(notFoundResponse('Sales Order'), { status: 404 });
    }

    // Cancel and release stock items
    await prisma.$transaction(async (tx) => {
      // Release all stock items back to AVAILABLE
      for (const line of existingSalesOrder.lines) {
        await tx.stockItem.update({
          where: { id: line.stockItemId },
          data: {
            status: 'AVAILABLE',
            saleDate: null,
            salesOrderLineId: null,
          },
        });
      }

      // Mark order as cancelled
      await tx.salesOrder.update({
        where: { id: params.id },
        data: {
          status: SalesOrderStatus.CANCELLED,
        },
      });

      // Soft delete
      await tx.salesOrder.update({
        where: { id: params.id },
        data: { deletedAt: new Date() },
      });
    });

    // Log the deletion
    await logDelete(AuditModule.SALES_ORDERS, params.id, existingSalesOrder, session!.shopId!);

    return NextResponse.json(successResponse({ message: 'Sales order cancelled and deleted successfully' }), { status: 200 });
  } catch (error: any) {
    console.error('Error deleting sales order:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
