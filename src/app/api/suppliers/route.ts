// Suppliers API - List and Create (User Story 9)

import { NextRequest, NextResponse } from 'next/server';
import { SupplierRepository } from '@/repositories/supplierRepository';
import { handleApiError, successResponse, errorResponse } from '@/utils/response';
import { logAudit } from '@/utils/audit';
import { AuditAction, AuditModule } from '@/domain/entities/types';
import { getSession, hasPermission } from '@/lib/auth';

/**
 * GET /api/suppliers
 * List all suppliers with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'SUPPLIER_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Filters
    const filters: any = {};

    if (searchParams.get('name')) {
      filters.name = searchParams.get('name')!;
    }

    if (searchParams.get('phone')) {
      filters.phone = searchParams.get('phone')!;
    }

    if (searchParams.get('email')) {
      filters.email = searchParams.get('email')!;
    }

    if (searchParams.get('city')) {
      filters.city = searchParams.get('city')!;
    }

    if (searchParams.get('isActive')) {
      filters.isActive = searchParams.get('isActive') === 'true';
    }

    const repository = new SupplierRepository({ session });
    const result = await repository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result.data, result.meta), { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/suppliers
 * Create a new supplier
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'SUPPLIER_CREATE')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const body = await request.json();

    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      city,
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Supplier name and phone number are required' },
        { status: 400 }
      );
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be 10-15 digits.' },
        { status: 400 }
      );
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

    // Check if supplier with same phone already exists
    const repository = new SupplierRepository({ session });
    const existingSupplier = await repository.findByPhone(phone);
    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this phone number already exists' },
        { status: 409 }
      );
    }

    // Create supplier
    const supplier = await repository.create({
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
      action: AuditAction.CREATE,
      module: AuditModule.SUPPLIERS,
      entityId: supplier.id,
      afterData: supplier,
    });

    return NextResponse.json(successResponse(supplier), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
