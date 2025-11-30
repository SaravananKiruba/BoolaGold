// Stock Items API - List and Query

import { NextRequest, NextResponse } from 'next/server';
import { stockItemRepository } from '@/repositories/stockItemRepository';
import { StockStatus } from '@/domain/entities/types';
import { handleApiError, successResponse } from '@/utils/response';

/**
 * GET /api/stock
 * List all stock items with filters and pagination
 * 
 * User Story 8: Stock Availability Check
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Filters
    const filters: any = {};

    if (searchParams.get('productId')) {
      filters.productId = searchParams.get('productId')!;
    }

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as StockStatus;
    }

    if (searchParams.get('purchaseOrderId')) {
      filters.purchaseOrderId = searchParams.get('purchaseOrderId')!;
    }

    const result = await stockItemRepository.findAll(filters, { page, pageSize });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
