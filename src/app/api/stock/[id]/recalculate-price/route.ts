// Stock Item Price Recalculation API
// Recalculate selling price based on current rate master

import { NextRequest, NextResponse } from 'next/server';
import { stockItemRepository } from '@/repositories/stockItemRepository';
import { handleApiError, successResponse } from '@/utils/response';
import { logAudit } from '@/utils/audit';
import { AuditAction, AuditModule } from '@/domain/entities/types';

/**
 * POST /api/stock/[id]/recalculate-price
 * Recalculate selling price for a stock item based on latest rate
 * 
 * This endpoint ensures prices are always based on current market rates
 * Critical for jewelry business where metal prices fluctuate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stockItemId = params.id;
    const body = await request.json();
    const { rateId, userId } = body; // Optional: specify a particular rate to use

    // Get current price before recalculation for audit
    const beforeUpdate = await stockItemRepository.findById(stockItemId);
    if (!beforeUpdate) {
      return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });
    }

    // Check if item is already sold
    if (beforeUpdate.status === 'SOLD') {
      return NextResponse.json(
        { error: 'Cannot recalculate price for sold items' },
        { status: 400 }
      );
    }

    // Check if price is manually overridden
    if (beforeUpdate.priceOverride) {
      return NextResponse.json(
        {
          error: 'Price is manually overridden. Clear override first to recalculate.',
          currentOverride: beforeUpdate.priceOverride,
          reason: beforeUpdate.priceOverrideReason,
        },
        { status: 400 }
      );
    }

    const oldPrice = Number(beforeUpdate.sellingPrice);

    // Recalculate price
    const updated = await stockItemRepository.recalculateSellingPrice(stockItemId, rateId);

    const newPrice = Number(updated.sellingPrice);
    const priceChange = newPrice - oldPrice;
    const priceChangePercent = oldPrice > 0 ? ((priceChange / oldPrice) * 100).toFixed(2) : '0';

    // Log audit
    await logAudit({
      action: AuditAction.UPDATE,
      module: AuditModule.STOCK,
      entityId: stockItemId,
      userId,
      beforeData: {
        sellingPrice: oldPrice,
        rateUsedId: beforeUpdate.rateUsedId,
        priceCalculatedAt: beforeUpdate.priceCalculatedAt,
      },
      afterData: {
        sellingPrice: newPrice,
        rateUsedId: updated.rateUsedId,
        priceCalculatedAt: updated.priceCalculatedAt,
        priceChange,
        priceChangePercent,
      },
    });

    return NextResponse.json(successResponse({
      message: 'Selling price recalculated successfully',
      stockItem: {
        id: updated.id,
        tagId: updated.tagId,
        barcode: updated.barcode,
        oldPrice,
        newPrice,
        priceChange,
        priceChangePercent: parseFloat(priceChangePercent),
        rateUsed: updated.rateUsed,
        priceCalculatedAt: updated.priceCalculatedAt,
        product: {
          name: updated.product.name,
          metalType: updated.product.metalType,
          purity: updated.product.purity,
          netWeight: updated.product.netWeight,
        },
      },
    }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/stock/[id]/recalculate-price
 * Preview price recalculation without saving
 * Useful for showing price changes before confirming
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stockItemId = params.id;
    const { searchParams } = new URL(request.url);
    const rateId = searchParams.get('rateId') || undefined;

    const stockItem = await stockItemRepository.findById(stockItemId);
    if (!stockItem) {
      return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });
    }

    // Import dependencies
    const { calculatePriceFromRate } = await import('@/utils/pricing');
    const { rateMasterRepository } = await import('@/repositories/rateMasterRepository');

    // Get current rate
    let rate;
    if (rateId) {
      rate = await rateMasterRepository.findById(rateId);
      if (!rate || !rate.isActive) {
        return NextResponse.json(
          { error: 'Invalid or inactive rate provided' },
          { status: 400 }
        );
      }
    } else {
      rate = await rateMasterRepository.getCurrentRate(
        stockItem.product.metalType,
        stockItem.product.purity
      );
      if (!rate) {
        return NextResponse.json(
          { error: `No active rate found for ${stockItem.product.metalType} ${stockItem.product.purity}` },
          { status: 404 }
        );
      }
    }

    // Calculate new price
    const { sellingPrice, calculation } = calculatePriceFromRate({
      netWeight: Number(stockItem.product.netWeight),
      wastagePercent: Number(stockItem.product.wastagePercent),
      metalRatePerGram: Number(rate.ratePerGram),
      makingCharges: Number(stockItem.product.makingCharges),
      stoneValue: stockItem.product.stoneValue ? Number(stockItem.product.stoneValue) : 0,
    });

    const currentPrice = stockItem.priceOverride 
      ? Number(stockItem.priceOverride)
      : Number(stockItem.sellingPrice);
    
    const priceChange = sellingPrice - currentPrice;
    const priceChangePercent = currentPrice > 0 
      ? ((priceChange / currentPrice) * 100).toFixed(2) 
      : '0';

    return NextResponse.json(successResponse({
      preview: true,
      stockItem: {
        id: stockItem.id,
        tagId: stockItem.tagId,
        barcode: stockItem.barcode,
      },
      currentPrice,
      newPrice: sellingPrice,
      priceChange,
      priceChangePercent: parseFloat(priceChangePercent),
      hasOverride: !!stockItem.priceOverride,
      calculation,
      rateUsed: {
        id: rate.id,
        metalType: rate.metalType,
        purity: rate.purity,
        ratePerGram: rate.ratePerGram,
        effectiveDate: rate.effectiveDate,
      },
      product: {
        name: stockItem.product.name,
        metalType: stockItem.product.metalType,
        purity: stockItem.product.purity,
        netWeight: stockItem.product.netWeight,
        wastagePercent: stockItem.product.wastagePercent,
        makingCharges: stockItem.product.makingCharges,
        stoneValue: stockItem.product.stoneValue,
      },
    }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
