// Inventory Reports API - Comprehensive inventory analysis

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError, successResponse } from '@/utils/response';
import { MetalType } from '@/domain/entities/types';

/**
 * GET /api/reports/inventory
 * Get comprehensive inventory reports
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const valuationBasis = searchParams.get('valuationBasis') || 'PURCHASE'; // PURCHASE or SELLING
    const metalTypeFilter = searchParams.get('metalType') as MetalType | null;
    const collectionFilter = searchParams.get('collection');

    // Build where clause
    const productsWhere: any = {
      deletedAt: null,
      isActive: true,
    };

    if (metalTypeFilter) {
      productsWhere.metalType = metalTypeFilter;
    }

    if (collectionFilter) {
      productsWhere.collectionName = collectionFilter;
    }

    // Fetch all products with stock items
    const products = await prisma.product.findMany({
      where: productsWhere,
      include: {
        stockItems: {
          where: {
            deletedAt: null,
            status: 'AVAILABLE',
          },
        },
      },
    });

    // Calculate total products count
    const totalProducts = products.length;

    // Initialize metal-wise breakdown
    const metalBreakdown: Record<string, {
      metalType: string;
      count: number;
      totalWeight: number;
      totalValue: number;
      byPurity: Record<string, {
        purity: string;
        count: number;
        totalWeight: number;
        totalValue: number;
      }>;
    }> = {};

    // Product details for report
    const productDetails: Array<{
      productId: string;
      name: string;
      metalType: string;
      purity: string;
      grossWeight: number;
      netWeight: number;
      stockQuantity: number;
      value: number;
      huid: string | null;
      tagNumber: string | null;
    }> = [];

    // Low stock items
    const lowStockItems: Array<{
      productId: string;
      name: string;
      stockQuantity: number;
      reorderLevel: number;
    }> = [];

    let totalInventoryValue = 0;

    // Process each product
    products.forEach((product) => {
      const stockQuantity = product.stockItems.length;
      const productWeight = Number(product.grossWeight || 0);
      const productNetWeight = Number(product.netWeight || 0);

      // Calculate product value based on valuation basis
      // StockItem only has purchaseCost, selling prices are calculated dynamically
      let productValue = 0;
      // Use purchase cost for inventory valuation
      productValue = product.stockItems.reduce((sum, item) => sum + Number(item.purchaseCost || 0), 0);

      totalInventoryValue += productValue;

      // Add to product details
      productDetails.push({
        productId: product.id,
        name: product.name,
        metalType: product.metalType,
        purity: product.purity,
        grossWeight: Number(product.grossWeight || 0),
        netWeight: Number(product.netWeight || 0),
        stockQuantity,
        value: Number(productValue.toFixed(2)),
        huid: product.huid,
        tagNumber: product.tagNumber,
      });

      // Check for low stock
      const reorderLevel = Number(product.reorderLevel || 0);
      if (reorderLevel > 0 && stockQuantity < reorderLevel) {
        lowStockItems.push({
          productId: product.id,
          name: product.name,
          stockQuantity,
          reorderLevel,
        });
      }

      // Metal-wise breakdown
      const metalType = product.metalType;
      if (!metalBreakdown[metalType]) {
        metalBreakdown[metalType] = {
          metalType,
          count: 0,
          totalWeight: 0,
          totalValue: 0,
          byPurity: {},
        };
      }

      metalBreakdown[metalType].count += stockQuantity;
      metalBreakdown[metalType].totalWeight += productWeight * stockQuantity;
      metalBreakdown[metalType].totalValue += productValue;

      // Purity breakdown
      const purity = product.purity;
      if (!metalBreakdown[metalType].byPurity[purity]) {
        metalBreakdown[metalType].byPurity[purity] = {
          purity,
          count: 0,
          totalWeight: 0,
          totalValue: 0,
        };
      }

      metalBreakdown[metalType].byPurity[purity].count += stockQuantity;
      metalBreakdown[metalType].byPurity[purity].totalWeight += productWeight * stockQuantity;
      metalBreakdown[metalType].byPurity[purity].totalValue += productValue;
    });

    // Format metal breakdown for response
    const metalBreakdownArray = Object.values(metalBreakdown).map((metal) => ({
      metalType: metal.metalType,
      count: metal.count,
      totalWeight: Number(metal.totalWeight.toFixed(3)),
      totalValue: Number(metal.totalValue.toFixed(2)),
      byPurity: Object.values(metal.byPurity).map((purity) => ({
        purity: purity.purity,
        count: purity.count,
        totalWeight: Number(purity.totalWeight.toFixed(3)),
        totalValue: Number(purity.totalValue.toFixed(2)),
      })),
    }));

    // Stock movement report (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [stockAdditions, stockSales] = await Promise.all([
      // Stock additions from purchase orders (using purchaseDate field)
      prisma.stockItem.count({
        where: {
          deletedAt: null,
          purchaseDate: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      // Stock sales from sales orders
      prisma.salesOrderLine.count({
        where: {
          salesOrder: {
            status: 'COMPLETED',
            orderDate: {
              gte: thirtyDaysAgo,
            },
          },
        },
      }),
    ]);

    // Calculate opening and closing stock (for the period)
    const currentStock = products.reduce((sum, p) => sum + p.stockItems.length, 0);
    const openingStock = currentStock - stockAdditions + stockSales;

    return Response.json(successResponse({
      valuationBasis,
      filters: {
        metalType: metalTypeFilter,
        collection: collectionFilter,
      },
      summary: {
        totalProducts,
        totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
        totalStockQuantity: currentStock,
      },
      metalBreakdown: metalBreakdownArray,
      lowStockItems,
      productDetails: productDetails.sort((a, b) => b.value - a.value),
      stockMovement: {
        period: 'Last 30 days',
        openingStock,
        additions: stockAdditions,
        sales: stockSales,
        closingStock: currentStock,
      },
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
