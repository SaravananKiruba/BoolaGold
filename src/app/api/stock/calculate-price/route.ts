// Calculate Selling Price API
// GET price for stock item based on tag ID or stock item ID

import { NextRequest, NextResponse } from 'next/server';
import { calculateSellingPriceForSale } from '@/utils/sellingPrice';
import { handleApiError, successResponse } from '@/utils/response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stock/calculate-price?tagId=xxx
 * GET /api/stock/calculate-price?stockItemId=xxx
 * 
 * Calculate selling price for a stock item using:
 * - Product specifications (weight, wastage, making charges)
 * - Latest rate from Rate Master
 * 
 * Used when:
 * - Creating sales order (to show price to customer)
 * - Scanning barcode/tag at POS
 * - Price inquiry
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');
    const stockItemId = searchParams.get('stockItemId');

    if (!tagId && !stockItemId) {
      return NextResponse.json(
        { error: 'Either tagId or stockItemId is required' },
        { status: 400 }
      );
    }

    const identifier = tagId || stockItemId!;
    const priceInfo = await calculateSellingPriceForSale(identifier);

    return NextResponse.json(successResponse({
      stockItemId: priceInfo.stockItemId,
      tagId: priceInfo.tagId,
      productName: priceInfo.productName,
      sellingPrice: priceInfo.sellingPrice,
      calculation: priceInfo.calculation,
      rateDetails: priceInfo.rateDetails,
    }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
