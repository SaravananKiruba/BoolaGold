// Rate Master History API
// GET /api/rate-master/history/[metalType]/[purity] - Get rate history for specific metal and purity

import { NextRequest, NextResponse } from 'next/server';
import { rateMasterRepository } from '@/repositories/rateMasterRepository';
import { successResponse, errorResponse } from '@/utils/response';
import { MetalType } from '@/domain/entities/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { metalType: string; purity: string } }
) {
  try {
    const { metalType, purity } = params;

    // Validate metal type
    if (!Object.values(MetalType).includes(metalType as MetalType)) {
      return NextResponse.json(
        errorResponse('Invalid metal type. Must be GOLD, SILVER, or PLATINUM'),
        { status: 400 }
      );
    }

    // Parse pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await rateMasterRepository.getRateHistory(
      metalType as MetalType,
      purity,
      { page, pageSize }
    );

    return NextResponse.json(successResponse(result.data, result.meta), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching rate history:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
