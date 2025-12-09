// EMI Payment API Route - GET all EMI payments, POST create EMI
// GET /api/emi-payments - List all EMI payments with filters and pagination
// POST /api/emi-payments - Create a new EMI payment (User Story 16)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EmiPaymentRepository } from '@/repositories/emiPaymentRepository';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { amountSchema, uuidSchema } from '@/utils/validation';
import { EmiInstallmentStatus, AuditModule } from '@/domain/entities/types';
import { logCreate } from '@/utils/audit';
import { getSession, hasPermission } from '@/lib/auth';

const createEmiPaymentSchema = z.object({
  customerId: uuidSchema,
  salesOrderId: uuidSchema.optional(),
  totalAmount: amountSchema,
  interestRate: z.number().min(0).max(100).default(0),
  numberOfInstallments: z.number().int().positive().min(1),
  installmentAmount: amountSchema,
  emiStartDate: z.string().datetime(),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'EMI_MANAGE')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Parse filters
    const filters: any = {
      customerId: searchParams.get('customerId') || undefined,
      status: searchParams.get('status') as EmiInstallmentStatus | undefined,
      overdue: searchParams.get('overdue') === 'true',
    };

    const repository = new EmiPaymentRepository({ session });
    const result = await repository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result.data, result.meta), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching EMI payments:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'EMI_MANAGE')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = createEmiPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Calculate installment dates
    const startDate = new Date(data.emiStartDate);
    const installments = [];

    for (let i = 0; i < data.numberOfInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      installments.push({
        installmentNumber: i + 1,
        dueDate,
        amount: data.installmentAmount,
        paidAmount: 0,
        status: EmiInstallmentStatus.PENDING,
      });
    }

    // Create EMI payment with installments
    const repository = new EmiPaymentRepository({ session });
    const emiPayment = await repository.create({
      customerId: data.customerId,
      salesOrderId: data.salesOrderId || null,
      totalAmount: data.totalAmount,
      interestRate: data.interestRate,
      numberOfInstallments: data.numberOfInstallments,
      installmentAmount: data.installmentAmount,
      emiStartDate: startDate,
      nextInstallmentDate: startDate,
      remainingAmount: data.totalAmount,
      currentInstallment: 1,
      status: EmiInstallmentStatus.PENDING,
      installments: {
        create: installments,
      },
    });

    // Log the creation
    await logCreate(AuditModule.EMI, emiPayment.id, emiPayment, session!.shopId!);

    return NextResponse.json(successResponse(emiPayment), { status: 201 });
  } catch (error: any) {
    console.error('Error creating EMI payment:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
