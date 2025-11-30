// Purchase Orders API - List and Create

import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/repositories/purchaseOrderRepository';
import { PurchaseOrderStatus, PaymentStatus, PaymentMethod } from '@/domain/entities/types';
import { handleApiError, successResponse } from '@/utils/response';
import { generatePurchaseOrderNumber } from '@/utils/barcode';
import { logAudit } from '@/utils/audit';
import { AuditAction, AuditModule } from '@/domain/entities/types';

/**
 * GET /api/purchase-orders
 * List all purchase orders with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Filters
    const filters: any = {};

    if (searchParams.get('supplierId')) {
      filters.supplierId = searchParams.get('supplierId')!;
    }

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as PurchaseOrderStatus;
    }

    if (searchParams.get('paymentStatus')) {
      filters.paymentStatus = searchParams.get('paymentStatus') as PaymentStatus;
    }

    if (searchParams.get('orderNumber')) {
      filters.orderNumber = searchParams.get('orderNumber')!;
    }

    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!);
    }

    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!);
    }

    const result = await purchaseOrderRepository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/purchase-orders
 * Create a new purchase order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      supplierId,
      expectedDeliveryDate,
      paymentMethod,
      discountAmount = 0,
      referenceNumber,
      notes,
      items, // Array of { productId, quantity, unitPrice, expectedWeight }
    } = body;

    // Validate required fields
    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier and items are required' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const finalAmount = totalAmount - discountAmount;

    // Generate order number
    const orderNumber = generatePurchaseOrderNumber();

    // Create purchase order with items
    const purchaseOrder = await purchaseOrderRepository.create({
      orderNumber,
      supplier: {
        connect: { id: supplierId },
      },
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      paymentMethod: paymentMethod || PaymentMethod.CASH,
      discountAmount,
      totalAmount: finalAmount,
      paidAmount: 0,
      status: PurchaseOrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      referenceNumber,
      notes,
      items: {
        create: items.map((item: any) => ({
          product: {
            connect: { id: item.productId },
          },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          expectedWeight: item.expectedWeight,
          receivedQuantity: 0,
        })),
      },
    });

    // Log audit
    await logAudit({
      action: AuditAction.CREATE,
      module: AuditModule.PURCHASE_ORDERS,
      entityId: purchaseOrder.id,
      afterData: purchaseOrder,
    });

    return NextResponse.json(successResponse(purchaseOrder), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
