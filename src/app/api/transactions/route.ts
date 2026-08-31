// Transaction API Route - GET all transactions, POST create transaction
// GET /api/transactions - List all transactions with filters and pagination
// POST /api/transactions - Create a new transaction (User Story 15)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { amountSchema, uuidSchema } from '@/utils/validation';
import { TransactionType, TransactionCategory, TransactionStatus, PaymentMethod, MetalType, AuditModule } from '@/domain/entities/types';
import { logCreate } from '@/utils/audit';
import { getSession, hasPermission } from '@/lib/auth';
import { getRepositories } from '@/utils/apiRepository';
import {
  validateTransactionForShopType,
  computeExcludeFromProfitLoss,
} from '@/utils/wholesaleValidation';

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

  // Metal fields (used by METAL_PURCHASE and METAL_EXCHANGE_IN/OUT)
  metalType: z.nativeEnum(MetalType).optional(),
  metalPurity: z.string().optional(),
  metalWeight: z.number().positive().optional(),
  metalRatePerGram: z.number().positive().optional(),
  metalCost: amountSchema.optional(),

  // For wholesale metal-exchange pairing (IN <-> OUT)
  exchangeReferenceId: z.string().max(100).optional(),
  excludeFromProfitLoss: z.boolean().optional(),

  createdBy: z.string().optional(),
}).refine((data) => {
  if (data.transactionType === TransactionType.METAL_PURCHASE) {
    return !!(data.metalType && data.metalPurity && data.metalWeight && data.metalRatePerGram);
  }
  return true;
}, {
  message: 'Metal purchase requires metalType, metalPurity, metalWeight, and metalRatePerGram',
}).refine((data) => {
  if (
    data.transactionType === TransactionType.METAL_EXCHANGE_IN ||
    data.transactionType === TransactionType.METAL_EXCHANGE_OUT
  ) {
    return !!(data.metalType && data.metalPurity && data.metalWeight);
  }
  return true;
}, {
  message: 'Metal-exchange transactions require metalType, metalPurity, and metalWeight',
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

    const repos = await getRepositories(request);
    const repository = repos.transaction;
    const result = await repository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!hasPermission(session, 'TRANSACTION_CREATE')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }
    if (!session?.shopId) {
      return NextResponse.json(errorResponse('Unauthorized: No shop context'), { status: 403 });
    }

    const body = await request.json();
    const validation = createTransactionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Load the shop to know its business type — this is what drives retail vs wholesale rules.
    const shop = await prisma.shop.findFirst({
      where: { id: session.shopId, deletedAt: null },
      select: { shopBusinessType: true },
    });
    if (!shop) {
      return NextResponse.json(errorResponse('Shop not found'), { status: 404 });
    }
    const shopBusinessType = shop.shopBusinessType as 'RETAIL' | 'WHOLESALE';

    const flowCheck = validateTransactionForShopType(shopBusinessType, {
      transactionType: data.transactionType,
      paymentMethod: data.paymentMode,
      amount: data.amount,
      metalWeight: data.metalWeight ?? null,
    });
    if (!flowCheck.valid) {
      return NextResponse.json(errorResponse(flowCheck.error || 'Invalid transaction'), { status: 400 });
    }

    // Auto-derive metalCost when weight + rate provided (matches previous behavior).
    if (
      (data.transactionType === TransactionType.METAL_PURCHASE ||
        data.transactionType === TransactionType.METAL_EXCHANGE_IN ||
        data.transactionType === TransactionType.METAL_EXCHANGE_OUT) &&
      data.metalWeight &&
      data.metalRatePerGram &&
      data.metalCost === undefined
    ) {
      data.metalCost = data.metalWeight * data.metalRatePerGram;
    }

    // Server-computed exclude flag wins over anything the client sent.
    const excludeFromProfitLoss = computeExcludeFromProfitLoss(
      shopBusinessType,
      data.transactionType,
      data.paymentMode,
    );

    const repos = await getRepositories(request);
    const repository = repos.transaction;
    const transaction = await repository.create({
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
      transactionType: data.transactionType,
      amount: data.amount,
      paymentMode: data.paymentMode,
      category: data.category,
      description: data.description || null,
      referenceNumber: data.referenceNumber || null,
      customerId: data.customerId || undefined,
      salesOrderId: data.salesOrderId || undefined,
      status: data.status,
      currency: data.currency,
      metalType: data.metalType || null,
      metalPurity: data.metalPurity || null,
      metalWeight: data.metalWeight || null,
      metalRatePerGram: data.metalRatePerGram || null,
      metalCost: data.metalCost || null,
      exchangeReferenceId: data.exchangeReferenceId || null,
      excludeFromProfitLoss,
      createdBy: data.createdBy || session.username || null,
    });

    await logCreate(AuditModule.TRANSACTIONS, transaction.id, transaction, session.shopId);

    return NextResponse.json(successResponse(transaction), { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
