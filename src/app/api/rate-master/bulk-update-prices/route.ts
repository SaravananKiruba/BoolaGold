// Rate Master Bulk Price Update API
// POST /api/rate-master/bulk-update-prices - Recalculate product prices based on new rate

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateMasterRepository } from '@/repositories/rateMasterRepository';
import { productRepository } from '@/repositories/productRepository';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { MetalType, AuditModule } from '@/domain/entities/types';
import { calculateProductPrice } from '@/utils/pricing';
import prisma from '@/lib/prisma';
import { logCreate } from '@/utils/audit';

const bulkUpdatePricesSchema = z.object({
  rateId: z.string().uuid(),
  productFilters: z.object({
    metalType: z.nativeEnum(MetalType).optional(),
    purity: z.string().optional(),
    collectionName: z.string().optional(),
    productIds: z.array(z.string().uuid()).optional(),
  }).optional(),
  skipCustomPrices: z.boolean().default(true),
  preview: z.boolean().default(false),
  performedBy: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = bulkUpdatePricesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Get the rate master
    const rateMaster = await rateMasterRepository.findById(data.rateId);
    if (!rateMaster) {
      return NextResponse.json(errorResponse('Rate master not found'), { status: 404 });
    }

    // Build product filter
    const productWhere: any = {
      isActive: true,
      deletedAt: null,
    };

    // Apply filters
    if (data.productFilters?.metalType) {
      productWhere.metalType = data.productFilters.metalType;
    } else {
      // If no filter specified, use rate master's metal type
      productWhere.metalType = rateMaster.metalType;
    }

    if (data.productFilters?.purity) {
      productWhere.purity = data.productFilters.purity;
    } else {
      // If no filter specified, use rate master's purity
      productWhere.purity = rateMaster.purity;
    }

    if (data.productFilters?.collectionName) {
      productWhere.collectionName = {
        contains: data.productFilters.collectionName,
        mode: 'insensitive',
      };
    }

    if (data.productFilters?.productIds && data.productFilters.productIds.length > 0) {
      productWhere.id = {
        in: data.productFilters.productIds,
      };
    }

    // Skip products with custom/fixed price if requested
    if (data.skipCustomPrices) {
      productWhere.priceOverride = null;
    }

    // Fetch matching products
    const products = await prisma.product.findMany({
      where: productWhere,
    });

    if (products.length === 0) {
      return NextResponse.json(
        errorResponse('No products found matching the criteria'),
        { status: 404 }
      );
    }

    // Calculate new prices
    const priceChanges = [];
    const skippedProducts = [];

    for (const product of products) {
      // Skip if has custom price override and skipCustomPrices is true
      if (data.skipCustomPrices && product.priceOverride) {
        skippedProducts.push({
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          reason: 'Has custom price override',
        });
        continue;
      }

      // Calculate new price
      const newPriceCalc = calculateProductPrice({
        netWeight: Number(product.netWeight),
        wastagePercent: Number(product.wastagePercent),
        metalRatePerGram: Number(rateMaster.ratePerGram),
        makingCharges: Number(product.makingCharges),
        stoneValue: product.stoneValue ? Number(product.stoneValue) : 0,
      });

      const oldPrice = product.calculatedPrice ? Number(product.calculatedPrice) : 0;
      const newPrice = newPriceCalc.totalPrice;
      const priceDifference = newPrice - oldPrice;
      const percentageChange = oldPrice > 0 ? (priceDifference / oldPrice) * 100 : 0;

      priceChanges.push({
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        metalType: product.metalType,
        purity: product.purity,
        netWeight: Number(product.netWeight),
        wastagePercent: Number(product.wastagePercent),
        effectiveWeight: newPriceCalc.effectiveWeight,
        oldRate: product.rateUsedId
          ? await rateMasterRepository.findById(product.rateUsedId).then((r) => r ? Number(r.ratePerGram) : 0)
          : 0,
        newRate: Number(rateMaster.ratePerGram),
        oldPrice,
        newPrice,
        priceDifference,
        percentageChange: Number(percentageChange.toFixed(2)),
        makingCharges: Number(product.makingCharges),
        stoneValue: product.stoneValue ? Number(product.stoneValue) : 0,
      });
    }

    // If preview mode, just return the changes without updating
    if (data.preview) {
      return NextResponse.json(
        successResponse({
          preview: true,
          totalProducts: products.length,
          productsToUpdate: priceChanges.length,
          productsSkipped: skippedProducts.length,
          priceChanges,
          skippedProducts,
          rateMaster: {
            id: rateMaster.id,
            metalType: rateMaster.metalType,
            purity: rateMaster.purity,
            ratePerGram: Number(rateMaster.ratePerGram),
            effectiveDate: rateMaster.effectiveDate,
          },
        })
      );
    }

    // Perform the actual update
    const updatePromises = priceChanges.map((change) =>
      prisma.product.update({
        where: { id: change.productId },
        data: {
          calculatedPrice: change.newPrice,
          lastPriceUpdate: new Date(),
          rateUsedId: data.rateId,
        },
      })
    );

    await Promise.all(updatePromises);

    // Log the bulk update
    await logCreate(AuditModule.RATE_MASTER, data.rateId, {
      action: 'BULK_PRICE_UPDATE',
      performedBy: data.performedBy || 'System',
      rateMasterId: data.rateId,
      metalType: rateMaster.metalType,
      purity: rateMaster.purity,
      ratePerGram: Number(rateMaster.ratePerGram),
      productsUpdated: priceChanges.length,
      productsSkipped: skippedProducts.length,
      timestamp: new Date(),
    });

    return NextResponse.json(
      successResponse({
        success: true,
        totalProducts: products.length,
        productsUpdated: priceChanges.length,
        productsSkipped: skippedProducts.length,
        priceChanges,
        skippedProducts,
        rateMaster: {
          id: rateMaster.id,
          metalType: rateMaster.metalType,
          purity: rateMaster.purity,
          ratePerGram: Number(rateMaster.ratePerGram),
          effectiveDate: rateMaster.effectiveDate,
        },
      })
    );
  } catch (error: any) {
    console.error('Error bulk updating prices:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
