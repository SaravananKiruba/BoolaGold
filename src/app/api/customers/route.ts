// Customer API Route - GET all customers, POST create customer
// GET /api/customers - List all customers with filters and pagination
// POST /api/customers - Create a new customer

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CustomerRepository } from '@/repositories/customerRepository';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { phoneSchema, emailSchema } from '@/utils/validation';
import { CustomerType, AuditModule } from '@/domain/entities/types';
import { logCreate } from '@/utils/audit';
import { getSession, hasPermission } from '@/lib/auth';

// Validation schema for creating a customer
const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  whatsapp: z.string().length(10).optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  dateOfBirth: z.string().optional(),
  anniversaryDate: z.string().optional(),
  customerType: z.nativeEnum(CustomerType).default(CustomerType.RETAIL),
  isActive: z.boolean().default(true),
  familyMembers: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        relation: z.string().max(50),
        dateOfBirth: z.string().optional(),
        anniversary: z.string().optional(),
      })
    )
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'CUSTOMER_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Parse filters
    const filters: any = {
      search: searchParams.get('search') || undefined,
      customerType: searchParams.get('customerType') as CustomerType | undefined,
      isActive: searchParams.get('isActive')
        ? searchParams.get('isActive') === 'true'
        : undefined,
    };

    // Parse date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      filters.registrationDateRange = {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };
    }

    // Create repository with session for automatic shop filtering
    const repository = new CustomerRepository({ session });
    const result = await repository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result.data, result.meta), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'CUSTOMER_CREATE')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = createCustomerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Create repository with session
    const repository = new CustomerRepository({ session });

    // Check if phone already exists (within this shop)
    const existingCustomer = await repository.findByPhone(data.phone);
    if (existingCustomer) {
      return NextResponse.json(errorResponse('Customer with this phone already exists'), {
        status: 409,
      });
    }

    // Prepare customer data
    const customerData: any = {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      whatsapp: data.whatsapp || null,
      address: data.address || null,
      city: data.city || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      anniversaryDate: data.anniversaryDate ? new Date(data.anniversaryDate) : null,
      customerType: data.customerType,
      isActive: data.isActive,
      registrationDate: new Date(),
    };

    // Add family members if provided
    if (data.familyMembers && data.familyMembers.length > 0) {
      customerData.familyMembers = {
        create: data.familyMembers.map((member) => ({
          name: member.name,
          relation: member.relation,
          dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
          anniversary: member.anniversary ? new Date(member.anniversary) : null,
        })),
      };
    }

    // Create customer (shopId is automatically added by repository)
    const customer = await repository.create(customerData);

    // Log the creation
    await logCreate(AuditModule.CUSTOMERS, customer.id, customer, session!.shopId!);

    return NextResponse.json(successResponse(customer), { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
