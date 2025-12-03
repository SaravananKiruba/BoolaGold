// Stock Search API - Search by tag ID, barcode, or product name

import { NextRequest, NextResponse } from 'next/server';
import { stockItemRepository } from '@/repositories/stockItemRepository';
import { handleApiError, successResponse } from '@/utils/response';
import prisma from '@/lib/prisma';
import { Prisma, StockStatus } from '@/domain/entities/types';

/**
 * GET /api/stock/search
 * Search for stock items by multiple criteria
 * 
 * Query params:
 * - q: General search query (searches product name, tag ID, barcode)
 * - tagId: Exact tag ID lookup
 * - barcode: Exact barcode lookup
 * - status: Filter by status (default: all)
 * - limit: Number of results (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q');
    const tagId = searchParams.get('tagId');
    const barcode = searchParams.get('barcode');
    const status = searchParams.get('status') as StockStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('[Stock Search] Params:', { query, tagId, barcode, status, limit });

    // Single item lookup by exact tag ID or barcode
    if (tagId || barcode) {
      let stockItem = null;

      if (tagId) {
        stockItem = await stockItemRepository.findByTagId(tagId);
      } else if (barcode) {
        stockItem = await stockItemRepository.findByBarcode(barcode);
      }

      if (!stockItem) {
        return NextResponse.json(successResponse([]), { status: 200 });
      }

      return NextResponse.json(successResponse([stockItem]), { status: 200 });
    }

    // General search query
    if (!query) {
      return NextResponse.json(
        { error: 'Search query (q), tagId, or barcode is required' },
        { status: 400 }
      );
    }

    // Search across product name, tag ID, and barcode using raw SQL for MySQL
    const searchTerm = query.trim();
    const likePattern = `%${searchTerm}%`;
    
    console.log('[Stock Search] Searching for:', searchTerm);
    
    // Build SQL query with conditional status filter
    let sqlQuery = `
      SELECT 
        si.id,
        si.productId,
        si.tagId,
        si.barcode,
        si.purchaseCost,
        si.sellingPrice,
        si.status,
        si.purchaseOrderId,
        si.purchaseDate,
        si.saleDate,
        si.salesOrderLineId,
        si.createdAt,
        si.updatedAt,
        p.id as product_id,
        p.name as product_name,
        p.metalType as product_metalType,
        p.purity as product_purity,
        p.grossWeight as product_grossWeight,
        p.netWeight as product_netWeight,
        p.barcode as product_barcode,
        p.description as product_description
      FROM stock_items si
      INNER JOIN products p ON si.productId = p.id
      WHERE si.deletedAt IS NULL
        AND (
          si.tagId LIKE ?
          OR si.barcode LIKE ?
          OR p.name LIKE ?
          OR p.metalType LIKE ?
          OR p.purity LIKE ?
        )`;
    
    const params: any[] = [likePattern, likePattern, likePattern, likePattern, likePattern];
    
    if (status) {
      sqlQuery += ` AND si.status = ?`;
      params.push(status);
    }
    
    sqlQuery += ` ORDER BY si.purchaseDate DESC LIMIT ?`;
    params.push(limit);
    
    // Execute raw query
    const stockItems: any[] = await prisma.$queryRawUnsafe(sqlQuery, ...params);
    
    // Transform the raw result to match the expected structure
    const transformedItems = stockItems.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      tagId: item.tagId,
      barcode: item.barcode,
      purchaseCost: item.purchaseCost,
      sellingPrice: item.sellingPrice,
      status: item.status,
      purchaseOrderId: item.purchaseOrderId,
      purchaseDate: item.purchaseDate,
      saleDate: item.saleDate,
      salesOrderLineId: item.salesOrderLineId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      product: {
        id: item.product_id,
        name: item.product_name,
        metalType: item.product_metalType,
        purity: item.product_purity,
        grossWeight: item.product_grossWeight,
        netWeight: item.product_netWeight,
        barcode: item.product_barcode,
        description: item.product_description,
      }
    }));

    console.log(`[Stock Search] Found ${transformedItems.length} items for query: "${searchTerm}"`);

    return NextResponse.json(successResponse(transformedItems), { status: 200 });
  } catch (error: any) {
    console.error('[Stock Search] Error:', error);
    console.error('[Stock Search] Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: error.message || 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } 
      },
      { status: 500 }
    );
  }
}
