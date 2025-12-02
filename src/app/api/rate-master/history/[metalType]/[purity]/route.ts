// Rate Master History API - Robust Implementation
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

    // Validate purity
    if (!purity || purity.trim() === '') {
      return NextResponse.json(
        errorResponse('Purity is required'),
        { status: 400 }
      );
    }

    // Parse and validate pagination
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50')));

    const result = await rateMasterRepository.getRateHistory(
      metalType as MetalType,
      purity.trim(),
      { page, pageSize }
    );

    return NextResponse.json(
      successResponse(result.data, 'Rate history fetched successfully', result.meta), 
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching rate history:', error);
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch rate history'),
      { status: 500 }
    );
  }
}
