// Customer Repository

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { buildDateRangeFilter, buildSoftDeleteFilter } from '@/utils/filters';
import { CustomerType } from '@/domain/entities/types';

export interface CustomerFilters {
  search?: string;
  customerType?: CustomerType;
  isActive?: boolean;
  registrationDateRange?: { startDate?: Date; endDate?: Date };
}

export class CustomerRepository {
  /**
   * Create a new customer
   */
  async create(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({
      data,
      include: {
        familyMembers: true,
      },
    });
  }

  /**
   * Find customer by ID
   */
  async findById(id: string, includeDeleted = false) {
    return prisma.customer.findFirst({
      where: {
        id,
        ...buildSoftDeleteFilter(includeDeleted),
      },
      include: {
        familyMembers: true,
        salesOrders: {
          take: 10,
          orderBy: { orderDate: 'desc' },
        },
      },
    });
  }

  /**
   * Find customer by phone
   */
  async findByPhone(phone: string) {
    return prisma.customer.findFirst({
      where: {
        phone,
        deletedAt: null,
      },
    });
  }

  /**
   * Find all customers with pagination and filters
   */
  async findAll(filters: CustomerFilters = {}, pagination: PaginationParams = {}) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.CustomerWhereInput = {
      ...buildSoftDeleteFilter(),
    };

    // Apply filters
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.customerType) {
      where.customerType = filters.customerType;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.registrationDateRange) {
      where.registrationDate = buildDateRangeFilter(filters.registrationDateRange);
    }

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              salesOrders: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return createPaginatedResponse(customers, page, pageSize, totalCount);
  }

  /**
   * Update customer
   */
  async update(id: string, data: Prisma.CustomerUpdateInput) {
    return prisma.customer.update({
      where: { id },
      data,
      include: {
        familyMembers: true,
      },
    });
  }

  /**
   * Soft delete customer
   */
  async softDelete(id: string) {
    return prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get customer purchase history
   */
  async getPurchaseHistory(customerId: string, pagination: PaginationParams = {}) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.SalesOrderWhereInput = {
      customerId,
      deletedAt: null,
    };

    const [orders, totalCount] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        skip,
        take,
        orderBy: { orderDate: 'desc' },
        include: {
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
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return createPaginatedResponse(orders, page, pageSize, totalCount);
  }

  /**
   * Get customer statistics
   */
  async getStatistics(customerId: string) {
    const [totalOrders, totalPurchases, pendingPayments] = await Promise.all([
      prisma.salesOrder.count({
        where: {
          customerId,
          deletedAt: null,
        },
      }),
      prisma.salesOrder.aggregate({
        where: {
          customerId,
          status: 'COMPLETED',
          deletedAt: null,
        },
        _sum: {
          finalAmount: true,
        },
      }),
      prisma.salesOrder.aggregate({
        where: {
          customerId,
          paymentStatus: { in: ['PENDING', 'PARTIAL'] },
          deletedAt: null,
        },
        _sum: {
          finalAmount: true,
          paidAmount: true,
        },
      }),
    ]);

    const pendingAmount =
      (pendingPayments._sum.finalAmount || 0) - (pendingPayments._sum.paidAmount || 0);

    return {
      totalOrders,
      totalPurchases: totalPurchases._sum.finalAmount || 0,
      pendingAmount,
    };
  }
}

export const customerRepository = new CustomerRepository();
