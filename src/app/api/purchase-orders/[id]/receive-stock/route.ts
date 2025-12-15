// Stock Receipt API - Receive stock from purchase order

import { NextRequest, NextResponse } from 'next/server';
import { getRepositories } from '@/utils/apiRepository';
import { handleApiError, successResponse } from '@/utils/response';
import { generateBatchTagIds, generateStockBarcode } from '@/utils/barcode';
import { logAudit } from '@/utils/audit';
import { MetalType, AuditAction, AuditModule } from '@/domain/entities/types';

/**
 * POST /api/purchase-orders/[id]/receive-stock
 * Receive stock items against a purchase order
 * 
 * User Story 7: Stock Receipt from Purchase Order
 * 
 * INPUT: Only purchase cost per item (what you paid)
 * OUTPUT: Stock items created with tag IDs
 * NOTE: NO selling price asked - calculated later at sales time!
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repos = await getRepositories(request);
    const body = await request.json();
    const purchaseOrderId = params.id;

    const {
      items, // Array of items to receive (can be single or multiple)
      receivedBy,
      singleProductMode = false, // NEW: Process single product for progress tracking
    } = body;

    /*
     * items structure:
     * [{
     *   purchaseOrderItemId: string,
     *   productId: string,
     *   quantityToReceive: number,
     *   receiptDetails: [{
     *     purchaseCost: number,
     *     huid?: string  // Optional HUID (Hallmark Unique ID)
     *   }]
     * }]
     */

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Items to receive are required' },
        { status: 400 }
      );
    }

    // For single product mode, ensure only one item
    if (singleProductMode && items.length !== 1) {
      return NextResponse.json(
        { error: 'Single product mode requires exactly one item' },
        { status: 400 }
      );
    }

    // Get purchase order
    const purchaseOrder = await repos.purchaseOrder.findById(purchaseOrderId);
    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    // Process each item
    const receiptItems = [];

    for (const item of items) {
      const { purchaseOrderItemId, productId, quantityToReceive, receiptDetails } = item;

      if (quantityToReceive <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for item ${productId}` },
          { status: 400 }
        );
      }

      // Get product details for tag/barcode generation
      const product = await repos.product.findById(productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${productId} not found` },
          { status: 404 }
        );
      }

      // Check if quantity exceeds pending quantity
      const poItem = purchaseOrder.items.find((i) => i.id === purchaseOrderItemId);
      if (!poItem) {
        return NextResponse.json(
          { error: `Purchase order item ${purchaseOrderItemId} not found` },
          { status: 404 }
        );
      }

      const pendingQuantity = poItem.quantity - poItem.receivedQuantity;
      if (quantityToReceive > pendingQuantity) {
        return NextResponse.json(
          {
            error: `Cannot receive ${quantityToReceive} items for ${product.name}. Only ${pendingQuantity} pending.`,
          },
          { status: 400 }
        );
      }

      // Generate unique tag IDs and barcodes for each physical item
      const tagIds = generateBatchTagIds(
        product.metalType as MetalType,
        product.purity,
        quantityToReceive
      );

      const barcodes = Array.from({ length: quantityToReceive }, (_, i) => {
        return generateStockBarcode(productId, Date.now() + i);
      });

      // Create individual stock items - ONLY purchase cost
      // Selling price will be calculated at SALES time!
      const individualItems = [];
      for (let i = 0; i < quantityToReceive; i++) {
        const detail = receiptDetails[i] || receiptDetails[0]; // Use first detail as default

        individualItems.push({
          tagId: tagIds[i],
          barcode: barcodes[i],
          huid: detail.huid || undefined, // Optional HUID for hallmarked items
          purchaseCost: detail.purchaseCost,
          purchaseDate: new Date(),
        });
      }

      receiptItems.push({
        purchaseOrderItemId,
        productId,
        quantityToReceive,
        individualItems,
      });
    }

    // Receive stock in transaction
    const result = await repos.purchaseOrder.receiveStock(
      purchaseOrderId,
      receiptItems
    );

    // Log audit
    await logAudit({
      shopId: purchaseOrder.shopId,
      action: AuditAction.CREATE,
      module: AuditModule.STOCK,
      entityId: purchaseOrderId,
      afterData: {
        purchaseOrderId,
        itemsReceived: receiptItems.length,
        totalQuantity: receiptItems.reduce((sum, item) => sum + item.quantityToReceive, 0),
        receivedBy,
      },
    });

    return NextResponse.json(successResponse({
      message: 'Stock received successfully',
      purchaseOrder: result.purchaseOrder,
      stockItemsCreated: result.stockItems.length,
      productName: receiptItems.length === 1 ? (await repos.product.findById(receiptItems[0].productId))?.name : undefined,
      processedItems: receiptItems.length,
    }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/purchase-orders/[id]/items-to-receive
 * Get items pending receipt for a purchase order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repos = await getRepositories(request);
    const purchaseOrderId = params.id;

    const itemsToReceive = await repos.purchaseOrder.getItemsToReceive(purchaseOrderId);

    return NextResponse.json(successResponse({
      purchaseOrderId,
      items: itemsToReceive,
    }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
