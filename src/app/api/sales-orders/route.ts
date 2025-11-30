// Sales Order API Route - GET all orders, POST create order
// GET /api/sales-orders - List all sales orders with filters and pagination
// POST /api/sales-orders - Create a new sales order

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { stockItemRepository } from '@/repositories/stockItemRepository';
import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { amountSchema, uuidSchema } from '@/utils/validation';
import { PaymentMethod, OrderType, AuditModule, TransactionType, TransactionCategory } from '@/domain/entities/types';
import { logCreate } from '@/utils/audit';
import { generateInvoiceNumber } from '@/utils/barcode';
import prisma from '@/lib/prisma';

const salesOrderLineSchema = z.object({
  stockItemId: uuidSchema,
  quantity: z.number().int().positive().default(1),
  unitPrice: amountSchema,
});

const createSalesOrderSchema = z.object({
  customerId: uuidSchema,
  lines: z.array(salesOrderLineSchema).min(1, 'At least one line item required'),
  discountAmount: amountSchema.default(0),
  paymentMethod: z.nativeEnum(PaymentMethod),
  orderType: z.nativeEnum(OrderType).default(OrderType.RETAIL),
  notes: z.string().optional(),
  paymentAmount: amountSchema.optional(),
  createAsPending: z.boolean().default(false), // If true, create as PENDING and only RESERVE stock
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Parse filters
    const filters: any = {
      search: searchParams.get('search') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      status: searchParams.get('status') || undefined,
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      orderType: searchParams.get('orderType') as OrderType | undefined,
    };

    // Date range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      filters.orderDateRange = {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };
    }

    const result = await salesOrderRepository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result.data, result.meta), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = createSalesOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Validate stock availability and calculate totals
    let orderTotal = 0;
    const stockValidations = [];

    for (const line of data.lines) {
      const stockItem = await stockItemRepository.findById(line.stockItemId);

      if (!stockItem) {
        return NextResponse.json(
          errorResponse(`Stock item ${line.stockItemId} not found`),
          { status: 404 }
        );
      }

      if (stockItem.status !== 'AVAILABLE') {
        return NextResponse.json(
          errorResponse(`Stock item ${stockItem.tagId} is not available (status: ${stockItem.status})`),
          { status: 400 }
        );
      }

      orderTotal += line.unitPrice * line.quantity;
      stockValidations.push(stockItem);
    }

    // Calculate final amount
    const finalAmount = orderTotal - data.discountAmount;

    if (finalAmount < 0) {
      return NextResponse.json(
        errorResponse('Discount cannot exceed order total'),
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Check for duplicate invoice (very unlikely)
    const existingOrder = await salesOrderRepository.findByInvoiceNumber(invoiceNumber);
    if (existingOrder) {
      return NextResponse.json(
        errorResponse('Invoice number collision, please try again'),
        { status: 409 }
      );
    }

    // Determine payment status and order status
    const paidAmount = data.paymentAmount || 0;
    let paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' = 'PENDING';
    if (paidAmount >= finalAmount) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL';
    }

    // Determine order status based on createAsPending flag
    const orderStatus = data.createAsPending ? 'PENDING' : 'COMPLETED';
    const stockStatus = data.createAsPending ? 'RESERVED' : 'SOLD';

    // Create sales order with transaction
    const salesOrder = await prisma.$transaction(async (tx) => {
      // Create sales order
      const order = await tx.salesOrder.create({
        data: {
          invoiceNumber,
          customerId: data.customerId,
          orderTotal,
          discountAmount: data.discountAmount,
          finalAmount,
          paidAmount,
          paymentMethod: data.paymentMethod,
          orderType: data.orderType,
          status: orderStatus,
          paymentStatus,
          notes: data.notes || null,
          orderDate: new Date(),
          lines: {
            create: data.lines.map((line) => ({
              stockItemId: line.stockItemId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.unitPrice * line.quantity,
            })),
          },
        },
        include: {
          customer: true,
          lines: {
            include: {
              stockItem: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      // Update stock items status (RESERVED for pending, SOLD for completed)
      for (const line of order.lines) {
        await tx.stockItem.update({
          where: { id: line.stockItemId },
          data: {
            status: stockStatus,
            saleDate: stockStatus === 'SOLD' ? new Date() : null,
            salesOrderLineId: line.id,
          },
        });
      }

      // Create income transaction only for completed orders
      if (orderStatus === 'COMPLETED') {
        await tx.transaction.create({
          data: {
            transactionDate: new Date(),
            transactionType: TransactionType.INCOME,
            amount: finalAmount,
            paymentMode: data.paymentMethod,
            category: TransactionCategory.SALES,
            description: `Sales Order ${invoiceNumber}`,
            referenceNumber: invoiceNumber,
            customerId: data.customerId,
            salesOrderId: order.id,
            status: 'COMPLETED',
            currency: 'INR',
          },
        });
      }

      // Create payment record if amount paid
      if (paidAmount > 0) {
        await tx.salesPayment.create({
          data: {
            salesOrderId: order.id,
            amount: paidAmount,
            paymentDate: new Date(),
            paymentMethod: data.paymentMethod,
            notes: 'Initial payment',
          },
        });
      }

      return order;
    });

    // Log the creation
    await logCreate(AuditModule.SALES_ORDERS, salesOrder.id, salesOrder);

    return NextResponse.json(successResponse(salesOrder), { status: 201 });
  } catch (error: any) {
    console.error('Error creating sales order:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
