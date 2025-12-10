// Customer API Route - GET, PUT, DELETE by ID
// GET /api/customers/[id] - Get customer details
// PUT /api/customers/[id] - Update customer
// DELETE /api/customers/[id] - Soft delete customer

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/utils/response';
import { phoneSchema, emailSchema } from '@/utils/validation';
import { CustomerType, AuditModule } from '@/domain/entities/types';
import { logUpdate, logDelete } from '@/utils/audit';
import { getSession, hasPermission } from '@/lib/auth';
import { getRepositories } from '@/utils/apiRepository';

const updateCustomerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional().or(z.literal('')),
  whatsapp: z.string().length(10).optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  dateOfBirth: z.string().optional().or(z.literal('')),
  anniversaryDate: z.string().optional().or(z.literal('')),
  customerType: z.nativeEnum(CustomerType).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'CUSTOMER_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const repos = await getRepositories(request);
    const repository = repos.customer;
    const customer = await repository.findById(params.id);

    if (!customer) {
      return NextResponse.json(notFoundResponse('Customer'), { status: 404 });
    }

    // Get customer statistics
    const stats = await repository.getStatistics(params.id);

    return NextResponse.json(
      successResponse({
        ...customer,
        statistics: stats,
      })
    );
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'CUSTOMER_EDIT')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = updateCustomerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    const repos = await getRepositories(request);
    const repository = repos.customer;
    
    // Check if customer exists
    const existingCustomer = await repository.findById(params.id);
    if (!existingCustomer) {
      return NextResponse.json(notFoundResponse('Customer'), { status: 404 });
    }

    // If phone is being updated, check for duplicates
    if (data.phone && data.phone !== existingCustomer.phone) {
      const phoneExists = await repository.findByPhone(data.phone);
      if (phoneExists) {
        return NextResponse.json(errorResponse('Customer with this phone already exists'), {
          status: 409,
        });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.city !== undefined) updateData.city = data.city || null;
    if (data.dateOfBirth !== undefined)
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.anniversaryDate !== undefined)
      updateData.anniversaryDate = data.anniversaryDate ? new Date(data.anniversaryDate) : null;
    if (data.customerType) updateData.customerType = data.customerType;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedCustomer = await repository.update(params.id, updateData);

    // Log the update
    await logUpdate(AuditModule.CUSTOMERS, params.id, existingCustomer, updatedCustomer, session!.shopId!);

    return NextResponse.json(successResponse(updatedCustomer), { status: 200 });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'CUSTOMER_DELETE')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const repos = await getRepositories(request);
    const repository = repos.customer;
    const customer = await repository.findById(params.id);

    if (!customer) {
      return NextResponse.json(notFoundResponse('Customer'), { status: 404 });
    }

    await repository.softDelete(params.id);

    // Log the deletion
    await logDelete(AuditModule.CUSTOMERS, params.id, customer, session!.shopId!);

    return NextResponse.json(successResponse({ message: 'Customer deleted successfully' }), { status: 200 });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
