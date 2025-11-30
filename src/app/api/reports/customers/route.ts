// Customer Reports API - Customer purchase analysis

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError, successResponse } from '@/utils/response';
import { buildDateRangeFilter } from '@/utils/filters';

/**
 * GET /api/reports/customers
 * Get customer purchase reports and behavior analysis
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerType = searchParams.get('customerType');

    // Build date range filter
    const dateRange = buildDateRangeFilter(
      startDate || endDate ? { 
        startDate: startDate || undefined, 
        endDate: endDate || undefined 
      } : undefined
    );

    // Build where clause for orders
    const ordersWhere: any = {
      deletedAt: null,
      status: 'COMPLETED',
    };

    if (dateRange) {
      ordersWhere.orderDate = dateRange;
    }

    // Fetch all completed orders with customer details
    const orders = await prisma.salesOrder.findMany({
      where: ordersWhere,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            customerType: true,
            registrationDate: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    // Customer-wise purchase details
    const customerPurchases: Record<string, {
      customerId: string;
      customerName: string;
      customerPhone: string;
      customerType: string;
      totalPurchaseValue: number;
      orderCount: number;
      lastPurchaseDate: Date;
      firstPurchaseDate: Date;
      registrationDate: Date;
      pendingPayment: number;
    }> = {};

    let totalPurchasesAmount = 0;

    // Process orders
    for (const order of orders) {
      const customerId = order.customerId;
      const orderAmount = Number(order.finalAmount || 0);
      const paidAmount = Number(order.paidAmount || 0);
      const pendingAmount = orderAmount - paidAmount;

      totalPurchasesAmount += orderAmount;

      if (!customerPurchases[customerId]) {
        customerPurchases[customerId] = {
          customerId,
          customerName: order.customer.name,
          customerPhone: order.customer.phone,
          customerType: order.customer.customerType,
          totalPurchaseValue: 0,
          orderCount: 0,
          lastPurchaseDate: order.orderDate,
          firstPurchaseDate: order.orderDate,
          registrationDate: order.customer.registrationDate,
          pendingPayment: 0,
        };
      }

      customerPurchases[customerId].totalPurchaseValue += orderAmount;
      customerPurchases[customerId].orderCount++;
      customerPurchases[customerId].pendingPayment += pendingAmount;

      // Update first and last purchase dates
      if (order.orderDate < customerPurchases[customerId].firstPurchaseDate) {
        customerPurchases[customerId].firstPurchaseDate = order.orderDate;
      }
      if (order.orderDate > customerPurchases[customerId].lastPurchaseDate) {
        customerPurchases[customerId].lastPurchaseDate = order.orderDate;
      }
    }

    // Convert to array and sort by purchase value
    const customerDetails = Object.values(customerPurchases)
      .filter((customer) => {
        if (customerType && customer.customerType !== customerType) {
          return false;
        }
        return true;
      })
      .map((customer) => ({
        ...customer,
        totalPurchaseValue: Number(customer.totalPurchaseValue.toFixed(2)),
        pendingPayment: Number(customer.pendingPayment.toFixed(2)),
      }))
      .sort((a, b) => b.totalPurchaseValue - a.totalPurchaseValue);

    // Top customers by purchase value
    const topCustomers = customerDetails.slice(0, 10);

    // New customer acquisition in period
    const newCustomers = customerDetails.filter((customer) => {
      if (!dateRange) return false;
      
      const regDate = new Date(customer.registrationDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && regDate < start) return false;
      if (end && regDate > end) return false;
      
      return true;
    });

    // Repeat customers (more than 1 order in the period)
    const repeatCustomers = customerDetails.filter((customer) => customer.orderCount > 1);

    // Customer retention metrics
    const totalCustomersInPeriod = customerDetails.length;
    const newCustomersCount = newCustomers.length;
    const repeatCustomersCount = repeatCustomers.length;
    const retentionRate = totalCustomersInPeriod > 0 
      ? (repeatCustomersCount / totalCustomersInPeriod) * 100 
      : 0;

    // Customer type breakdown
    const customerTypeBreakdown: Record<string, {
      customerType: string;
      count: number;
      totalPurchaseValue: number;
      averagePurchaseValue: number;
    }> = {};

    customerDetails.forEach((customer) => {
      const type = customer.customerType;
      if (!customerTypeBreakdown[type]) {
        customerTypeBreakdown[type] = {
          customerType: type,
          count: 0,
          totalPurchaseValue: 0,
          averagePurchaseValue: 0,
        };
      }
      customerTypeBreakdown[type].count++;
      customerTypeBreakdown[type].totalPurchaseValue += customer.totalPurchaseValue;
    });

    // Calculate average purchase value for each customer type
    Object.values(customerTypeBreakdown).forEach((type) => {
      type.averagePurchaseValue = type.count > 0 
        ? type.totalPurchaseValue / type.count 
        : 0;
      type.totalPurchaseValue = Number(type.totalPurchaseValue.toFixed(2));
      type.averagePurchaseValue = Number(type.averagePurchaseValue.toFixed(2));
    });

    return Response.json(successResponse({
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      filters: {
        customerType: customerType || null,
      },
      summary: {
        totalCustomers: totalCustomersInPeriod,
        totalPurchasesAmount: Number(totalPurchasesAmount.toFixed(2)),
        averagePurchasePerCustomer: totalCustomersInPeriod > 0 
          ? Number((totalPurchasesAmount / totalCustomersInPeriod).toFixed(2)) 
          : 0,
        newCustomersCount,
        repeatCustomersCount,
        retentionRate: Number(retentionRate.toFixed(2)),
      },
      customerDetails,
      topCustomers,
      newCustomers: newCustomers.map((customer) => ({
        customerId: customer.customerId,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
        registrationDate: customer.registrationDate,
        firstPurchaseDate: customer.firstPurchaseDate,
        totalPurchaseValue: customer.totalPurchaseValue,
      })),
      customerTypeBreakdown: Object.values(customerTypeBreakdown),
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
