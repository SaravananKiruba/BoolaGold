// Transaction API Route - GET all transactions, POST create transaction
// GET /api/transactions - List all transactions with filters and pagination
// POST /api/transactions - Create a new transaction (User Story 15)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TransactionRepository } from '@/repositories/transactionRepository';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { amountSchema, uuidSchema } from '@/utils/validation';
import { TransactionType, TransactionCategory, TransactionStatus, PaymentMethod, MetalType, AuditModule } from '@/domain/entities/types';
import { logCreate } from '@/utils/audit';
import { getSession, hasPermission } from '@/lib/auth';

const createTransactionSchema = z.object({
  transactionDate: z.string().datetime().optional(),
  transactionType: z.nativeEnum(TransactionType),
  amount: amountSchema,
  paymentMode: z.nativeEnum(PaymentMethod),
  category: z.nativeEnum(TransactionCategory).default(TransactionCategory.OTHER),
  description: z.string().optional(),
  referenceNumber: z.string().optional(),
  customerId: uuidSchema.optional(),
  salesOrderId: uuidSchema.optional(),
  status: z.nativeEnum(TransactionStatus).default(TransactionStatus.COMPLETED),
  currency: z.string().default('INR'),
  
  // Metal Purchase specific fields
  metalType: z.nativeEnum(MetalType).optional(),
  metalPurity: z.string().optional(),
  metalWeight: z.number().positive().optional(),
  metalRatePerGram: z.number().positive().optional(),
  metalCost: amountSchema.optional(),
  
  createdBy: z.string().optional(),
}).refine((data) => {
  // If metal purchase, require metal fields
  if (data.transactionType === TransactionType.METAL_PURCHASE) {
    return data.metalType && data.metalPurity && data.metalWeight && data.metalRatePerGram;
  }
  return true;
}, {
  message: 'Metal purchase requires metalType, metalPurity, metalWeight, and metalRatePerGram',
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'TRANSACTION_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Parse filters
    const filters: any = {
      search: searchParams.get('search') || undefined,
      transactionType: searchParams.get('transactionType') as TransactionType | undefined,
      category: searchParams.get('category') as TransactionCategory | undefined,
      status: searchParams.get('status') as TransactionStatus | undefined,
      customerId: searchParams.get('customerId') || undefined,
      salesOrderId: searchParams.get('salesOrderId') || undefined,
      paymentMode: searchParams.get('paymentMode') as PaymentMethod | undefined,
    };

    // Date range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      filters.transactionDateRange = {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };
    }

    const repository = new TransactionRepository({ session });
    const result = await repository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'TRANSACTION_CREATE')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = createTransactionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Calculate metal cost if not provided
    if (data.transactionType === TransactionType.METAL_PURCHASE && data.metalWeight && data.metalRatePerGram) {
      data.metalCost = data.metalWeight * data.metalRatePerGram;
    }

    // Create transaction
    const repository = new TransactionRepository({ session });
    const transaction = await repository.create({
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
      transactionType: data.transactionType,
      amount: data.amount,
      paymentMode: data.paymentMode,
      category: data.category,
      description: data.description || null,
      referenceNumber: data.referenceNumber || null,
      customer: data.customerId ? { connect: { id: data.customerId } } : undefined,
      salesOrder: data.salesOrderId ? { connect: { id: data.salesOrderId } } : undefined,
      status: data.status,
      currency: data.currency,
      metalType: data.metalType || null,
      metalPurity: data.metalPurity || null,
      metalWeight: data.metalWeight || null,
      metalRatePerGram: data.metalRatePerGram || null,
      metalCost: data.metalCost || null,
      createdBy: data.createdBy || null,
    });

    // Log the creation
    await logCreate(AuditModule.TRANSACTIONS, transaction.id, transaction);

    return NextResponse.json(successResponse(transaction), { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
