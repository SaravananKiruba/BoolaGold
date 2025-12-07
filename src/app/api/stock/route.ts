// Stock Items API - List and Query

import { NextRequest, NextResponse } from 'next/server';
import { StockItemRepository } from '@/repositories/stockItemRepository';
import { StockStatus } from '@/domain/entities/types';
import { handleApiError, successResponse, errorResponse } from '@/utils/response';
import { getSession, hasPermission } from '@/lib/auth';

/**
 * GET /api/stock
 * List all stock items with filters and pagination
 * 
 * User Story 8: Stock Availability Check
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'STOCK_MANAGE')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

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

    const repository = new StockItemRepository({ session });
    const result = await repository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
