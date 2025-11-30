// Stock Summary API - Get overall inventory summary

import { NextRequest } from 'next/server';
import { stockItemRepository } from '@/repositories/stockItemRepository';
import { productRepository } from '@/repositories/productRepository';
import { handleApiError, successResponse } from '@/utils/response';

/**
 * GET /api/stock/summary
 * Get overall inventory summary and value
 * 
 * User Story 8: Stock Availability Check - Stock summary and total inventory value
 */
export async function GET(request: NextRequest) {
  try {
    // Get inventory value based on purchase cost
    const purchaseValue = await stockItemRepository.getInventoryValue('purchase');

    // Get inventory value based on selling price
    const sellingValue = await stockItemRepository.getInventoryValue('selling');

    // Get low stock products
    const lowStockProducts = await productRepository.getLowStockProducts();

    // Get inventory summary by metal type
    const inventorySummary = await productRepository.getInventorySummary();

    return NextResponse.json(successResponse({
      totalInventory: {
        items: purchaseValue.totalItems,
        purchaseValue: purchaseValue.totalValue,
        sellingValue: sellingValue.totalValue,
        potentialProfit: Number(sellingValue.totalValue) - Number(purchaseValue.totalValue),
      },
      lowStockAlerts: {
        count: lowStockProducts.length,
        products: lowStockProducts.map((product) => ({
          id: product.id,
          name: product.name,
          metalType: product.metalType,
          purity: product.purity,
          availableQuantity: product._count.stockItems,
          reorderLevel: product.reorderLevel,
        })),
      },
      byMetalType: inventorySummary.map((item) => ({
        metalType: item.metalType,
        productCount: item._count.id,
        totalWeight: item._sum.netWeight || 0,
        totalValue: item._sum.calculatedPrice || 0,
      })),
    }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
