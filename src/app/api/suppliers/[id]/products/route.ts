// Supplier Products API - View supplier-linked products (User Story 9)

import { NextRequest, NextResponse } from 'next/server';

import { handleApiError, successResponse } from '@/utils/response';
import { getRepositories } from '@/utils/apiRepository';

/**
 * GET /api/suppliers/[id]/products
 * Get all products linked to this supplier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
    const repos = await getRepositories(request);
  try {
    const supplierId = params.id;
    const { searchParams } = new URL(request.url);

    // Verify supplier exists
    const supplier = await repos.supplier.findById(supplierId);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Get products
    const result = await repos.supplier.getSupplierProducts(supplierId, {
      page,
      pageSize,
    });

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
