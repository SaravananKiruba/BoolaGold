// EMI Payment Installment Payment API
// POST /api/emi-payments/[id]/pay-installment - Record installment payment

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { emiPaymentRepository } from '@/repositories/emiPaymentRepository';
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/utils/response';
import { amountSchema, uuidSchema } from '@/utils/validation';
import { PaymentMethod, AuditModule } from '@/domain/entities/types';
import { logUpdate } from '@/utils/audit';
import { getSession } from '@/lib/auth';

const payInstallmentSchema = z.object({
  installmentId: uuidSchema,
  amount: amountSchema,
  paymentMode: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const body = await request.json();
    const emiPaymentId = params.id;

    // Validate input
    const validation = payInstallmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Check if EMI payment exists
    const emiPayment = await emiPaymentRepository.findById(emiPaymentId);
    if (!emiPayment) {
      return NextResponse.json(notFoundResponse('EMI Payment'), { status: 404 });
    }

    // Check if installment exists
    const installment = await emiPaymentRepository.findInstallmentById(data.installmentId);
    if (!installment || installment.emiPaymentId !== emiPaymentId) {
      return NextResponse.json(notFoundResponse('Installment'), { status: 404 });
    }

    // Check if amount exceeds remaining amount for installment
    const remainingInstallmentAmount = Number(installment.amount) - Number(installment.paidAmount);
    if (data.amount > remainingInstallmentAmount) {
      return NextResponse.json(
        errorResponse(`Payment amount exceeds remaining installment balance of ${remainingInstallmentAmount}`),
        { status: 400 }
      );
    }

    // Record payment
    const result = await emiPaymentRepository.recordInstallmentPayment(
      emiPaymentId,
      data.installmentId,
      data.amount,
      data.paymentMode,
      data.referenceNumber
    );

    // Log the update
    await logUpdate(AuditModule.EMI, emiPaymentId, emiPayment, result.emiPayment, session!.shopId!);

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error: any) {
    console.error('Error recording installment payment:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
