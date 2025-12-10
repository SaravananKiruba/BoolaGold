// Calculate Selling Price API
// GET price for stock item based on tag ID or stock item ID

import { NextRequest, NextResponse } from 'next/server';
import { calculateSellingPriceForSale } from '@/utils/sellingPrice';
import { handleApiError, successResponse, errorResponse } from '@/utils/response';
import { getSession } from '@/lib/auth';

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
    // Get session - will throw if invalid
    let session;
    try {
      session = await getSession();
      if (!session) {
        return NextResponse.json(
          errorResponse('Unauthorized - Valid session required'),
          { status: 401 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        errorResponse('Unauthorized - Valid session required'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');
    const stockItemId = searchParams.get('stockItemId');

    if (!tagId && !stockItemId) {
      return NextResponse.json(
        { success: false, error: { message: 'Either tagId or stockItemId is required', code: 'INVALID_PARAMS' } },
        { status: 400 }
      );
    }

    const identifier = tagId || stockItemId!;
    
    if (!identifier || identifier.trim() === '') {
      return NextResponse.json(
        { success: false, error: { message: 'Stock item identifier cannot be empty', code: 'INVALID_PARAMS' } },
        { status: 400 }
      );
    }

    const priceInfo = await calculateSellingPriceForSale(identifier, session.shopId || undefined);

    if (!priceInfo) {
      return NextResponse.json(
        { success: false, error: { message: 'Could not calculate price for stock item', code: 'CALCULATION_FAILED' } },
        { status: 500 }
      );
    }

    return NextResponse.json(successResponse({
      stockItemId: priceInfo.stockItemId,
      tagId: priceInfo.tagId,
      productName: priceInfo.productName,
      sellingPrice: priceInfo.sellingPrice,
      calculation: priceInfo.calculation,
      rateDetails: priceInfo.rateDetails,
    }), { status: 200 });
  } catch (error: any) {
    console.error('Stock price calculation error:', error);
    return handleApiError(error);
  }
}
