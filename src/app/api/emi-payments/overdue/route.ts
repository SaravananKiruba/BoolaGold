// EMI Payment Overdue API
// GET /api/emi-payments/overdue - Get all overdue EMI payments and installments
// POST /api/emi-payments/overdue/mark - Mark overdue installments (admin/scheduled job)

import { NextRequest, NextResponse } from 'next/server';
import { emiPaymentRepository } from '@/repositories/emiPaymentRepository';
import { successResponse, errorResponse } from '@/utils/response';

export async function GET(_request: NextRequest) {
  try {
    const overdueEmis = await emiPaymentRepository.getOverdueEmis();

    // Calculate total overdue amount
    const totalOverdueAmount = overdueEmis.reduce((sum, emi) => {
      const overdueInstallments = emi.installments.reduce(
        (instSum, inst) => instSum + (Number(inst.amount) - Number(inst.paidAmount)),
        0
      );
      return sum + overdueInstallments;
    }, 0);

    return NextResponse.json(
      successResponse({
        overdueEmis,
        totalOverdueAmount,
        count: overdueEmis.length,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching overdue EMIs:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Mark overdue installments
    const result = await emiPaymentRepository.markOverdueInstallments();

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error: any) {
    console.error('Error marking overdue installments:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
