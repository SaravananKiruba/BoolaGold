// Stock Reservation API - Reserve and release stock items
// POST /api/stock/reserve - Reserve stock items for pending orders
// POST /api/stock/release - Release reserved stock items

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stockItemRepository } from '@/repositories/stockItemRepository';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/utils/response';
import { uuidSchema } from '@/utils/validation';
import { AuditModule } from '@/domain/entities/types';
import { logUpdate } from '@/utils/audit';
import prisma from '@/lib/prisma';

const reserveStockSchema = z.object({
  stockItemIds: z.array(uuidSchema).min(1, 'At least one stock item required'),
  reservationNote: z.string().optional(),
});

const releaseStockSchema = z.object({
  stockItemIds: z.array(uuidSchema).min(1, 'At least one stock item required'),
});

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const body = await request.json();

    if (action === 'reserve') {
      // Validate input
      const validation = reserveStockSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
      }

      const data = validation.data;

      // Validate all stock items exist and are available
      const stockItems = await Promise.all(
        data.stockItemIds.map((id) => stockItemRepository.findById(id))
      );

      const notFoundItems = stockItems
        .map((item, idx) => (!item ? data.stockItemIds[idx] : null))
        .filter(Boolean);

      if (notFoundItems.length > 0) {
        return NextResponse.json(
          errorResponse(`Stock items not found: ${notFoundItems.join(', ')}`),
          { status: 404 }
        );
      }

      const unavailableItems = stockItems
        .filter((item) => item && item.status !== 'AVAILABLE')
        .map((item) => item!.tagId);

      if (unavailableItems.length > 0) {
        return NextResponse.json(
          errorResponse(`Stock items not available: ${unavailableItems.join(', ')}`),
          { status: 400 }
        );
      }

      // Reserve all stock items
      const reservedItems = await prisma.$transaction(
        data.stockItemIds.map((id) =>
          prisma.stockItem.update({
            where: { id },
            data: { status: 'RESERVED' },
            include: { product: true },
          })
        )
      );

      // Log the reservation
      for (const item of reservedItems) {
        const originalItem = stockItems.find((si) => si?.id === item.id);
        await logUpdate(AuditModule.STOCK, item.id, originalItem, item);
      }

      return NextResponse.json(
        successResponse({
          message: `${reservedItems.length} stock items reserved successfully`,
          reservedItems,
        }),
        { status: 200 }
      );
    } else if (action === 'release') {
      // Validate input
      const validation = releaseStockSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
      }

      const data = validation.data;

      // Validate all stock items exist and are reserved
      const stockItems = await Promise.all(
        data.stockItemIds.map((id) => stockItemRepository.findById(id))
      );

      const notFoundItems = stockItems
        .map((item, idx) => (!item ? data.stockItemIds[idx] : null))
        .filter(Boolean);

      if (notFoundItems.length > 0) {
        return NextResponse.json(
          errorResponse(`Stock items not found: ${notFoundItems.join(', ')}`),
          { status: 404 }
        );
      }

      const notReservedItems = stockItems
        .filter((item) => item && item.status !== 'RESERVED')
        .map((item) => item!.tagId);

      if (notReservedItems.length > 0) {
        return NextResponse.json(
          errorResponse(`Stock items not reserved: ${notReservedItems.join(', ')}`),
          { status: 400 }
        );
      }

      // Release all stock items
      const releasedItems = await prisma.$transaction(
        data.stockItemIds.map((id) =>
          prisma.stockItem.update({
            where: { id },
            data: { status: 'AVAILABLE' },
            include: { product: true },
          })
        )
      );

      // Log the release
      for (const item of releasedItems) {
        const originalItem = stockItems.find((si) => si?.id === item.id);
        await logUpdate(AuditModule.STOCK, item.id, originalItem, item, session!.shopId!);
      }

      return NextResponse.json(
        successResponse({
          message: `${releasedItems.length} stock items released successfully`,
          releasedItems,
        }),
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        errorResponse('Invalid action. Use ?action=reserve or ?action=release'),
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error managing stock reservation:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
