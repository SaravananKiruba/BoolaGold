// Stock Item Price Calculation API
// NOTE: This endpoint is deprecated - selling prices are calculated dynamically at checkout

import { NextRequest, NextResponse } from 'next/server';

import { handleApiError, errorResponse } from '@/utils/response';
import { getRepositories } from '@/utils/apiRepository';
import { getSession } from '@/lib/auth';

/**
 * POST /api/stock/[id]/recalculate-price
 * DEPRECATED: Selling prices are now calculated dynamically at checkout
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;
let repos;
    try {
      repos = await getRepositories(request);
    } catch (authError: any) {
      return NextResponse.json(
        errorResponse('Unauthorized - Valid session required'),
        { status: 401 }
      );
    }

    const stockItemId = id;

    const stockItem = await repos.stockItem.findById(stockItemId);
    if (!stockItem) {
      return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });
    }

    // Selling prices are calculated dynamically at checkout, not stored
    return NextResponse.json(
      {
        message: 'Selling prices are calculated dynamically at checkout based on current market rates',
        stockItemId,
        purchaseCost: Number(stockItem.purchaseCost),
        note: 'No recalculation needed - prices are determined at point of sale'
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/stock/[id]/recalculate-price
 * Preview current selling price calculation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;
let repos;
    try {
      repos = await getRepositories(request);
    } catch (authError: any) {
      return NextResponse.json(
        errorResponse('Unauthorized - Valid session required'),
        { status: 401 }
      );
    }

    const stockItemId = id;

    const stockItem = await repos.stockItem.findById(stockItemId);
    if (!stockItem) {
      return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });
    }

    // Import dependencies
    const { calculatePriceFromRate } = await import('@/utils/pricing');
    const { RateMasterRepository } = await import('@/repositories/rateMasterRepository');

    // Get current rate
    const rate = await repos.rateMaster.getCurrentRate(
      stockItem.product.metalType as any,
      stockItem.product.purity
    );
    
    if (!rate) {
      return NextResponse.json(
        { error: `No active rate found for ${stockItem.product.metalType} ${stockItem.product.purity}` },
        { status: 404 }
      );
    }

    // Calculate current selling price
    const { sellingPrice, calculation } = calculatePriceFromRate({
      netWeight: Number(stockItem.product.netWeight),
      wastagePercent: Number(stockItem.product.wastagePercent),
      metalRatePerGram: Number(rate.ratePerGram),
      makingCharges: Number(stockItem.product.makingCharges),
      stoneValue: stockItem.product.stoneValue ? Number(stockItem.product.stoneValue) : 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        stockItem: {
          id: stockItem.id,
          tagId: stockItem.tagId,
          barcode: stockItem.barcode,
        },
        purchaseCost: Number(stockItem.purchaseCost),
        currentSellingPrice: sellingPrice,
        calculation,
        rateUsed: {
          id: rate.id,
          metalType: rate.metalType,
          purity: rate.purity,
          ratePerGram: Number(rate.ratePerGram),
        },
        product: {
          name: stockItem.product.name,
          metalType: stockItem.product.metalType,
          purity: stockItem.product.purity,
          netWeight: Number(stockItem.product.netWeight),
          wastagePercent: Number(stockItem.product.wastagePercent),
          makingCharges: Number(stockItem.product.makingCharges),
          stoneValue: stockItem.product.stoneValue ? Number(stockItem.product.stoneValue) : 0,
        },
      },
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
