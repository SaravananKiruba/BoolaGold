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

import { rateMasterRepository } from '@/repositories/rateMasterRepository';
import { stockItemRepository } from '@/repositories/stockItemRepository';
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
 * @param stockItemId Stock item ID or Tag ID
 * @returns Complete selling price calculation with breakdown
 */
export async function calculateSellingPriceForSale(
  stockItemIdOrTag: string
): Promise<SellingPriceResult> {
  // Get stock item with product details
  let stockItem = await stockItemRepository.findById(stockItemIdOrTag);
  
  if (!stockItem) {
    // Try by tag ID
    stockItem = await stockItemRepository.findByTagId(stockItemIdOrTag);
  }

  if (!stockItem) {
    throw new Error(`Stock item not found: ${stockItemIdOrTag}`);
  }

  // Validate stock item is available for sale
  if (stockItem.status === 'SOLD') {
    throw new Error(`Stock item ${stockItem.tagId} is already sold`);
  }

  const product = stockItem.product;

  // Get LATEST active rate for this metal type and purity
  const currentRate = await rateMasterRepository.getCurrentRate(
    product.metalType,
    product.purity
  );

  if (!currentRate) {
    throw new Error(
      `No active rate found for ${product.metalType} ${product.purity}. ` +
      `Please set up rate master before creating sales order.`
    );
  }

  // Calculate selling price using product specs + latest rate
  const { sellingPrice, calculation } = calculatePriceFromRate({
    netWeight: Number(product.netWeight),
    wastagePercent: Number(product.wastagePercent),
    metalRatePerGram: Number(currentRate.ratePerGram),
    makingCharges: Number(product.makingCharges),
    stoneValue: product.stoneValue ? Number(product.stoneValue) : 0,
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
      ratePerGram: Number(currentRate.ratePerGram),
      effectiveDate: currentRate.effectiveDate,
    },
  };
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
