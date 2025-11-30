// EMI Payment API Route - GET by ID, DELETE soft delete
// GET /api/emi-payments/[id] - Get EMI payment details with installments
// DELETE /api/emi-payments/[id] - Soft delete EMI payment

import { NextRequest, NextResponse } from 'next/server';
import { emiPaymentRepository } from '@/repositories/emiPaymentRepository';
import { successResponse, errorResponse, notFoundResponse } from '@/utils/response';
import { AuditModule } from '@/domain/entities/types';
import { logDelete } from '@/utils/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const emiPayment = await emiPaymentRepository.findById(params.id);

    if (!emiPayment) {
      return NextResponse.json(notFoundResponse('EMI Payment'), { status: 404 });
    }

    return NextResponse.json(successResponse(emiPayment));
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
    // Check if EMI payment exists
    const existingEmi = await emiPaymentRepository.findById(params.id);
    if (!existingEmi) {
      return NextResponse.json(notFoundResponse('EMI Payment'), { status: 404 });
    }

    // Soft delete
    await emiPaymentRepository.softDelete(params.id);

    // Log the deletion
    await logDelete(AuditModule.EMI, params.id, existingEmi);

    return NextResponse.json(successResponse({ message: 'EMI payment deleted successfully' }));
  } catch (error: any) {
    console.error('Error deleting EMI payment:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
