// Rate Master Current Rates API
// GET /api/rate-master/current/all - Get all current active rates

import { NextRequest, NextResponse } from 'next/server';
import { rateMasterRepository } from '@/repositories/rateMasterRepository';
import { successResponse, errorResponse } from '@/utils/response';

export async function GET(request: NextRequest) {
  try {
    const currentRates = await rateMasterRepository.getAllCurrentRates();

    return NextResponse.json(successResponse(currentRates), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching current rates:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
