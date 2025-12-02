// Rate Master Bulk Price Update API - Robust Implementation with Transaction Support
// POST /api/rate-master/bulk-update-prices - Recalculate product prices based on new rate

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateMasterRepository } from '@/repositories/rateMasterRepository';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { MetalType, AuditModule } from '@/domain/entities/types';
import { calculateProductPrice } from '@/utils/pricing';
import prisma from '@/lib/prisma';
import { logCreate } from '@/utils/audit';

const bulkUpdatePricesSchema = z.object({
  rateId: z.string().uuid({ message: 'Invalid rate ID format' }),
  productFilters: z.object({
    metalType: z.nativeEnum(MetalType, { 
      errorMap: () => ({ message: 'Metal type must be GOLD, SILVER, or PLATINUM' }) 
    }).optional(),
    purity: z.string().trim().optional(),
    collectionName: z.string().trim().optional(),
    productIds: z.array(z.string().uuid({ message: 'Invalid product ID format' })).optional(),
  }).optional(),
  skipCustomPrices: z.boolean().default(true),
  preview: z.boolean().default(false),
  performedBy: z.string().max(100).trim().optional(),
});

interface PriceChange {
  productId: string;
  productName: string;
  barcode: string;
  metalType: string;
  purity: string;
  netWeight: number;
  wastagePercent: number;
  effectiveWeight: number;
  oldRate: number;
  newRate: number;
  oldPrice: number;
  newPrice: number;
  priceDifference: number;
  percentageChange: number;
  makingCharges: number;
  stoneValue: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = bulkUpdatePricesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Get and validate the rate master
    const rateMaster = await rateMasterRepository.findById(data.rateId);
    if (!rateMaster) {
      return NextResponse.json(errorResponse('Rate master not found'), { status: 404 });
    }

    // Check if rate is currently valid
    const isValid = await rateMasterRepository.isRateValid(data.rateId);
    if (!isValid) {
      return NextResponse.json(
        errorResponse('Selected rate is not currently active or valid'),
        { status: 400 }
      );
    }

    // Build product filter with proper typing
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
        mode: 'insensitive' as const,
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
      select: {
        id: true,
        name: true,
        barcode: true,
        metalType: true,
        purity: true,
        netWeight: true,
        wastagePercent: true,
        makingCharges: true,
        stoneValue: true,
        calculatedPrice: true,
        priceOverride: true,
        rateUsedId: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json(
        errorResponse('No products found matching the criteria'),
        { status: 404 }
      );
    }

    // Calculate new prices
    const priceChanges: PriceChange[] = [];
    const skippedProducts: any[] = [];

    // Fetch old rates in bulk for efficiency
    const oldRateIds = [...new Set(products.map(p => p.rateUsedId).filter(Boolean))] as string[];
    const oldRatesMap = new Map();
    
    if (oldRateIds.length > 0) {
      const oldRates = await Promise.all(
        oldRateIds.map(id => rateMasterRepository.findById(id))
      );
      oldRates.forEach(rate => {
        if (rate) oldRatesMap.set(rate.id, Number(rate.ratePerGram));
      });
    }

    for (const product of products) {
      try {
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

        const oldRate = product.rateUsedId ? (oldRatesMap.get(product.rateUsedId) || 0) : 0;

        priceChanges.push({
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          metalType: product.metalType,
          purity: product.purity,
          netWeight: Number(product.netWeight),
          wastagePercent: Number(product.wastagePercent),
          effectiveWeight: newPriceCalc.effectiveWeight,
          oldRate,
          newRate: Number(rateMaster.ratePerGram),
          oldPrice,
          newPrice,
          priceDifference,
          percentageChange: Number(percentageChange.toFixed(2)),
          makingCharges: Number(product.makingCharges),
          stoneValue: product.stoneValue ? Number(product.stoneValue) : 0,
        });
      } catch (calcError: any) {
        console.error(`Error calculating price for product ${product.id}:`, calcError);
        skippedProducts.push({
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          reason: `Calculation error: ${calcError.message}`,
        });
      }
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
            isActive: rateMaster.isActive,
          },
        }, 'Price preview generated successfully')
      );
    }

    // Perform the actual update with transaction support
    try {
      await prisma.$transaction(async (tx) => {
        // Update all products in a single transaction
        const updatePromises = priceChanges.map((change) =>
          tx.product.update({
            where: { id: change.productId },
            data: {
              calculatedPrice: change.newPrice,
              lastPriceUpdate: new Date(),
              rateUsedId: data.rateId,
            },
          })
        );

        await Promise.all(updatePromises);
      });

      // Log the bulk update
      try {
        await logCreate(AuditModule.RATE_MASTER, data.rateId, {
          action: 'BULK_PRICE_UPDATE',
          performedBy: data.performedBy || 'System',
          rateMasterId: data.rateId,
          metalType: rateMaster.metalType,
          purity: rateMaster.purity,
          ratePerGram: Number(rateMaster.ratePerGram),
          productsUpdated: priceChanges.length,
          productsSkipped: skippedProducts.length,
          filters: data.productFilters,
          timestamp: new Date(),
        });
      } catch (auditError) {
        console.error('Audit log failed:', auditError);
        // Don't fail the request if audit logging fails
      }

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
            isActive: rateMaster.isActive,
          },
        }, `Successfully updated ${priceChanges.length} products`)
      );
    } catch (updateError: any) {
      console.error('Transaction failed:', updateError);
      throw new Error(`Failed to update products: ${updateError.message}`);
    }
  } catch (error: any) {
    console.error('Error bulk updating prices:', error);
    return NextResponse.json(
      errorResponse(error.message || 'Failed to perform bulk price update'),
      { status: 500 }
    );
  }
}
