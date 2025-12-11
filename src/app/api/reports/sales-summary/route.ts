// Sales Summary Export API - Structured sales data for accounting

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError, successResponse } from '@/utils/response';
import { buildDateRangeFilter } from '@/utils/filters';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/sales-summary
 * Get sales summary export for external accounting systems or CA
 * 🔒 CRITICAL: Filtered by shopId for data isolation
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY: Get session and validate shopId
    const session = await getSession();
    if (!session || !session.shopId) {
      return Response.json(
        { success: false, error: 'Unauthorized: No shop context' },
        { status: 403 }
      );
    }

    const shopId = session.shopId;

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json'; // json or csv

    // Build date range filter
    const dateRange = buildDateRangeFilter(
      startDate || endDate ? { 
        startDate: startDate || undefined, 
        endDate: endDate || undefined 
      } : undefined
    );

    const ordersWhere: any = {
      deletedAt: null,
      status: 'COMPLETED',
      shopId,
    };

    if (dateRange) {
      ordersWhere.orderDate = dateRange;
    }

    // Fetch all completed orders
    const orders = await prisma.salesOrder.findMany({
      where: ordersWhere,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            customerType: true,
          },
        },
      },
      orderBy: {
        orderDate: 'asc',
      },
    });

    // Total calculations
    const totalInvoices = orders.length;
    const totalSalesAmount = orders.reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);

    // Category-wise totals (by customer type)
    const categoryTotals: Record<string, { count: number; amount: number }> = {};
    
    orders.forEach((order) => {
      const category = order.customer.customerType;
      if (!categoryTotals[category]) {
        categoryTotals[category] = { count: 0, amount: 0 };
      }
      categoryTotals[category].count++;
      categoryTotals[category].amount += Number(order.finalAmount || 0);
    });

    // Invoice details
    const invoiceDetails = orders.map((order) => ({
      invoiceNumber: order.invoiceNumber,
      invoiceDate: order.orderDate,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      customerType: order.customer.customerType,
      orderType: order.orderType,
      orderTotal: Number(order.orderTotal || 0),
      discountAmount: Number(order.discountAmount || 0),
      finalAmount: Number(order.finalAmount || 0),
      paidAmount: Number(order.paidAmount || 0),
      paymentStatus: order.paymentStatus,
    }));

    // If CSV format requested, convert to CSV string
    if (format === 'csv') {
      const csvHeaders = [
        'Invoice Number',
        'Invoice Date',
        'Customer Name',
        'Customer Phone',
        'Customer Type',
        'Order Type',
        'Order Total',
        'Discount Amount',
        'Final Amount',
        'Paid Amount',
        'Payment Status',
      ];

      const csvRows = invoiceDetails.map((invoice) => [
        invoice.invoiceNumber,
        new Date(invoice.invoiceDate).toISOString().split('T')[0],
        invoice.customerName,
        invoice.customerPhone,
        invoice.customerType,
        invoice.orderType,
        invoice.orderTotal.toFixed(2),
        invoice.discountAmount.toFixed(2),
        invoice.finalAmount.toFixed(2),
        invoice.paidAmount.toFixed(2),
        invoice.paymentStatus,
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sales-summary-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON response
    return Response.json(successResponse({
      reportType: 'Sales Summary Export',
      generatedAt: new Date().toISOString(),
      reportingPeriod: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        totalInvoices,
        totalSalesAmount: Number(totalSalesAmount.toFixed(2)),
      },
      categoryTotals: Object.entries(categoryTotals).map(([category, data]) => ({
        category,
        invoiceCount: data.count,
        totalAmount: Number(data.amount.toFixed(2)),
      })),
      invoiceDetails,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
