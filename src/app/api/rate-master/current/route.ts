// Rate Master Current Rates API - Robust Implementation
// GET /api/rate-master/current - Get all current active rates

import { NextRequest, NextResponse } from 'next/server';
import { rateMasterRepository } from '@/repositories/rateMasterRepository';
import { successResponse, errorResponse } from '@/utils/response';

export async function GET(_request: NextRequest) {
  try {
    const currentRates = await rateMasterRepository.getAllCurrentRates();

    // Add metadata about the rates
    const metadata = {
      totalRates: currentRates.length,
      metalTypes: [...new Set(currentRates.map(r => r.metalType))],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(
      successResponse(currentRates, metadata), 
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching current rates:', error);
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch current rates'),
      { status: 500 }
    );
  }
}
