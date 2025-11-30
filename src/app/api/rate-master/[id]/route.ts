// Rate Master API Route - GET, PUT, DELETE by ID
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
  metalType: z.nativeEnum(MetalType).optional(),
  purity: z.string().min(1).max(20).optional(),
  ratePerGram: z.number().positive().optional(),
  effectiveDate: z.string().datetime().or(z.date()).optional(),
  validUntil: z.string().datetime().or(z.date()).optional().nullable(),
  rateSource: z.enum(['MARKET', 'MANUAL', 'API']).optional(),
  isActive: z.boolean().optional(),
  defaultMakingChargePercent: z.number().min(0).max(100).optional().nullable(),
  updatedBy: z.string().max(100).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateMaster = await rateMasterRepository.findById(params.id);

    if (!rateMaster) {
      return NextResponse.json(errorResponse('Rate master not found'), { status: 404 });
    }

    return NextResponse.json(successResponse(rateMaster));
  } catch (error: any) {
    console.error('Error fetching rate master:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    if (data.purity !== undefined) updateData.purity = data.purity;
    if (data.ratePerGram !== undefined) updateData.ratePerGram = data.ratePerGram;
    if (data.rateSource !== undefined) updateData.rateSource = data.rateSource;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.defaultMakingChargePercent !== undefined) {
      updateData.defaultMakingChargePercent = data.defaultMakingChargePercent;
    }
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

    // Handle dates
    if (data.effectiveDate) {
      updateData.effectiveDate = typeof data.effectiveDate === 'string'
        ? new Date(data.effectiveDate)
        : data.effectiveDate;
    }

    if (data.validUntil !== undefined) {
      updateData.validUntil = data.validUntil
        ? (typeof data.validUntil === 'string' ? new Date(data.validUntil) : data.validUntil)
        : null;
    }

    // Validate date logic if both dates are being updated
    if (updateData.effectiveDate && updateData.validUntil) {
      if (updateData.validUntil <= updateData.effectiveDate) {
        return NextResponse.json(
          errorResponse('Valid until date must be after effective date'),
          { status: 400 }
        );
      }
    }

    // If activating this rate, deactivate others for same metal type and purity
    if (data.isActive === true) {
      const metalType = (data.metalType || existingRate.metalType) as MetalType;
      const purity = data.purity || existingRate.purity;
      await rateMasterRepository.deactivateOldRates(metalType, purity, params.id);
    }

    const updatedRate = await rateMasterRepository.update(params.id, updateData);

    // Log the update
    await logUpdate(AuditModule.RATE_MASTER, params.id, existingRate, updatedRate);

    return NextResponse.json(successResponse(updatedRate));
  } catch (error: any) {
    console.error('Error updating rate master:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if rate master exists
    const existingRate = await rateMasterRepository.findById(params.id);
    if (!existingRate) {
      return NextResponse.json(errorResponse('Rate master not found'), { status: 404 });
    }

    await rateMasterRepository.delete(params.id);

    // Log the deletion
    await logDelete(AuditModule.RATE_MASTER, params.id, existingRate);

    return NextResponse.json(successResponse({ message: 'Rate master deleted successfully' }));
  } catch (error: any) {
    console.error('Error deleting rate master:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
