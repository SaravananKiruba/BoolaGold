// Stock Search API - Search by tag ID, barcode, or product name

import { NextRequest, NextResponse } from 'next/server';
import { stockItemRepository } from '@/repositories/stockItemRepository';
import { handleApiError, successResponse } from '@/utils/response';
import prisma from '@/lib/prisma';
import { StockStatus } from '@/domain/entities/types';

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

    // Search across product name, tag ID, and barcode
    // MySQL collations are typically case-insensitive by default (utf8mb4_general_ci)
    const searchTerm = query.trim();
    
    // Build where clause for MySQL
    const whereClause: any = {
      deletedAt: null,
      OR: [
        { tagId: { contains: searchTerm } },
        { barcode: { contains: searchTerm } },
        { product: { name: { contains: searchTerm } } },
        { product: { metalType: { contains: searchTerm } } },
        { product: { purity: { contains: searchTerm } } },
      ],
    };
    
    if (status) {
      whereClause.status = status;
    }
    
    console.log('[Stock Search] Where clause:', JSON.stringify(whereClause, null, 2));
    
    const stockItems = await prisma.stockItem.findMany({
      where: whereClause,
      include: {
        product: true,
      },
      orderBy: {
        purchaseDate: 'desc',
      },
      take: limit,
    });

    console.log(`[Stock Search] Found ${stockItems.length} items for query: "${searchTerm}"`);

    return NextResponse.json(successResponse(stockItems), { status: 200 });
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
