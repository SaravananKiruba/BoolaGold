// Sales Reports API - Detailed sales analysis

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError, successResponse } from '@/utils/response';
import { buildDateRangeFilter } from '@/utils/filters';

/**
 * GET /api/reports/sales
 * Get detailed sales reports with analysis
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date range filter
    const dateRange = buildDateRangeFilter(
      startDate || endDate ? { 
        startDate: startDate || undefined, 
        endDate: endDate || undefined 
      } : undefined
    );

    const ordersWhere = {
      deletedAt: null,
      status: 'COMPLETED' as const,
      ...(dateRange ? { orderDate: dateRange } : {}),
    };

    // Fetch all completed orders with details
    const orders = await prisma.salesOrder.findMany({
      where: ordersWhere,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        lines: {
          include: {
            stockItem: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    metalType: true,
                    purity: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          select: {
            amount: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    // Calculate totals
    const totalOrders = orders.length;
    const totalSalesAmount = orders.reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);
    const totalDiscountAmount = orders.reduce((sum, order) => sum + Number(order.discountAmount || 0), 0);

    // Sales by payment method
    const paymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};
    
    orders.forEach((order) => {
      order.payments.forEach((payment) => {
        const method = payment.paymentMethod || 'UNKNOWN';
        if (!paymentMethodBreakdown[method]) {
          paymentMethodBreakdown[method] = { count: 0, amount: 0 };
        }
        paymentMethodBreakdown[method].count++;
        paymentMethodBreakdown[method].amount += Number(payment.amount || 0);
      });
    });

    // Order breakdown by customer
    const customerBreakdown: Record<string, {
      customerId: string;
      customerName: string;
      customerPhone: string;
      orderCount: number;
      totalAmount: number;
    }> = {};

    orders.forEach((order) => {
      const customerId = order.customerId;
      if (!customerBreakdown[customerId]) {
        customerBreakdown[customerId] = {
          customerId,
          customerName: order.customer.name,
          customerPhone: order.customer.phone,
          orderCount: 0,
          totalAmount: 0,
        };
      }
      customerBreakdown[customerId].orderCount++;
      customerBreakdown[customerId].totalAmount += Number(order.finalAmount || 0);
    });

    // Product-wise sales analysis
    const productBreakdown: Record<string, {
      productId: string;
      productName: string;
      metalType: string;
      purity: string;
      quantitySold: number;
      totalSalesAmount: number;
    }> = {};

    orders.forEach((order) => {
      order.lines.forEach((line) => {
        const product = line.stockItem?.product;
        if (!product) return;

        const productId = product.id;
        if (!productBreakdown[productId]) {
          productBreakdown[productId] = {
            productId,
            productName: product.name,
            metalType: product.metalType,
            purity: product.purity,
            quantitySold: 0,
            totalSalesAmount: 0,
          };
        }
        productBreakdown[productId].quantitySold += Number(line.quantity || 1);
        productBreakdown[productId].totalSalesAmount += Number(line.lineTotal || 0);
      });
    });

    // Calculate average selling price for each product
    const productAnalysis = Object.values(productBreakdown).map((product) => ({
      ...product,
      averageSellingPrice: product.quantitySold > 0 
        ? product.totalSalesAmount / product.quantitySold 
        : 0,
    }));

    // Top 5 selling products by quantity
    const topProductsByQuantity = [...productAnalysis]
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // Top 5 selling products by value
    const topProductsByValue = [...productAnalysis]
      .sort((a, b) => b.totalSalesAmount - a.totalSalesAmount)
      .slice(0, 5);

    // Monthly sales trend (if date range spans multiple months)
    const monthlySales: Record<string, { month: string; totalSales: number; orderCount: number }> = {};
    
    orders.forEach((order) => {
      const monthKey = new Date(order.orderDate).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlySales[monthKey]) {
        monthlySales[monthKey] = {
          month: monthKey,
          totalSales: 0,
          orderCount: 0,
        };
      }
      monthlySales[monthKey].totalSales += Number(order.finalAmount || 0);
      monthlySales[monthKey].orderCount++;
    });

    const monthlySalesTrend = Object.values(monthlySales).sort((a, b) => 
      a.month.localeCompare(b.month)
    );

    return Response.json(successResponse({
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        totalOrders,
        totalSalesAmount: Number(totalSalesAmount.toFixed(2)),
        totalDiscountAmount: Number(totalDiscountAmount.toFixed(2)),
        averageOrderValue: totalOrders > 0 ? Number((totalSalesAmount / totalOrders).toFixed(2)) : 0,
      },
      paymentMethodBreakdown: Object.entries(paymentMethodBreakdown).map(([method, data]) => ({
        paymentMethod: method,
        count: data.count,
        totalAmount: Number(data.amount.toFixed(2)),
      })),
      customerBreakdown: Object.values(customerBreakdown)
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .map((customer) => ({
          ...customer,
          totalAmount: Number(customer.totalAmount.toFixed(2)),
        })),
      productAnalysis: productAnalysis
        .sort((a, b) => b.totalSalesAmount - a.totalSalesAmount)
        .map((product) => ({
          ...product,
          totalSalesAmount: Number(product.totalSalesAmount.toFixed(2)),
          averageSellingPrice: Number(product.averageSellingPrice.toFixed(2)),
        })),
      topSellingProducts: {
        byQuantity: topProductsByQuantity.map((product) => ({
          ...product,
          totalSalesAmount: Number(product.totalSalesAmount.toFixed(2)),
          averageSellingPrice: Number(product.averageSellingPrice.toFixed(2)),
        })),
        byValue: topProductsByValue.map((product) => ({
          ...product,
          totalSalesAmount: Number(product.totalSalesAmount.toFixed(2)),
          averageSellingPrice: Number(product.averageSellingPrice.toFixed(2)),
        })),
      },
      monthlySalesTrend: monthlySalesTrend.map((month) => ({
        ...month,
        totalSales: Number(month.totalSales.toFixed(2)),
      })),
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
