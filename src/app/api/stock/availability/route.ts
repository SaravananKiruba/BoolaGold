// Stock Availability API - Check available items by product

import { NextRequest, NextResponse } from 'next/server';


import { handleApiError, successResponse } from '@/utils/response';
import { getRepositories } from '@/utils/apiRepository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stock/availability
 * Check real-time stock availability by product
 * 
 * User Story 8: Stock Availability Check
 */
export async function GET(request: NextRequest) {
  try {
    const repos = await getRepositories(request);
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get product details
    const product = await repos.product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get available items (FIFO order)
    const availableItems = await repos.stockItem.findAvailableByProduct(productId);

    // Get stock summary by status
    const summary = await repos.stockItem.getStockSummaryByProduct(productId);

    // Calculate counts by status
    const statusCounts = {
      available: 0,
      reserved: 0,
      sold: 0,
    };

    const valueSummary = {
      availablePurchaseCost: 0,
      reservedPurchaseCost: 0,
      // Note: Selling prices are calculated dynamically at checkout, not stored
    };

    summary.forEach((item) => {
      if (item.status === 'AVAILABLE') {
        statusCounts.available = item._count.id;
        valueSummary.availablePurchaseCost = Number(item._sum.purchaseCost || 0);
        // Selling prices are calculated dynamically, not stored
      } else if (item.status === 'RESERVED') {
        statusCounts.reserved = item._count.id;
        valueSummary.reservedPurchaseCost = Number(item._sum.purchaseCost || 0);
        // Selling prices are calculated dynamically, not stored
      } else if (item.status === 'SOLD') {
        statusCounts.sold = item._count.id;
      }
    });

    // Check if low stock
    const isLowStock = statusCounts.available <= product.reorderLevel;

    return NextResponse.json(successResponse({
      product: {
        id: product.id,
        name: product.name,
        metalType: product.metalType,
        purity: product.purity,
        reorderLevel: product.reorderLevel,
      },
      availability: {
        available: statusCounts.available,
        reserved: statusCounts.reserved,
        sold: statusCounts.sold,
        total: statusCounts.available + statusCounts.reserved + statusCounts.sold,
        isLowStock,
      },
      value: valueSummary,
      availableItems: availableItems.map((item) => ({
        id: item.id,
        tagId: item.tagId,
        barcode: item.barcode,
        netWeight: product.netWeight,
        purity: product.purity,
        purchaseCost: item.purchaseCost,
        purchaseDate: item.purchaseDate,
      })),
    }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
