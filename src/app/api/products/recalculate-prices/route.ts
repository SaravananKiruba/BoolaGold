// Bulk Product Price Recalculation API
// POST /api/products/recalculate-prices - Recalculate prices for products based on current rates

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { calculateProductPrice } from '@/utils/pricing';
import { MetalType, AuditModule } from '@/domain/entities/types';
import { logUpdate } from '@/utils/audit';
import prisma from '@/lib/prisma';

const recalculatePricesSchema = z.object({
  productIds: z.array(z.string().uuid()).optional(),
  metalType: z.nativeEnum(MetalType).optional(),
  purity: z.string().optional(),
  collectionName: z.string().optional(),
  onlyOutdated: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = recalculatePricesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Build filter for products to update
    const where: any = {
      isActive: true,
      deletedAt: null,
      priceOverride: null, // Don't recalculate overridden prices
    };

    if (data.productIds && data.productIds.length > 0) {
      where.id = { in: data.productIds };
    }

    if (data.metalType) {
      where.metalType = data.metalType;
    }

    if (data.purity) {
      where.purity = data.purity;
    }

    if (data.collectionName) {
      where.collectionName = { contains: data.collectionName };
    }

    // Get products to update
    const products = await prisma.product.findMany({
      where,
      include: {
        rateUsed: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json(
        successResponse({
          message: 'No products found matching the criteria',
          updated: 0,
          skipped: 0,
          products: [],
        })
      );
    }

    const updates = [];
    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Get current active rate for this product
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
        skippedCount++;
        updates.push({
          productId: product.id,
          productName: product.name,
          status: 'skipped',
          reason: 'No active rate found',
        });
        continue;
      }

      // Check if price is already up-to-date
      if (data.onlyOutdated) {
        if (
          product.rateUsedId === currentRate.id &&
          product.lastPriceUpdate &&
          product.lastPriceUpdate >= currentRate.effectiveDate
        ) {
          skippedCount++;
          updates.push({
            productId: product.id,
            productName: product.name,
            status: 'skipped',
            reason: 'Price already up-to-date',
          });
          continue;
        }
      }

      // Calculate new price
      const priceCalc = calculateProductPrice({
        netWeight: Number(product.netWeight),
        wastagePercent: Number(product.wastagePercent),
        metalRatePerGram: Number(currentRate.ratePerGram),
        makingCharges: Number(product.makingCharges),
        stoneValue: Number(product.stoneValue || 0),
      });

      const oldPrice = product.calculatedPrice ? Number(product.calculatedPrice) : null;
      const newPrice = priceCalc.totalPrice;

      // Update product
      await prisma.product.update({
        where: { id: product.id },
        data: {
          calculatedPrice: newPrice,
          lastPriceUpdate: new Date(),
          rateUsedId: currentRate.id,
        },
      });

      // Log the update
      await logUpdate(
        AuditModule.PRODUCTS,
        product.id,
        { calculatedPrice: oldPrice },
        { calculatedPrice: newPrice },
        session!.shopId!
      );

      updatedCount++;
      updates.push({
        productId: product.id,
        productName: product.name,
        status: 'updated',
        oldPrice,
        newPrice,
        priceDifference: oldPrice ? newPrice - oldPrice : null,
        rateUsed: {
          id: currentRate.id,
          ratePerGram: Number(currentRate.ratePerGram),
          effectiveDate: currentRate.effectiveDate,
        },
      });
    }

    return NextResponse.json(
      successResponse({
        message: `Successfully recalculated prices for ${updatedCount} products`,
        updated: updatedCount,
        skipped: skippedCount,
        total: products.length,
        products: updates,
      })
    );
  } catch (error: any) {
    console.error('Error recalculating prices:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
