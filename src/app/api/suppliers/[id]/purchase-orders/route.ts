// Supplier Purchase Orders API - View purchase history (User Story 9)

import { NextRequest, NextResponse } from 'next/server';
import { supplierRepository } from '@/repositories/supplierRepository';
import { handleApiError, successResponse } from '@/utils/response';

/**
 * GET /api/suppliers/[id]/purchase-orders
 * Get purchase order history for this supplier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = params.id;
    const { searchParams } = new URL(request.url);

    // Verify supplier exists
    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Get purchase order history
    const result = await supplierRepository.getPurchaseOrderHistory(supplierId, {
      page,
      pageSize,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
