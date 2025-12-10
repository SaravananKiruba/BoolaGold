// FIFO Stock Selection API - Get recommended stock items for sales
// GET /api/stock/fifo?productId={id}&quantity={num} - Get FIFO items for a product

import { NextRequest, NextResponse } from 'next/server';


import { successResponse, errorResponse } from '@/utils/response';
import { calculateSellingPriceForSale } from '@/utils/sellingPrice';
import { getRepositories } from '@/utils/apiRepository';
import { getSession } from '@/lib/auth';

/**
 * GET /api/stock/fifo
 * Get FIFO-ordered stock items for sales order creation
 * User Story 26: End-to-End Sales Workflow - FIFO Selection
 */
export async function GET(request: NextRequest) {
  try {
    let repos;
    try {
      repos = await getRepositories(request);
    } catch (authError: any) {
      return NextResponse.json(
        errorResponse('Unauthorized - Valid session required'),
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const productId = searchParams.get('productId');
    const quantity = parseInt(searchParams.get('quantity') || '1');

    if (!productId) {
      return NextResponse.json(
        errorResponse('Product ID is required'),
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        errorResponse('Quantity must be at least 1'),
        { status: 400 }
      );
    }

    // Get product details
    const product = await repos.product.findById(productId);
    if (!product) {
      return NextResponse.json(
        errorResponse('Product not found'),
        { status: 404 }
      );
    }

    // Get available items in FIFO order (oldest first)
    const availableItems = await repos.stockItem.findAvailableByProduct(productId);

    if (availableItems.length === 0) {
      return NextResponse.json(
        successResponse({
          product: {
            id: product.id,
            name: product.name,
            metalType: product.metalType,
            purity: product.purity,
          },
          requestedQuantity: quantity,
          availableQuantity: 0,
          recommendedItems: [],
          canFulfill: false,
          message: 'No stock available for this product',
        })
      );
    }

    // Check if we have enough stock
    const canFulfill = availableItems.length >= quantity;

    // Get the recommended items (FIFO - take oldest first) and calculate selling prices
    const recommendedItems = await Promise.all(
      availableItems.slice(0, quantity).map(async (item) => {
        const priceResult = await calculateSellingPriceForSale(item.id);
        return {
          id: item.id,
          tagId: item.tagId,
          barcode: item.barcode,
          purchaseCost: Number(item.purchaseCost),
          purchaseDate: item.purchaseDate,
          sellingPrice: priceResult.sellingPrice,
          product: {
            id: product.id,
            name: product.name,
            metalType: product.metalType,
            purity: product.purity,
            grossWeight: Number(product.grossWeight),
            netWeight: Number(product.netWeight),
            makingCharges: Number(product.makingCharges),
            wastagePercent: Number(product.wastagePercent),
            stoneWeight: product.stoneWeight ? Number(product.stoneWeight) : null,
            stoneValue: product.stoneValue ? Number(product.stoneValue) : null,
            huid: product.huid,
            hallmarkNumber: product.hallmarkNumber,
          },
        };
      })
    );

    // Calculate totals
    const totalSellingPrice = recommendedItems.reduce(
      (sum, item) => sum + item.sellingPrice,
      0
    );
    const totalPurchaseCost = recommendedItems.reduce(
      (sum, item) => sum + item.purchaseCost,
      0
    );

    return NextResponse.json(
      successResponse({
        product: {
          id: product.id,
          name: product.name,
          metalType: product.metalType,
          purity: product.purity,
        },
        requestedQuantity: quantity,
        availableQuantity: availableItems.length,
        canFulfill,
        recommendedItems,
        summary: {
          totalSellingPrice,
          totalPurchaseCost,
          potentialProfit: totalSellingPrice - totalPurchaseCost,
          averageSellingPrice: totalSellingPrice / recommendedItems.length,
        },
        message: canFulfill
          ? `FIFO recommendation: ${quantity} oldest items selected`
          : `Only ${availableItems.length} items available (requested ${quantity})`,
      })
    );
  } catch (error: any) {
    console.error('Error fetching FIFO items:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
