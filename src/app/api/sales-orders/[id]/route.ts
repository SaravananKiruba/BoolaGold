// Sales Order API Route - GET by ID
// GET /api/sales-orders/[id] - Get sales order details

import { NextRequest, NextResponse } from 'next/server';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { successResponse, errorResponse, notFoundResponse } from '@/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const salesOrder = await salesOrderRepository.findById(params.id);

    if (!salesOrder) {
      return NextResponse.json(notFoundResponse('Sales Order'), { status: 404 });
    }

    return NextResponse.json(successResponse(salesOrder));
  } catch (error: any) {
    console.error('Error fetching sales order:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
