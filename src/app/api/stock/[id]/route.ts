// Stock Item Details API - Get specific stock item

import { NextRequest, NextResponse } from 'next/server';
import { stockItemRepository } from '@/repositories/stockItemRepository';
import { handleApiError, successResponse } from '@/utils/response';

/**
 * GET /api/stock/[id]
 * Get details of a specific stock item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stockItem = await stockItemRepository.findById(params.id);

    if (!stockItem) {
      return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });
    }

    return NextResponse.json(successResponse({
      id: stockItem.id,
      tagId: stockItem.tagId,
      barcode: stockItem.barcode,
      status: stockItem.status,
      purchaseCost: stockItem.purchaseCost,
      sellingPrice: stockItem.sellingPrice,
      purchaseDate: stockItem.purchaseDate,
      saleDate: stockItem.saleDate,
      product: stockItem.product,
      purchaseOrder: stockItem.purchaseOrder,
      salesOrderLine: stockItem.salesOrderLine,
    }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
