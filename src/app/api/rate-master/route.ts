// Rate Master API Route - Robust Implementation
// GET /api/rate-master - List all rates with filters and pagination
// POST /api/rate-master - Create a new rate master entry

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateMasterRepository } from '@/repositories/rateMasterRepository';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { MetalType, AuditModule } from '@/domain/entities/types';
import { logCreate } from '@/utils/audit';
import { getSession, hasPermission } from '@/lib/auth';

const createRateMasterSchema = z.object({
  metalType: z.nativeEnum(MetalType, { 
    errorMap: () => ({ message: 'Metal type must be GOLD, SILVER, or PLATINUM' }) 
  }),
  purity: z.string()
    .min(1, 'Purity is required')
    .max(20, 'Purity must not exceed 20 characters')
    .trim(),
  ratePerGram: z.number({ required_error: 'Rate per gram is required' })
    .positive('Rate per gram must be a positive number')
    .finite('Rate per gram must be a valid number'),
  effectiveDate: z.union([
    z.string().datetime(), // Full ISO string with timezone
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid datetime format'), // datetime-local format
    z.date()
  ]),
  validUntil: z.union([
    z.string().datetime(), // Full ISO string with timezone
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid datetime format'), // datetime-local format
    z.date()
  ]).optional().nullable(),
  rateSource: z.enum(['MARKET', 'MANUAL', 'API'], {
    errorMap: () => ({ message: 'Rate source must be MARKET, MANUAL, or API' })
  }).default('MANUAL'),
  isActive: z.boolean().default(true),
  defaultMakingChargePercent: z.number()
    .min(0, 'Making charge percent must be at least 0')
    .max(100, 'Making charge percent cannot exceed 100')
    .optional()
    .nullable(),
  createdBy: z.string().max(100, 'Created by must not exceed 100 characters').optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'RATE_MASTER_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse and validate pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));

    // Parse filters with proper type checking
    const filters: any = {};
    
    const metalType = searchParams.get('metalType');
    if (metalType && Object.values(MetalType).includes(metalType as MetalType)) {
      filters.metalType = metalType as MetalType;
    }

    const purity = searchParams.get('purity');
    if (purity) {
      filters.purity = purity.trim();
    }

    const rateSource = searchParams.get('rateSource');
    if (rateSource && ['MARKET', 'MANUAL', 'API'].includes(rateSource)) {
      filters.rateSource = rateSource as 'MARKET' | 'MANUAL' | 'API';
    }

    const isActive = searchParams.get('isActive');
    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }

    // Date range filters with validation
    const effectiveDateFrom = searchParams.get('effectiveDateFrom');
    if (effectiveDateFrom) {
      const date = new Date(effectiveDateFrom);
      if (!isNaN(date.getTime())) {
        filters.effectiveDateFrom = date;
      }
    }

    const effectiveDateTo = searchParams.get('effectiveDateTo');
    if (effectiveDateTo) {
      const date = new Date(effectiveDateTo);
      if (!isNaN(date.getTime())) {
        filters.effectiveDateTo = date;
      }
    }

    const repository = new RateMasterRepository({ session });
    const result = await repository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result.data, result.meta), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching rate masters:', error);
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch rate masters'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'RATE_MASTER_EDIT')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

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
    
    // Validate effective date
    if (isNaN(effectiveDate.getTime())) {
      return NextResponse.json(
        errorResponse('Invalid effective date'),
        { status: 400 }
      );
    }

    let validUntil: Date | null = null;
    if (data.validUntil) {
      validUntil = typeof data.validUntil === 'string' 
        ? new Date(data.validUntil) 
        : data.validUntil;
      
      // Validate valid until date
      if (isNaN(validUntil.getTime())) {
        return NextResponse.json(
          errorResponse('Invalid valid until date'),
          { status: 400 }
        );
      }

      // Validate date logic
      if (validUntil <= effectiveDate) {
        return NextResponse.json(
          errorResponse('Valid until date must be after effective date'),
          { status: 400 }
        );
      }
    }

    // Create rate master with transaction support (handled in repository)
    const repository = new RateMasterRepository({ session });
    const rateMaster = await repository.create({
      metalType: data.metalType,
      purity: data.purity.trim(),
      ratePerGram: data.ratePerGram,
      effectiveDate,
      validUntil,
      rateSource: data.rateSource,
      isActive: data.isActive,
      defaultMakingChargePercent: data.defaultMakingChargePercent || null,
      createdBy: data.createdBy ? data.createdBy.trim() : null,
    });

    // Log the creation
    try {
      await logCreate(AuditModule.RATE_MASTER, rateMaster.id, rateMaster, session!.shopId!);
    } catch (auditError) {
      console.error('Audit log failed:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json(successResponse(rateMaster, 'Rate master created successfully'), { status: 201 });
  } catch (error: any) {
    console.error('Error creating rate master:', error);
    return NextResponse.json(
      errorResponse(error.message || 'Failed to create rate master'),
      { status: 500 }
    );
  }
}
