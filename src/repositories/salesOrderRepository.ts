// Sales Order Repository

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { buildDateRangeFilter, buildSoftDeleteFilter } from '@/utils/filters';
import { SalesOrderStatus, OrderType, PaymentStatus } from '@/domain/entities/types';

export interface SalesOrderFilters {
  customerId?: string;
  status?: SalesOrderStatus;
  paymentStatus?: PaymentStatus;
  orderType?: OrderType;
  orderDateRange?: { startDate?: Date; endDate?: Date };
  search?: string;
}

export class SalesOrderRepository {
  /**
   * Create a new sales order with lines
   */
  async create(data: Prisma.SalesOrderCreateInput) {
    return prisma.salesOrder.create({
      data,
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
  }

  /**
   * Find sales order by ID
   */
  async findById(id: string, includeDeleted = false) {
    return prisma.salesOrder.findFirst({
      where: {
        id,
        ...buildSoftDeleteFilter(includeDeleted),
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
        payments: true,
        transactions: true,
      },
    });
  }

  /**
   * Find sales order by invoice number
   */
  async findByInvoiceNumber(invoiceNumber: string) {
    return prisma.salesOrder.findFirst({
      where: {
        invoiceNumber,
        deletedAt: null,
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
  }

  /**
   * Find all sales orders with pagination and filters
   */
  async findAll(filters: SalesOrderFilters = {}, pagination: PaginationParams = {}) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.SalesOrderWhereInput = {
      ...buildSoftDeleteFilter(),
    };

    // Apply filters
    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search } },
        { customer: { name: { contains: filters.search } } },
        { customer: { phone: { contains: filters.search } } },
      ];
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters.orderType) {
      where.orderType = filters.orderType;
    }

    if (filters.orderDateRange) {
      where.orderDate = buildDateRangeFilter(filters.orderDateRange);
    }

    const [orders, totalCount] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take,
        orderBy: { orderDate: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              customerType: true,
            },
          },
          _count: {
            select: {
              lines: true,
            },
          },
        },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return createPaginatedResponse(orders, page, pageSize, totalCount);
  }

  /**
   * Update sales order
   */
  async update(id: string, data: Prisma.SalesOrderUpdateInput) {
    return prisma.salesOrder.update({
      where: { id },
      data,
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
  }

  /**
   * Soft delete sales order
   */
  async softDelete(id: string) {
    return prisma.salesOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Add payment to sales order
   */
  async addPayment(salesOrderId: string, paymentData: Prisma.SalesPaymentCreateInput) {
    return prisma.salesPayment.create({
      data: paymentData,
    });
  }

  /**
   * Get sales statistics
   */
  async getSalesStatistics(filters: { startDate?: Date; endDate?: Date } = {}) {
    const where: Prisma.SalesOrderWhereInput = {
      status: 'COMPLETED',
      deletedAt: null,
    };

    if (filters.startDate || filters.endDate) {
      where.orderDate = buildDateRangeFilter(filters);
    }

    const [totalSales, salesByPaymentMethod, salesCount] = await Promise.all([
      prisma.salesOrder.aggregate({
        where,
        _sum: {
          finalAmount: true,
          discountAmount: true,
        },
      }),
      prisma.salesOrder.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: {
          finalAmount: true,
        },
        _count: {
          id: true,
        },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return {
      totalSales: totalSales._sum.finalAmount || 0,
      totalDiscount: totalSales._sum.discountAmount || 0,
      salesCount,
      salesByPaymentMethod,
    };
  }
}

export const salesOrderRepository = new SalesOrderRepository();
