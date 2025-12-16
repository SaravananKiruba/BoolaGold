// BIS Compliance Detail API - Get, update, delete individual compliance records
// User Story 29: BIS Hallmark Compliance

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/utils/response';
import { BisComplianceStatus, AuditModule } from '@/domain/entities/types';
import { logUpdate, logDelete } from '@/utils/audit';

const updateBisComplianceSchema = z.object({
  huid: z.string().min(1).optional(),
  huidRegistrationDate: z.string().datetime().optional(),
  hallmarkNumber: z.string().optional(),
  complianceStatus: z.nativeEnum(BisComplianceStatus).optional(),
  bisStandard: z.string().optional(),
  ahcCode: z.string().optional(),
  jewelType: z.string().optional(),
  certificationDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/bis-compliance/[id]
 * Get BIS compliance record by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;
const record = await prisma.bisCompliance.findUnique({
      where: { id: id },
    });

    if (!record) {
      return NextResponse.json(notFoundResponse('BIS Compliance Record'), { status: 404 });
    }

    return NextResponse.json(successResponse(record), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching BIS compliance record:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

/**
 * PUT /api/bis-compliance/[id]
 * Update BIS compliance record
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;
const session = await getSession();
    const body = await request.json();

    // Get existing record
    const existing = await prisma.bisCompliance.findUnique({
      where: { id: id },
    });

    if (!existing) {
      return NextResponse.json(notFoundResponse('BIS Compliance Record'), { status: 404 });
    }

    // Validate input
    const validation = updateBisComplianceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        validationErrorResponse(validation.error.errors),
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check HUID uniqueness if being updated
    if (data.huid && data.huid !== existing.huid) {
      const huidExists = await prisma.bisCompliance.findUnique({
        where: { 
          shopId_huid: {
            shopId: session!.shopId!,
            huid: data.huid
          }
        },
      });

      if (huidExists) {
        return NextResponse.json(
          errorResponse(`HUID ${data.huid} already exists`),
          { status: 409 }
        );
      }
    }

    // Update record
    const updated = await prisma.bisCompliance.update({
      where: { id: id },
      data: {
        huid: data.huid,
        huidRegistrationDate: data.huidRegistrationDate ? new Date(data.huidRegistrationDate) : undefined,
        hallmarkNumber: data.hallmarkNumber,
        complianceStatus: data.complianceStatus,
        bisStandard: data.bisStandard,
        ahcCode: data.ahcCode,
        jewelType: data.jewelType,
        certificationDate: data.certificationDate ? new Date(data.certificationDate) : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        notes: data.notes,
      },
    });

    // Log update
    await logUpdate(AuditModule.PRODUCTS, id, existing, updated, session!.shopId!);

    return NextResponse.json(successResponse(updated), { status: 200 });
  } catch (error: any) {
    console.error('Error updating BIS compliance record:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

/**
 * DELETE /api/bis-compliance/[id]
 * Delete BIS compliance record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;
const session = await getSession();
    const record = await prisma.bisCompliance.findUnique({
      where: { id: id },
    });

    if (!record) {
      return NextResponse.json(notFoundResponse('BIS Compliance Record'), { status: 404 });
    }

    await prisma.bisCompliance.delete({
      where: { id: id },
    });

    // Log deletion
    await logDelete(AuditModule.PRODUCTS, id, record, session!.shopId!);

    return NextResponse.json(
      successResponse({ message: 'BIS compliance record deleted successfully' }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting BIS compliance record:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
