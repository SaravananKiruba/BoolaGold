// Dashboard API - Get business overview metrics

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError, successResponse } from '@/utils/response';
import { buildDateRangeFilter } from '@/utils/filters';

/**
 * GET /api/dashboard
 * Get dashboard overview with key business metrics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date range for orders and revenue
    const dateRange = buildDateRangeFilter(
      startDate || endDate ? { 
        startDate: startDate || undefined, 
        endDate: endDate || undefined 
      } : undefined
    );

    // Get total counts (not date-filtered)
    const [totalProducts, totalCustomers] = await Promise.all([
      prisma.product.count({
        where: { deletedAt: null, isActive: true },
      }),
      prisma.customer.count({
        where: { deletedAt: null },
      }),
    ]);

    // Get orders with date filter
    const ordersWhere = {
      deletedAt: null,
      ...(dateRange ? { orderDate: dateRange } : {}),
    };

    const [totalOrders, completedOrders, lastOrder] = await Promise.all([
      prisma.salesOrder.count({
        where: ordersWhere,
      }),
      prisma.salesOrder.findMany({
        where: {
          ...ordersWhere,
          status: 'COMPLETED',
        },
        select: {
          finalAmount: true,
          orderDate: true,
        },
      }),
      prisma.salesOrder.findFirst({
        where: { deletedAt: null },
        orderBy: { orderDate: 'desc' },
        select: {
          orderDate: true,
          invoiceNumber: true,
          finalAmount: true,
        },
      }),
    ]);

    // Calculate revenue from completed orders
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + Number(order.finalAmount || 0),
      0
    );

    // Calculate average order value
    const averageOrderValue =
      completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Get today's orders
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayOrders, todayCompletedOrders] = await Promise.all([
      prisma.salesOrder.count({
        where: {
          deletedAt: null,
          orderDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.salesOrder.findMany({
        where: {
          deletedAt: null,
          status: 'COMPLETED',
          orderDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        select: {
          finalAmount: true,
        },
      }),
    ]);

    const todayRevenue = todayCompletedOrders.reduce(
      (sum, order) => sum + Number(order.finalAmount || 0),
      0
    );

    // Build insights text
    const insights = `${todayOrders} order${todayOrders !== 1 ? 's' : ''} today, revenue ₹${todayRevenue.toFixed(2)}`;

    // Payment status breakdown
    const paymentStatusBreakdown = await prisma.salesOrder.groupBy({
      by: ['paymentStatus'],
      where: ordersWhere,
      _count: true,
      _sum: {
        finalAmount: true,
      },
    });

    return Response.json(successResponse({
      totalProducts,
      totalCustomers,
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      lastOrderDate: lastOrder?.orderDate || null,
      lastOrderInvoice: lastOrder?.invoiceNumber || null,
      lastOrderAmount: lastOrder ? Number(lastOrder.finalAmount) : null,
      insights,
      todayOrders,
      todayRevenue: Number(todayRevenue.toFixed(2)),
      paymentStatusBreakdown: paymentStatusBreakdown.map((item) => ({
        status: item.paymentStatus,
        count: item._count,
        totalAmount: Number(item._sum.finalAmount || 0),
      })),
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
