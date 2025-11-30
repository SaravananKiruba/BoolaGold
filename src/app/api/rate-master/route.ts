// Rate Master API Route - GET all rates, POST create rate
// GET /api/rate-master - List all rates with filters and pagination
// POST /api/rate-master - Create a new rate master entry

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateMasterRepository } from '@/repositories/rateMasterRepository';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { MetalType, AuditModule } from '@/domain/entities/types';
import { logCreate } from '@/utils/audit';

const createRateMasterSchema = z.object({
  metalType: z.nativeEnum(MetalType),
  purity: z.string().min(1).max(20),
  ratePerGram: z.number().positive(),
  effectiveDate: z.string().datetime().or(z.date()),
  validUntil: z.string().datetime().or(z.date()).optional(),
  rateSource: z.enum(['MARKET', 'MANUAL', 'API']).default('MANUAL'),
  isActive: z.boolean().default(true),
  defaultMakingChargePercent: z.number().min(0).max(100).optional(),
  createdBy: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Parse filters
    const filters: any = {
      metalType: searchParams.get('metalType') as MetalType | undefined,
      purity: searchParams.get('purity') || undefined,
      rateSource: searchParams.get('rateSource') as 'MARKET' | 'MANUAL' | 'API' | undefined,
      isActive: searchParams.get('isActive')
        ? searchParams.get('isActive') === 'true'
        : undefined,
    };

    // Date range filters
    if (searchParams.get('effectiveDateFrom')) {
      filters.effectiveDateFrom = new Date(searchParams.get('effectiveDateFrom')!);
    }
    if (searchParams.get('effectiveDateTo')) {
      filters.effectiveDateTo = new Date(searchParams.get('effectiveDateTo')!);
    }

    const result = await rateMasterRepository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result.data, result.meta));
  } catch (error: any) {
    console.error('Error fetching rate masters:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = createRateMasterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Convert string dates to Date objects
    const effectiveDate = typeof data.effectiveDate === 'string' 
      ? new Date(data.effectiveDate) 
      : data.effectiveDate;
    
    const validUntil = data.validUntil 
      ? (typeof data.validUntil === 'string' ? new Date(data.validUntil) : data.validUntil)
      : null;

    // Validate date logic
    if (validUntil && validUntil <= effectiveDate) {
      return NextResponse.json(
        errorResponse('Valid until date must be after effective date'),
        { status: 400 }
      );
    }

    // If this is set as active, deactivate other rates for the same metal type and purity
    if (data.isActive) {
      await rateMasterRepository.deactivateOldRates(data.metalType, data.purity);
    }

    // Create rate master
    const rateMaster = await rateMasterRepository.create({
      metalType: data.metalType,
      purity: data.purity,
      ratePerGram: data.ratePerGram,
      effectiveDate,
      validUntil,
      rateSource: data.rateSource,
      isActive: data.isActive,
      defaultMakingChargePercent: data.defaultMakingChargePercent || null,
      createdBy: data.createdBy || null,
    });

    // Log the creation
    await logCreate(AuditModule.RATE_MASTER, rateMaster.id, rateMaster);

    return NextResponse.json(successResponse(rateMaster), { status: 201 });
  } catch (error: any) {
    console.error('Error creating rate master:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
