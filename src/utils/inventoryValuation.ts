/**
 * Inventory Valuation Utilities
 * 
 * Different valuation methods for Retail vs Wholesale shops
 */

import { calculatePureMetalContent } from './metalConversion';

export type ShopBusinessType = 'RETAIL' | 'WHOLESALE';

export interface StockItem {
  id: string;
  productId: string;
  purchaseCost: number;
  acquisitionType: 'CASH_PURCHASE' | 'METAL_EXCHANGE_IN';
  exchangeDetails?: {
    inputWeight: number;
    inputPurity: string;
    outputWeight: number;
    outputPurity: string;
  };
}

export interface Product {
  metalType: string;
  purity: string;
  netWeight: number;
}

export interface RateMaster {
  metalType: string;
  ratePerGram: number;
}

/**
 * Calculate inventory value for retail shop
 * Uses actual purchase cost (historical cost method)
 */
export function calculateRetailInventoryValue(
  stockItems: StockItem[]
): number {
  const totalValue = stockItems.reduce((sum, item) => {
    return sum + Number(item.purchaseCost);
  }, 0);

  return parseFloat(totalValue.toFixed(2));
}

/**
 * Calculate inventory value for wholesale shop
 * Uses pure metal content × current market rate (market value method)
 * Revalued daily as market rates change
 */
export function calculateWholesaleInventoryValue(
  stockItems: StockItem[],
  products: Map<string, Product>,
  rates: Map<string, number>
): number {
  let totalValue = 0;

  for (const item of stockItems) {
    const product = products.get(item.productId);
    if (!product) continue;

    // Calculate pure metal content
    const pureContent = calculatePureMetalContent(
      Number(product.netWeight),
      product.purity
    );

    // Get current market rate for this metal type
    const currentRate = rates.get(product.metalType) || 0;

    // Value = pure metal content × current rate
    const itemValue = pureContent * currentRate;
    totalValue += itemValue;
  }

  return parseFloat(totalValue.toFixed(2));
}

/**
 * Calculate total pure metal content in inventory
 * Useful for wholesale shops to track actual metal stock
 */
export function calculateTotalPureMetalContent(
  stockItems: StockItem[],
  products: Map<string, Product>,
  metalType: string
): number {
  let totalPureContent = 0;

  for (const item of stockItems) {
    const product = products.get(item.productId);
    if (!product || product.metalType !== metalType) continue;

    const pureContent = calculatePureMetalContent(
      Number(product.netWeight),
      product.purity
    );
    totalPureContent += pureContent;
  }

  return parseFloat(totalPureContent.toFixed(3));
}

/**
 * Calculate inventory value breakdown by metal type
 */
export interface InventoryBreakdown {
  metalType: string;
  itemCount: number;
  totalGrossWeight: number;
  totalNetWeight: number;
  totalPureContent: number;
  totalValue: number;
  averageRate: number;
}

export function calculateInventoryBreakdown(
  stockItems: StockItem[],
  products: Map<string, Product>,
  rates: Map<string, number>,
  shopBusinessType: ShopBusinessType
): InventoryBreakdown[] {
  const breakdown = new Map<string, InventoryBreakdown>();

  for (const item of stockItems) {
    const product = products.get(item.productId);
    if (!product) continue;

    const metalType = product.metalType;

    if (!breakdown.has(metalType)) {
      breakdown.set(metalType, {
        metalType,
        itemCount: 0,
        totalGrossWeight: 0,
        totalNetWeight: 0,
        totalPureContent: 0,
        totalValue: 0,
        averageRate: 0,
      });
    }

    const data = breakdown.get(metalType)!;
    data.itemCount++;
    data.totalNetWeight += Number(product.netWeight);

    const pureContent = calculatePureMetalContent(
      Number(product.netWeight),
      product.purity
    );
    data.totalPureContent += pureContent;

    if (shopBusinessType === 'RETAIL') {
      // Use purchase cost
      data.totalValue += Number(item.purchaseCost);
    } else {
      // WHOLESALE: Use market value
      const currentRate = rates.get(metalType) || 0;
      data.totalValue += pureContent * currentRate;
    }
  }

  // Calculate average rates
  for (const data of breakdown.values()) {
    if (data.totalPureContent > 0) {
      data.averageRate = data.totalValue / data.totalPureContent;
    }
    // Round values
    data.totalNetWeight = parseFloat(data.totalNetWeight.toFixed(3));
    data.totalPureContent = parseFloat(data.totalPureContent.toFixed(3));
    data.totalValue = parseFloat(data.totalValue.toFixed(2));
    data.averageRate = parseFloat(data.averageRate.toFixed(2));
  }

  return Array.from(breakdown.values());
}

/**
 * Calculate daily inventory revaluation for wholesale
 * Shows change in inventory value due to market rate changes
 */
export function calculateInventoryRevaluation(
  currentValue: number,
  previousValue: number
): {
  change: number;
  percentageChange: number;
} {
  const change = currentValue - previousValue;
  const percentageChange =
    previousValue > 0 ? (change / previousValue) * 100 : 0;

  return {
    change: parseFloat(change.toFixed(2)),
    percentageChange: parseFloat(percentageChange.toFixed(2)),
  };
}

/**
 * Get valuation method for shop type
 */
export function getValuationMethod(
  shopBusinessType: ShopBusinessType
): string {
  if (shopBusinessType === 'RETAIL') {
    return 'Historical Cost (Purchase Price)';
  }
  return 'Market Value (Pure Metal × Current Rate)';
}
