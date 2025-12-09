// BIS Compliance API - Manage BIS hallmark compliance records
// User Story 29: BIS Hallmark Compliance

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { BisComplianceStatus, AuditModule } from '@/domain/entities/types';
import { logCreate } from '@/utils/audit';
import { getSession, hasPermission } from '@/lib/auth';

const bisComplianceSchema = z.object({
  productId: z.string().uuid().optional(),
  stockItemId: z.string().uuid().optional(),
  huid: z.string().min(1, 'HUID is required'),
  huidRegistrationDate: z.string().datetime().optional(),
  hallmarkNumber: z.string().optional(),
  complianceStatus: z.nativeEnum(BisComplianceStatus).default(BisComplianceStatus.PENDING),
  bisStandard: z.string().optional(),
  ahcCode: z.string().optional(),
  jewelType: z.string().optional(),
  certificationDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/bis-compliance
 * Get all BIS compliance records with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'BIS_COMPLIANCE_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const { searchParams } = request.nextUrl;

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // Filter by compliance status
    const status = searchParams.get('status') as BisComplianceStatus | null;
    if (status && Object.values(BisComplianceStatus).includes(status)) {
      where.complianceStatus = status;
    }

    // Filter by HUID
    const huid = searchParams.get('huid');
    if (huid) {
      where.huid = { contains: huid };
    }

    // Filter by product
    const productId = searchParams.get('productId');
    if (productId) {
      where.productId = productId;
    }

    // Filter by stock item
    const stockItemId = searchParams.get('stockItemId');
    if (stockItemId) {
      where.stockItemId = stockItemId;
    }

    // Filter by jewel type
    const jewelType = searchParams.get('jewelType');
    if (jewelType) {
      where.jewelType = { contains: jewelType, mode: 'insensitive' };
    }

    const [records, totalCount] = await Promise.all([
      prisma.bisCompliance.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bisCompliance.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json(
      successResponse(records, {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      })
    );
  } catch (error: any) {
    console.error('Error fetching BIS compliance records:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

/**
 * POST /api/bis-compliance
 * Create a new BIS compliance record
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'BIS_COMPLIANCE_CREATE')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = bisComplianceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        validationErrorResponse(validation.error.errors),
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if HUID already exists
    const existing = await prisma.bisCompliance.findUnique({
      where: { 
        shopId_huid: {
          shopId: session!.shopId!,
          huid: data.huid
        }
      },
    });

    if (existing) {
      return NextResponse.json(
        errorResponse(`HUID ${data.huid} already exists`),
        { status: 409 }
      );
    }

    // Create compliance record
    const record = await prisma.bisCompliance.create({
      data: {
        shopId: session!.shopId!,
        productId: data.productId || null,
        stockItemId: data.stockItemId || null,
        huid: data.huid,
        huidRegistrationDate: data.huidRegistrationDate ? new Date(data.huidRegistrationDate) : null,
        hallmarkNumber: data.hallmarkNumber || null,
        complianceStatus: data.complianceStatus,
        bisStandard: data.bisStandard || null,
        ahcCode: data.ahcCode || null,
        jewelType: data.jewelType || null,
        certificationDate: data.certificationDate ? new Date(data.certificationDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        notes: data.notes || null,
      },
    });

    // Log creation
    await logCreate(AuditModule.PRODUCTS, record.id, record, session!.shopId!);

    return NextResponse.json(successResponse(record), { status: 201 });
  } catch (error: any) {
    console.error('Error creating BIS compliance record:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
