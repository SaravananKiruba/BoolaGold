// Transaction API Route - GET by ID, PATCH update, DELETE soft delete
// GET /api/transactions/[id] - Get transaction details
// PATCH /api/transactions/[id] - Update transaction
// DELETE /api/transactions/[id] - Soft delete transaction

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/utils/response';
import { amountSchema } from '@/utils/validation';
import { TransactionStatus, PaymentMethod, AuditModule } from '@/domain/entities/types';
import { logUpdate, logDelete } from '@/utils/audit';
import { getSession, hasPermission } from '@/lib/auth';
import { getRepositories } from '@/utils/apiRepository';

const updateTransactionSchema = z.object({
  amount: amountSchema.optional(),
  paymentMode: z.nativeEnum(PaymentMethod).optional(),
  description: z.string().optional(),
  referenceNumber: z.string().optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  metalWeight: z.number().positive().optional(),
  metalRatePerGram: z.number().positive().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'TRANSACTION_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const repos = await getRepositories(request);
    const repository = repos.transaction;
    const transaction = await repository.findById(id);

    if (!transaction) {
      return NextResponse.json(notFoundResponse('Transaction'), { status: 404 });
    }

    return NextResponse.json(successResponse(transaction), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;
// Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'TRANSACTION_EDIT')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = updateTransactionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    // Initialize repository
    const repos = await getRepositories(request);
    const transactionRepository = repos.transaction;
    const repository = transactionRepository;

    // Check if transaction exists
    const existingTransaction = await repos.transaction.findById(id);
    if (!existingTransaction) {
      return NextResponse.json(notFoundResponse('Transaction'), { status: 404 });
    }

    const data = validation.data;

    // Recalculate metal cost if metal purchase and weight or rate changed
    let updateData: any = { ...data };
    if (existingTransaction.transactionType === 'METAL_PURCHASE') {
      const newWeight = data.metalWeight || Number(existingTransaction.metalWeight);
      const newRate = data.metalRatePerGram || Number(existingTransaction.metalRatePerGram);
      if (data.metalWeight || data.metalRatePerGram) {
        updateData.metalCost = newWeight * newRate;
      }
    }

    // Update transaction
    const transaction = await repository.update(id, updateData);

    // Log the update
    await logUpdate(AuditModule.TRANSACTIONS, id, existingTransaction, transaction, session!.shopId!);

    return NextResponse.json(successResponse(transaction), { status: 200 });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;
const session = await getSession();
    const repos = await getRepositories(request);
    const transactionRepository = repos.transaction;
    // Check if transaction exists
    const existingTransaction = await repos.transaction.findById(id);
    if (!existingTransaction) {
      return NextResponse.json(notFoundResponse('Transaction'), { status: 404 });
    }

    // Soft delete
    await repos.transaction.softDelete(id);

    // Log the deletion
    await logDelete(AuditModule.TRANSACTIONS, id, existingTransaction, session!.shopId!);

    return NextResponse.json(successResponse({ message: 'Transaction deleted successfully' }), { status: 200 });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
