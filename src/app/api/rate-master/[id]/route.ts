// Rate Master API Route - Robust GET, PUT, DELETE by ID
// GET /api/rate-master/[id] - Get specific rate master
// PUT /api/rate-master/[id] - Update rate master
// DELETE /api/rate-master/[id] - Delete rate master

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateMasterRepository } from '@/repositories/rateMasterRepository';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { MetalType, AuditModule } from '@/domain/entities/types';
import { logUpdate, logDelete } from '@/utils/audit';

const updateRateMasterSchema = z.object({
  metalType: z.nativeEnum(MetalType, { 
    errorMap: () => ({ message: 'Metal type must be GOLD, SILVER, or PLATINUM' }) 
  }).optional(),
  purity: z.string()
    .min(1, 'Purity must not be empty')
    .max(20, 'Purity must not exceed 20 characters')
    .trim()
    .optional(),
  ratePerGram: z.number()
    .positive('Rate per gram must be a positive number')
    .finite('Rate per gram must be a valid number')
    .optional(),
  effectiveDate: z.string().datetime().or(z.date()).optional(),
  validUntil: z.string().datetime().or(z.date()).optional().nullable(),
  rateSource: z.enum(['MARKET', 'MANUAL', 'API'], {
    errorMap: () => ({ message: 'Rate source must be MARKET, MANUAL, or API' })
  }).optional(),
  isActive: z.boolean().optional(),
  defaultMakingChargePercent: z.number()
    .min(0, 'Making charge percent must be at least 0')
    .max(100, 'Making charge percent cannot exceed 100')
    .optional()
    .nullable(),
  updatedBy: z.string()
    .max(100, 'Updated by must not exceed 100 characters')
    .trim()
    .optional()
    .nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(errorResponse('Invalid rate master ID format'), { status: 400 });
    }

    const rateMaster = await rateMasterRepository.findById(params.id);

    if (!rateMaster) {
      return NextResponse.json(errorResponse('Rate master not found'), { status: 404 });
    }

    return NextResponse.json(successResponse(rateMaster), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching rate master:', error);
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch rate master'),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(errorResponse('Invalid rate master ID format'), { status: 400 });
    }

    // Check if rate master exists
    const existingRate = await rateMasterRepository.findById(params.id);
    if (!existingRate) {
      return NextResponse.json(errorResponse('Rate master not found'), { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validation = updateRateMasterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Prepare update data
    const updateData: any = {};

    if (data.metalType !== undefined) updateData.metalType = data.metalType;
    if (data.purity !== undefined) updateData.purity = data.purity.trim();
    if (data.ratePerGram !== undefined) updateData.ratePerGram = data.ratePerGram;
    if (data.rateSource !== undefined) updateData.rateSource = data.rateSource;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.defaultMakingChargePercent !== undefined) {
      updateData.defaultMakingChargePercent = data.defaultMakingChargePercent;
    }
    if (data.updatedBy !== undefined) {
      updateData.updatedBy = data.updatedBy ? data.updatedBy.trim() : null;
    }

    // Handle dates with validation
    if (data.effectiveDate) {
      const effectiveDate = typeof data.effectiveDate === 'string'
        ? new Date(data.effectiveDate)
        : data.effectiveDate;
      
      if (isNaN(effectiveDate.getTime())) {
        return NextResponse.json(errorResponse('Invalid effective date'), { status: 400 });
      }
      updateData.effectiveDate = effectiveDate;
    }

    if (data.validUntil !== undefined) {
      if (data.validUntil) {
        const validUntil = typeof data.validUntil === 'string' 
          ? new Date(data.validUntil) 
          : data.validUntil;
        
        if (isNaN(validUntil.getTime())) {
          return NextResponse.json(errorResponse('Invalid valid until date'), { status: 400 });
        }
        updateData.validUntil = validUntil;
      } else {
        updateData.validUntil = null;
      }
    }

    // Validate date logic
    const finalEffectiveDate = updateData.effectiveDate || existingRate.effectiveDate;
    const finalValidUntil = updateData.validUntil !== undefined ? updateData.validUntil : existingRate.validUntil;
    
    if (finalValidUntil && finalValidUntil <= finalEffectiveDate) {
      return NextResponse.json(
        errorResponse('Valid until date must be after effective date'),
        { status: 400 }
      );
    }

    // Update with transaction support (handled in repository)
    const updatedRate = await rateMasterRepository.update(params.id, updateData);

    // Log the update
    try {
      await logUpdate(AuditModule.RATE_MASTER, params.id, existingRate, updatedRate);
    } catch (auditError) {
      console.error('Audit log failed:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json(successResponse(updatedRate, 'Rate master updated successfully'), { status: 200 });
  } catch (error: any) {
    console.error('Error updating rate master:', error);
    return NextResponse.json(
      errorResponse(error.message || 'Failed to update rate master'),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(errorResponse('Invalid rate master ID format'), { status: 400 });
    }

    // Check if rate master exists
    const existingRate = await rateMasterRepository.findById(params.id);
    if (!existingRate) {
      return NextResponse.json(errorResponse('Rate master not found'), { status: 404 });
    }

    // Check if this is an active rate
    if (existingRate.isActive) {
      // Warn but allow deletion
      console.warn(`Deleting active rate master: ${params.id}`);
    }

    await rateMasterRepository.delete(params.id);

    // Log the deletion
    try {
      await logDelete(AuditModule.RATE_MASTER, params.id, existingRate);
    } catch (auditError) {
      console.error('Audit log failed:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json(
      successResponse(
        { id: params.id, message: 'Rate master deleted successfully' },
        'Rate master deleted successfully'
      ), 
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting rate master:', error);
    return NextResponse.json(
      errorResponse(error.message || 'Failed to delete rate master'),
      { status: 500 }
    );
  }
}
