// Purchase Orders API - List and Create

import { NextRequest, NextResponse } from 'next/server';
import { PurchaseOrderRepository } from '@/repositories/purchaseOrderRepository';
import { PurchaseOrderStatus, PaymentStatus, PaymentMethod } from '@/domain/entities/types';
import { handleApiError, successResponse, errorResponse } from '@/utils/response';
import { generatePurchaseOrderNumber } from '@/utils/barcode';
import { logAudit } from '@/utils/audit';
import { AuditAction, AuditModule } from '@/domain/entities/types';
import { getSession, hasPermission } from '@/lib/auth';

/**
 * GET /api/purchase-orders
 * List all purchase orders with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    console.log('🔍 Purchase Orders API - Session:', JSON.stringify(session, null, 2));
    console.log('🔍 Purchase Orders API - Has PURCHASE_VIEW permission:', hasPermission(session, 'PURCHASE_VIEW'));
    
    if (!session) {
      console.log('❌ Purchase Orders API - No session found');
      return NextResponse.json(errorResponse('Unauthorized - No session'), { status: 401 });
    }
    
    if (!hasPermission(session, 'PURCHASE_VIEW')) {
      console.log(`❌ Purchase Orders API - User role ${session.role} does not have PURCHASE_VIEW permission`);
      return NextResponse.json(errorResponse(`Unauthorized - Role ${session.role} cannot view purchase orders`), { status: 403 });
    }
    
    console.log('✅ Purchase Orders API - Access granted');

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

    const repository = new PurchaseOrderRepository({ session });
    const result = await repository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/purchase-orders
 * Create a new purchase order
 * 
 * Body:
 * {
 *   supplierId: string,
 *   items: [{ productId, quantity, unitPrice, purchaseCost?, sellingPrice? }],
 *   autoReceiveStock?: boolean, // If true, auto-generates stock items immediately
 *   expectedDeliveryDate?: Date,
 *   paymentMethod?: string,
 *   discountAmount?: number,
 *   referenceNumber?: string,
 *   notes?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    console.log('🔍 Purchase Orders CREATE API - Session:', JSON.stringify(session, null, 2));
    
    if (!session) {
      console.log('❌ Purchase Orders CREATE API - No session found');
      return NextResponse.json(errorResponse('Unauthorized - No session'), { status: 401 });
    }
    
    if (!hasPermission(session, 'PURCHASE_CREATE')) {
      console.log(`❌ Purchase Orders CREATE API - User role ${session.role} does not have PURCHASE_CREATE permission`);
      return NextResponse.json(errorResponse(`Unauthorized - Role ${session.role} cannot create purchase orders`), { status: 403 });
    }
    
    console.log('✅ Purchase Orders CREATE API - Access granted');

    const body = await request.json();

    const {
      supplierId,
      expectedDeliveryDate,
      paymentMethod,
      discountAmount = 0,
      referenceNumber,
      notes,
      items, // Array of { productId, quantity, unitPrice, expectedWeight, purchaseCost?, sellingPrice? }
      autoReceiveStock = false, // NEW: Auto-generate stock items for direct purchases
    } = body;

    // Validate required fields
    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier and items are required' },
        { status: 400 }
      );
    }

    // If auto-receiving stock, validate purchase cost
    if (autoReceiveStock) {
      const missingCost = items.some((item: any) => !item.purchaseCost && !item.unitPrice);
      if (missingCost) {
        return NextResponse.json(
          { error: 'Purchase cost required for all items when auto-receiving stock' },
          { status: 400 }
        );
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const finalAmount = totalAmount - discountAmount;

    // Generate order number
    const orderNumber = generatePurchaseOrderNumber();

    // Create purchase order with items
    const repository = new PurchaseOrderRepository({ session });
    const purchaseOrder = await repository.create({
      orderNumber,
      supplierId,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      paymentMethod: paymentMethod || PaymentMethod.CASH,
      discountAmount,
      totalAmount: finalAmount,
      paidAmount: 0,
      status: autoReceiveStock ? PurchaseOrderStatus.DELIVERED : PurchaseOrderStatus.PENDING,
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
          receivedQuantity: autoReceiveStock ? item.quantity : 0,
        })),
      },
    });

    let stockItemsCreated = 0;

    // Auto-generate stock items if requested
    if (autoReceiveStock) {
      const { generateBatchTagIds, generateStockBarcode } = await import('@/utils/barcode');
      const { productRepository } = await import('@/repositories/productRepository');
      
      const receiptItems = [];

      for (const item of items) {
        // Get product details for tag/barcode generation
        const product = await productRepository.findById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        // Generate unique tag IDs and barcodes for each physical item
        const tagIds = generateBatchTagIds(
          product.metalType as any,
          product.purity,
          item.quantity
        );

        const barcodes = Array.from({ length: item.quantity }, (_, i) => {
          return generateStockBarcode(item.productId, Date.now() + i);
        });

        // Create individual stock items - ONLY with purchase cost
        // Selling price will be calculated at SALES time based on latest rate!
        const individualItems = [];
        for (let i = 0; i < item.quantity; i++) {
          individualItems.push({
            tagId: tagIds[i],
            barcode: barcodes[i],
            purchaseCost: item.purchaseCost || item.unitPrice,
            purchaseDate: new Date(),
          });
        }

        receiptItems.push({
          purchaseOrderItemId: purchaseOrder.items[items.indexOf(item)].id,
          productId: item.productId,
          quantityToReceive: item.quantity,
          individualItems,
        });
      }

      // Create stock items via repository
      const stockResult = await repository.receiveStock(
        purchaseOrder.id,
        receiptItems
      );

      stockItemsCreated = stockResult.stockItems.length;
    }

    // Log audit
    await logAudit({
      shopId: session!.shopId!,
      action: AuditAction.CREATE,
      module: AuditModule.PURCHASE_ORDERS,
      entityId: purchaseOrder.id,
      afterData: {
        ...purchaseOrder,
        autoReceiveStock,
        stockItemsCreated,
      },
    });

    return NextResponse.json(
      successResponse({
        ...purchaseOrder,
        stockItemsCreated,
        message: autoReceiveStock 
          ? `Purchase order created and ${stockItemsCreated} stock items generated with unique tags and barcodes`
          : 'Purchase order created. Use receive-stock API to generate stock items.'
      }), 
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
