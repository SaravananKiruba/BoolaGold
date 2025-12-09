// BIS Compliance Bulk Import API
// User Story 29: BIS Hallmark Compliance - Bulk HUID Import

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { BisComplianceStatus, AuditModule } from '@/domain/entities/types';
import { logCreate } from '@/utils/audit';

const bulkImportItemSchema = z.object({
  productId: z.string().uuid().optional(),
  stockItemId: z.string().uuid().optional(),
  huid: z.string().min(1),
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

const bulkImportSchema = z.object({
  items: z.array(bulkImportItemSchema).min(1, 'At least one item is required'),
  skipDuplicates: z.boolean().default(true),
});

/**
 * POST /api/bis-compliance/bulk-import
 * Bulk import BIS compliance records
 * 
 * Body:
 * {
 *   "items": [...],
 *   "skipDuplicates": true/false
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = bulkImportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        validationErrorResponse(validation.error.errors),
        { status: 400 }
      );
    }

    const { items, skipDuplicates } = validation.data;

    // Check for duplicate HUIDs in the import batch
    const huids = items.map((item) => item.huid);
    const duplicatesInBatch = huids.filter((huid, index) => huids.indexOf(huid) !== index);
    
    if (duplicatesInBatch.length > 0) {
      return NextResponse.json(
        errorResponse(`Duplicate HUIDs in import batch: ${duplicatesInBatch.join(', ')}`),
        { status: 400 }
      );
    }

    // Check for existing HUIDs in database
    const existingRecords = await prisma.bisCompliance.findMany({
      where: {
        huid: { in: huids },
      },
      select: { huid: true },
    });

    const existingHuids = new Set(existingRecords.map((r) => r.huid));

    const results = {
      total: items.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Process items
    for (const item of items) {
      try {
        // Skip if HUID exists and skipDuplicates is true
        if (existingHuids.has(item.huid)) {
          if (skipDuplicates) {
            results.skipped++;
            continue;
          } else {
            results.failed++;
            results.errors.push({
              huid: item.huid,
              error: 'HUID already exists',
            });
            continue;
          }
        }

        // Create record
        const record = await prisma.bisCompliance.create({
          data: {
            shopId: session!.shopId!,
            productId: item.productId || null,
            stockItemId: item.stockItemId || null,
            huid: item.huid,
            huidRegistrationDate: item.huidRegistrationDate
              ? new Date(item.huidRegistrationDate)
              : null,
            hallmarkNumber: item.hallmarkNumber || null,
            complianceStatus: item.complianceStatus,
            bisStandard: item.bisStandard || null,
            ahcCode: item.ahcCode || null,
            jewelType: item.jewelType || null,
            certificationDate: item.certificationDate
              ? new Date(item.certificationDate)
              : null,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            notes: item.notes || null,
          },
        });

        results.imported++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          huid: item.huid,
          error: error.message,
        });
      }
    }

    // Log bulk import
    await logCreate(AuditModule.PRODUCTS, 'bulk-import', {
      action: 'bulk_import_bis_compliance',
      results,
    }, session!.shopId!);

    return NextResponse.json(
      successResponse({
        message: 'Bulk import completed',
        results,
      }),
      { status: results.failed > 0 ? 207 : 201 } // 207 Multi-Status if some failed
    );
  } catch (error: any) {
    console.error('Error bulk importing BIS compliance records:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
