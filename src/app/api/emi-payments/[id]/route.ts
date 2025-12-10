// EMI Payment API Route - GET by ID, DELETE soft delete
// GET /api/emi-payments/[id] - Get EMI payment details with installments
// DELETE /api/emi-payments/[id] - Soft delete EMI payment

import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { successResponse, errorResponse, notFoundResponse } from '@/utils/response';
import { AuditModule } from '@/domain/entities/types';
import { logDelete } from '@/utils/audit';
import { getRepositories } from '@/utils/apiRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
    const repos = await getRepositories(request);
  try {
    const emiPayment = await repos.emiPayment.findById(params.id);

    if (!emiPayment) {
      return NextResponse.json(notFoundResponse('EMI Payment'), { status: 404 });
    }

    return NextResponse.json(successResponse(emiPayment), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching EMI payment:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    // Check if EMI payment exists
    const existingEmi = await repos.emiPayment.findById(params.id);
    if (!existingEmi) {
      return NextResponse.json(notFoundResponse('EMI Payment'), { status: 404 });
    }

    // Soft delete
    await repos.emiPayment.softDelete(params.id);

    // Log the deletion
    await logDelete(AuditModule.EMI, params.id, existingEmi, session!.shopId!);

    return NextResponse.json(successResponse({ message: 'EMI payment deleted successfully' }), { status: 200 });
  } catch (error: any) {
    console.error('Error deleting EMI payment:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
