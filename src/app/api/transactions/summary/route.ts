// Transaction Summary API - Get financial dashboard summary
// GET /api/transactions/summary - Get income, expense, and metal purchase summary

import { NextRequest, NextResponse } from 'next/server';

import { successResponse, errorResponse } from '@/utils/response';
import { getRepositories } from '@/utils/apiRepository';

export async function GET(request: NextRequest) {
    const repos = await getRepositories(request);
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

    const summary = await repos.transaction.getDashboardSummary(filters);

    return NextResponse.json(successResponse(summary), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching transaction summary:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
