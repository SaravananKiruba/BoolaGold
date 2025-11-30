// Product Price Breakdown API
// GET /api/products/[id]/price-breakdown - Get detailed price calculation breakdown

import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/repositories/productRepository';
import { successResponse, errorResponse, notFoundResponse } from '@/utils/response';
import { calculateProductPrice } from '@/utils/pricing';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await productRepository.findById(params.id);

    if (!product) {
      return NextResponse.json(notFoundResponse('Product'), { status: 404 });
    }

    // Get the current rate for this product
    const currentRate = await prisma.rateMaster.findFirst({
      where: {
        metalType: product.metalType,
        purity: product.purity,
        isActive: true,
      },
      orderBy: {
        effectiveDate: 'desc',
      },
    });

    if (!currentRate) {
      return NextResponse.json(
        errorResponse('No active rate found for this metal type and purity'),
        { status: 404 }
      );
    }

    // Calculate current price
    const currentPriceCalc = calculateProductPrice({
      netWeight: Number(product.netWeight),
      wastagePercent: Number(product.wastagePercent),
      metalRatePerGram: Number(currentRate.ratePerGram),
      makingCharges: Number(product.makingCharges),
      stoneValue: Number(product.stoneValue || 0),
    });

    // Get the rate used for stored price
    let storedPriceCalc = null;
    let priceOutdated = false;

    if (product.rateUsed) {
      storedPriceCalc = calculateProductPrice({
        netWeight: Number(product.netWeight),
        wastagePercent: Number(product.wastagePercent),
        metalRatePerGram: Number(product.rateUsed.ratePerGram),
        makingCharges: Number(product.makingCharges),
        stoneValue: Number(product.stoneValue || 0),
      });

      // Check if price is outdated
      priceOutdated =
        product.rateUsedId !== currentRate.id ||
        Number(product.rateUsed.ratePerGram) !== Number(currentRate.ratePerGram);
    }

    const breakdown = {
      product: {
        id: product.id,
        name: product.name,
        metalType: product.metalType,
        purity: product.purity,
        grossWeight: Number(product.grossWeight),
        netWeight: Number(product.netWeight),
        wastagePercent: Number(product.wastagePercent),
        makingCharges: Number(product.makingCharges),
        stoneWeight: product.stoneWeight ? Number(product.stoneWeight) : null,
        stoneValue: product.stoneValue ? Number(product.stoneValue) : null,
        priceOverride: product.priceOverride ? Number(product.priceOverride) : null,
        priceOverrideReason: product.priceOverrideReason,
        lastPriceUpdate: product.lastPriceUpdate,
      },
      currentRate: {
        id: currentRate.id,
        metalType: currentRate.metalType,
        purity: currentRate.purity,
        ratePerGram: Number(currentRate.ratePerGram),
        effectiveDate: currentRate.effectiveDate,
        rateSource: currentRate.rateSource,
      },
      currentPriceCalculation: currentPriceCalc,
      storedPrice: {
        calculatedPrice: product.calculatedPrice ? Number(product.calculatedPrice) : null,
        rateUsed: product.rateUsed
          ? {
              id: product.rateUsed.id,
              ratePerGram: Number(product.rateUsed.ratePerGram),
              effectiveDate: product.rateUsed.effectiveDate,
            }
          : null,
        calculation: storedPriceCalc,
        lastPriceUpdate: product.lastPriceUpdate,
      },
      finalPrice: product.priceOverride
        ? Number(product.priceOverride)
        : product.calculatedPrice
        ? Number(product.calculatedPrice)
        : currentPriceCalc.totalPrice,
      priceStatus: {
        isOverridden: !!product.priceOverride,
        isOutdated: priceOutdated,
        priceDifference: priceOutdated
          ? currentPriceCalc.totalPrice - (storedPriceCalc?.totalPrice || 0)
          : 0,
      },
    };

    return NextResponse.json(successResponse(breakdown));
  } catch (error: any) {
    console.error('Error getting price breakdown:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
