// EMI Payment Upcoming Installments API
// GET /api/emi-payments/upcoming - Get upcoming installments for next N days

import { NextRequest, NextResponse } from 'next/server';
import { emiPaymentRepository } from '@/repositories/emiPaymentRepository';
import { successResponse, errorResponse } from '@/utils/response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    const upcomingInstallments = await emiPaymentRepository.getUpcomingInstallments(days);

    // Group by date
    const groupedByDate = upcomingInstallments.reduce((acc, inst) => {
      const date = inst.dueDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(inst);
      return acc;
    }, {} as Record<string, typeof upcomingInstallments>);

    return NextResponse.json(
      successResponse({
        upcomingInstallments,
        groupedByDate,
        count: upcomingInstallments.length,
      })
    );
  } catch (error: any) {
    console.error('Error fetching upcoming installments:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
