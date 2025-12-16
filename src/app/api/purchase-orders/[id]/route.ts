// Purchase Order API - Get, Update, Delete by ID

import { NextRequest, NextResponse } from 'next/server';

import { PurchaseOrderStatus, PaymentStatus } from '@/domain/entities/types';
import { handleApiError, successResponse, errorResponse } from '@/utils/response';
import { logAudit } from '@/utils/audit';
import { AuditAction, AuditModule } from '@/domain/entities/types';
import { getSession, hasPermission } from '@/lib/auth';
import { getRepositories } from '@/utils/apiRepository';

/**
 * GET /api/purchase-orders/[id]
 * Get a specific purchase order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;
// Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'PURCHASE_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const repos = await getRepositories(request);
    const repository = repos.purchaseOrder;
    const purchaseOrder = await repository.findById(id);

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    return NextResponse.json(successResponse(purchaseOrder), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/purchase-orders/[id]
 * Update a purchase order
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;
// Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'PURCHASE_EDIT')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const body = await request.json();
    const { id } = params;

    // Get existing purchase order
    const repos = await getRepositories(request);
    const repository = repos.purchaseOrder;
    const existing = await repository.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (body.expectedDeliveryDate !== undefined) {
      updateData.expectedDeliveryDate = body.expectedDeliveryDate
        ? new Date(body.expectedDeliveryDate)
        : null;
    }

    if (body.actualDeliveryDate !== undefined) {
      updateData.actualDeliveryDate = body.actualDeliveryDate
        ? new Date(body.actualDeliveryDate)
        : null;
    }

    if (body.status !== undefined) {
      updateData.status = body.status as PurchaseOrderStatus;
    }

    if (body.paymentStatus !== undefined) {
      updateData.paymentStatus = body.paymentStatus as PaymentStatus;
    }

    if (body.discountAmount !== undefined) {
      updateData.discountAmount = body.discountAmount;
      // Recalculate total if discount changed
      const itemsTotal = existing.items.reduce((sum, item) => {
        return sum + Number(item.quantity) * Number(item.unitPrice);
      }, 0);
      updateData.totalAmount = itemsTotal - body.discountAmount;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.referenceNumber !== undefined) {
      updateData.referenceNumber = body.referenceNumber;
    }

    const updated = await repository.update(id, updateData);

    // Log audit
    await logAudit({
      shopId: session!.shopId!,
      action: AuditAction.UPDATE,
      module: AuditModule.PURCHASE_ORDERS,
      entityId: id,
      beforeData: existing,
      afterData: updated,
    });

    return NextResponse.json(successResponse(updated), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/purchase-orders/[id]/close
 * Close purchase order (User Story 11)
 * Available via query parameter: ?action=close
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;
const { id } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const session = await getSession();
    const repos = await getRepositories(request);
    const repository = repos.purchaseOrder;

    if (action === 'close') {
      const existing = await repository.findById(id);
      if (!existing) {
        return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
      }

      const closed = await repository.closePurchaseOrder(id);

      // Log audit
      await logAudit({
        shopId: session!.shopId!,
        action: AuditAction.STATUS_CHANGE,
        module: AuditModule.PURCHASE_ORDERS,
        entityId: id,
        beforeData: existing,
        afterData: closed,
      });

      return NextResponse.json(successResponse({
        message: 'Purchase order closed successfully',
        purchaseOrder: closed,
      }), { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/purchase-orders/[id]
 * Soft delete a purchase order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;
const { id } = params;

    const session = await getSession();
    const repos = await getRepositories(request);
    const repository = repos.purchaseOrder;

    const existing = await repository.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    await repository.softDelete(id);

    // Log audit
    await logAudit({
      shopId: session!.shopId!,
      action: AuditAction.DELETE,
      module: AuditModule.PURCHASE_ORDERS,
      entityId: id,
      beforeData: existing,
    });

    return NextResponse.json(successResponse({ message: 'Purchase order deleted successfully' }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
