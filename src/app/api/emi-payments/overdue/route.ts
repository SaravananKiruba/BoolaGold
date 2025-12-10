// EMI Payment Overdue API
// GET /api/emi-payments/overdue - Get all overdue EMI payments and installments
// POST /api/emi-payments/overdue/mark - Mark overdue installments (admin/scheduled job)

import { NextRequest, NextResponse } from 'next/server';

import { successResponse, errorResponse } from '@/utils/response';
import { getRepositories } from '@/utils/apiRepository';

export async function GET(request: NextRequest) {
  try {
    const repos = await getRepositories(request);
    const overdueEmis = await repos.emiPayment.getOverdueEmis();

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
    const repos = await getRepositories(request);
    // Mark overdue installments
    const result = await repos.emiPayment.markOverdueInstallments();

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error: any) {
    console.error('Error marking overdue installments:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
