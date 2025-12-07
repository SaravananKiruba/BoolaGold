// Supplier Detail API - Get, Update, Delete (User Story 9)

import { NextRequest, NextResponse } from 'next/server';
import { SupplierRepository } from '@/repositories/supplierRepository';
import { handleApiError, successResponse, errorResponse } from '@/utils/response';
import { logAudit } from '@/utils/audit';
import { AuditAction, AuditModule } from '@/domain/entities/types';
import { getSession, hasPermission } from '@/lib/auth';

/**
 * GET /api/suppliers/[id]
 * Get supplier details including statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'SUPPLIER_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const supplierId = params.id;

    const repository = new SupplierRepository({ session });
    const supplier = await repository.findById(supplierId);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Get supplier statistics
    const stats = await supplierRepository.getSupplierStats(supplierId);

    return NextResponse.json(successResponse({
      ...supplier,
      stats,
    }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/suppliers/[id]
 * Update supplier details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'SUPPLIER_EDIT')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const supplierId = params.id;
    const body = await request.json();

    // Get existing supplier
    const repository = new SupplierRepository({ session });
    const existingSupplier = await repository.findById(supplierId);
    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      city,
      isActive,
    } = body;

    // Validate phone format if provided
    if (phone) {
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format. Must be 10-15 digits.' },
          { status: 400 }
        );
      }

      // Check if phone is already used by another supplier
      if (phone !== existingSupplier.phone) {
        const phoneExists = await supplierRepository.findByPhone(phone);
        if (phoneExists) {
          return NextResponse.json(
            { error: 'Phone number already used by another supplier' },
            { status: 409 }
          );
        }
      }
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Update supplier
    const updatedSupplier = await supplierRepository.update(supplierId, {
      name,
      contactPerson,
      phone,
      email,
      address,
      city,
      isActive,
    });

    // Log audit
    await logAudit({
      action: AuditAction.UPDATE,
      module: AuditModule.SUPPLIERS,
      entityId: supplierId,
      beforeData: existingSupplier,
      afterData: updatedSupplier,
    });

    return NextResponse.json(successResponse(updatedSupplier), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/suppliers/[id]
 * Soft delete a supplier
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = params.id;

    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Soft delete supplier
    await supplierRepository.softDelete(supplierId);

    // Log audit
    await logAudit({
      action: AuditAction.DELETE,
      module: AuditModule.SUPPLIERS,
      entityId: supplierId,
      beforeData: supplier,
    });

    return NextResponse.json(successResponse({ message: 'Supplier deleted successfully' }), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
