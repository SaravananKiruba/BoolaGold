// Stock Search API - Search by tag ID or barcode

import { NextRequest, NextResponse } from 'next/server';
import { stockItemRepository } from '@/repositories/stockItemRepository';
import { handleApiError, successResponse } from '@/utils/response';

/**
 * GET /api/stock/search
 * Search for stock item by tag ID or barcode
 * 
 * User Story 8: Stock Availability Check - Quick lookup
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const tagId = searchParams.get('tagId');
    const barcode = searchParams.get('barcode');

    if (!tagId && !barcode) {
      return NextResponse.json(
        { error: 'Either tagId or barcode is required' },
        { status: 400 }
      );
    }

    let stockItem = null;

    if (tagId) {
      stockItem = await stockItemRepository.findByTagId(tagId);
    } else if (barcode) {
      stockItem = await stockItemRepository.findByBarcode(barcode);
    }

    if (!stockItem) {
      return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });
    }

    return successResponse({
      stockItem: {
        id: stockItem.id,
        tagId: stockItem.tagId,
        barcode: stockItem.barcode,
        status: stockItem.status,
        purchaseCost: stockItem.purchaseCost,
        sellingPrice: stockItem.sellingPrice,
        purchaseDate: stockItem.purchaseDate,
        saleDate: stockItem.saleDate,
        product: {
          id: stockItem.product.id,
          name: stockItem.product.name,
          metalType: stockItem.product.metalType,
          purity: stockItem.product.purity,
          grossWeight: stockItem.product.grossWeight,
          netWeight: stockItem.product.netWeight,
          stoneWeight: stockItem.product.stoneWeight,
          stoneValue: stockItem.product.stoneValue,
          makingCharges: stockItem.product.makingCharges,
          wastagePercent: stockItem.product.wastagePercent,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
