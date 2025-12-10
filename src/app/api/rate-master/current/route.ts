// Rate Master Current Rates API - Robust Implementation
// GET /api/rate-master/current - Get all current active rates

import { NextRequest, NextResponse } from 'next/server';

import { successResponse, errorResponse } from '@/utils/response';
import { getRepositories } from '@/utils/apiRepository';

export async function GET(request: NextRequest) {
  try {
    const repos = await getRepositories(request);
    const currentRates = await repos.rateMaster.getAllCurrentRates();

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
