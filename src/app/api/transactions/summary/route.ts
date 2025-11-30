// Transaction Summary API - Get financial dashboard summary
// GET /api/transactions/summary - Get income, expense, and metal purchase summary

import { NextRequest, NextResponse } from 'next/server';
import { transactionRepository } from '@/repositories/transactionRepository';
import { successResponse, errorResponse } from '@/utils/response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Date range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const summary = await transactionRepository.getDashboardSummary(filters);

    return NextResponse.json(successResponse(summary));
  } catch (error: any) {
    console.error('Error fetching transaction summary:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
