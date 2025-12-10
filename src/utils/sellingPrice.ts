/**
 * SELLING PRICE CALCULATION SYSTEM
 * 
 * HOW IT WORKS:
 * 1. Purchase Order: Store ONLY purchase cost (what you paid supplier)
 * 2. Stock Item: Created with purchase cost only, NO selling price
 * 3. Sales Order: Selling price calculated automatically:
 *    - Get product specs (weight, wastage, making charges) from Tag ID
 *    - Get LATEST rate from Rate Master (today's gold/silver rate)
 *    - Calculate: (Net Weight × (1 + Wastage%) × Rate) + Making Charges + Stone Value
 * 
 * BENEFITS:
 * - Always use current market rate
 * - No manual price entry
 * - No stale prices
 * - Automatic price updates when rate changes
 * 
 * USAGE:
 * - PO: Only ask purchaseCost
 * - SO: Call calculateSellingPriceForSale(tagId) - automatic!
 */

import { RateMasterRepository } from '@/repositories/rateMasterRepository';
import { calculatePriceFromRate } from '@/utils/pricing';

export interface SellingPriceResult {
  stockItemId: string;
  tagId: string;
  productName: string;
  sellingPrice: number;
  calculation: {
    netWeight: number;
    wastagePercent: number;
    effectiveWeight: number;
    metalRatePerGram: number;
    metalAmount: number;
    makingCharges: number;
    stoneValue: number;
    totalPrice: number;
  };
  rateDetails: {
    metalType: string;
    purity: string;
    ratePerGram: number;
    effectiveDate: Date;
  };
}

/**
 * Calculate selling price for a stock item at SALES time
 * This is the ONLY place where selling price is calculated!
 * 
 * @param stockItemIdOrTag Stock item ID or Tag ID
 * @param shopId Shop ID for multi-tenant filtering (optional, derives from product if not provided)
 * @returns Complete selling price calculation with breakdown
 */
export async function calculateSellingPriceForSale(
  stockItemIdOrTag: string,
  shopId?: string
): Promise<SellingPriceResult> {
  try {
    // Validate inputs
    if (!stockItemIdOrTag || stockItemIdOrTag.trim() === '') {
      throw new Error('Stock item ID or Tag ID is required');
    }

    // Get stock item with product details using direct query to handle missing shopId gracefully
    const stockItem = await getStockItemWithValidation(stockItemIdOrTag, shopId);

    if (!stockItem) {
      throw new Error(`Stock item not found: ${stockItemIdOrTag}`);
    }

    // Validate stock item is available for sale
    if (stockItem.status === 'SOLD') {
      throw new Error(`Stock item ${stockItem.tagId} is already sold`);
    }

    const product = stockItem.product;

    // Validate product exists and has required fields
    if (!product) {
      throw new Error(`Product not found for stock item ${stockItemIdOrTag}`);
    }

    if (!product.metalType) {
      throw new Error(`Product has no metal type specified`);
    }

    if (!product.purity) {
      throw new Error(`Product has no purity specified`);
    }

    // Determine which shop to use for rate lookup
    const effectiveShopId = shopId || product.shopId;

    if (!effectiveShopId) {
      throw new Error('Shop context is required to calculate price');
    }

    // Create repository with shop context
    const rateMasterRepo = new RateMasterRepository({ session: { shopId: effectiveShopId, userId: '' } as any });
    const currentRate = await rateMasterRepo.getCurrentRate(
      product.metalType,
      product.purity
    );

    if (!currentRate) {
      throw new Error(
        `No active rate found for ${product.metalType} ${product.purity}. ` +
        `Please configure rate master with active rates before calculating prices.`
      );
    }

    // Validate rate has required fields
    if (currentRate.ratePerGram === null || currentRate.ratePerGram === undefined) {
      throw new Error(`Rate master has invalid rate per gram value`);
    }

    // Convert all values to numbers and validate
    const netWeight = Number(product.netWeight);
    const wastagePercent = Number(product.wastagePercent);
    const makingCharges = Number(product.makingCharges);
    const stoneValue = product.stoneValue ? Number(product.stoneValue) : 0;
    const ratePerGram = Number(currentRate.ratePerGram);

    // Validate all required values are numbers and valid
    if (isNaN(netWeight) || netWeight <= 0) {
      throw new Error(`Invalid net weight: ${product.netWeight}`);
    }
    if (isNaN(wastagePercent)) {
      throw new Error(`Invalid wastage percent: ${product.wastagePercent}`);
    }
    if (isNaN(makingCharges)) {
      throw new Error(`Invalid making charges: ${product.makingCharges}`);
    }
    if (isNaN(ratePerGram) || ratePerGram <= 0) {
      throw new Error(`Invalid rate per gram: ${ratePerGram}`);
    }

    // Calculate selling price
    const { sellingPrice, calculation } = calculatePriceFromRate({
      netWeight,
      wastagePercent,
      metalRatePerGram: ratePerGram,
      makingCharges,
      stoneValue,
    });

    return {
      stockItemId: stockItem.id,
      tagId: stockItem.tagId,
      productName: product.name,
      sellingPrice,
      calculation: {
        netWeight: calculation.netWeight,
        wastagePercent: calculation.wastagePercent,
        effectiveWeight: calculation.effectiveWeight,
        metalRatePerGram: calculation.metalRatePerGram,
        metalAmount: calculation.metalAmount,
        makingCharges: calculation.makingCharges,
        stoneValue: calculation.stoneValue,
        totalPrice: calculation.totalPrice,
      },
      rateDetails: {
        metalType: currentRate.metalType,
        purity: currentRate.purity,
        ratePerGram: ratePerGram,
        effectiveDate: currentRate.effectiveDate,
      },
    };
  } catch (error: any) {
    console.error('Error calculating selling price:', error);
    throw error;
  }
}

/**
 * Internal helper to get stock item with proper validation
 * Queries by both ID and tagId, with optional shop filtering
 */
async function getStockItemWithValidation(
  stockItemIdOrTag: string,
  shopId?: string
) {
  const prisma = (await import('@/lib/prisma')).default;

  // First try by ID
  let stockItem = await prisma.stockItem.findFirst({
    where: {
      id: stockItemIdOrTag,
      deletedAt: null,
      ...(shopId && { product: { shopId } }),
    },
    include: {
      product: true,
      purchaseOrder: true,
      salesOrderLine: true,
    },
  });

  if (stockItem) {
    return stockItem;
  }

  // Try by tag ID
  stockItem = await prisma.stockItem.findFirst({
    where: {
      tagId: stockItemIdOrTag,
      deletedAt: null,
      ...(shopId && { product: { shopId } }),
    },
    include: {
      product: true,
      purchaseOrder: true,
      salesOrderLine: true,
    },
  });

  return stockItem || null;
}

/**
 * Calculate selling prices for multiple stock items
 * Used when creating sales order with multiple items
 */
export async function calculateSellingPricesForSale(
  stockItemIdsOrTags: string[]
): Promise<SellingPriceResult[]> {
  const results: SellingPriceResult[] = [];

  for (const idOrTag of stockItemIdsOrTags) {
    const result = await calculateSellingPriceForSale(idOrTag);
    results.push(result);
  }

  return results;
}
