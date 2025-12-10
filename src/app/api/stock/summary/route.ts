// Stock Summary API - Get overall inventory summary

import { NextRequest, NextResponse } from 'next/server';


import { handleApiError, successResponse } from '@/utils/response';
import { getRepositories } from '@/utils/apiRepository';

// Cache duration: 5 minutes for stock summary
const CACHE_DURATION = 5 * 60 * 1000;
let cachedData: any = null;
let cacheTimestamp: number = 0;

/**
 * GET /api/stock/summary
 * Get overall inventory summary and value
 * 
 * User Story 8: Stock Availability Check - Stock summary and total inventory value
 */
export async function GET(_request: NextRequest) {
  try {
    const repos = await getRepositories(_request);
    // Check if we have valid cached data
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      const response = NextResponse.json(successResponse(cachedData), { status: 200 });
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      return response;
    }
    // Get inventory value based on purchase cost ONLY
    // Note: Selling prices are calculated dynamically at sale time using current rates
    // We don't store or aggregate selling prices as they change with market rates
    const inventoryValue = await repos.stockItem.getInventoryValue();

    // Get low stock products
    const lowStockProducts = await repos.product.getLowStockProducts();

    // Get inventory summary by metal type - Fixed to show actual stock items
    const inventorySummary = await repos.stockItem.getStockSummaryByMetalType();

    const responseData = {
      totalInventory: {
        items: inventoryValue.totalItems,
        purchaseValue: inventoryValue.totalValue,
        // Note: Selling value not included as prices are calculated dynamically
        // Use individual price calculation API for current selling prices
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
      byMetalType: inventorySummary,
    };

    // Update cache
    cachedData = responseData;
    cacheTimestamp = Date.now();

    const response = NextResponse.json(successResponse(responseData), { status: 200 });
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
