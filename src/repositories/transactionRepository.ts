// Transaction Repository for Financial Management (User Story 15)

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { buildDateRangeFilter, buildSoftDeleteFilter } from '@/utils/filters';
import { TransactionType, TransactionCategory, TransactionStatus, PaymentMethod, MetalType } from '@/domain/entities/types';
import { BaseRepository, RepositoryOptions } from './baseRepository';

export interface TransactionFilters {
  transactionType?: TransactionType;
  category?: TransactionCategory;
  status?: TransactionStatus;
  customerId?: string;
  salesOrderId?: string;
  paymentMode?: PaymentMethod;
  transactionDateRange?: { startDate?: Date; endDate?: Date };
  search?: string;
}

export class TransactionRepository extends BaseRepository {
  constructor(options: RepositoryOptions) {
    super(options);
  }

  /**
   * Create a new transaction
   */
  async create(data: Omit<Prisma.TransactionCreateInput, 'shop'>) {
    return prisma.transaction.create({
      data: {
        ...data,
        shopId: this.getShopId(),
      },
      include: {
        customer: true,
        salesOrder: true,
      },
    });
  }

  /**
   * Find transaction by ID
   */
  async findById(id: string, includeDeleted = false) {
    const where = this.withShopContext({
      id,
      ...buildSoftDeleteFilter(includeDeleted),
    });

    return prisma.transaction.findFirst({
      where,
      include: {
        customer: true,
        salesOrder: true,
      },
    });
  }

  /**
   * Find all transactions with pagination and filters
   */
  async findAll(filters: TransactionFilters = {}, pagination: PaginationParams = {}) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.TransactionWhereInput = this.withShopContext({
      ...buildSoftDeleteFilter(),
    });

    // Apply filters
    if (filters.search) {
      where.OR = [
        { referenceNumber: { contains: filters.search } },
        { description: { contains: filters.search } },
        { customer: { name: { contains: filters.search } } },
      ];
    }

    if (filters.transactionType) {
      where.transactionType = filters.transactionType;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.salesOrderId) {
      where.salesOrderId = filters.salesOrderId;
    }

    if (filters.paymentMode) {
      where.paymentMode = filters.paymentMode;
    }

    if (filters.transactionDateRange) {
      where.transactionDate = buildDateRangeFilter(filters.transactionDateRange);
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { transactionDate: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          salesOrder: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return createPaginatedResponse(transactions, page, pageSize, totalCount);
  }

  /**
   * Update transaction
   */
  async update(id: string, data: Prisma.TransactionUpdateInput) {
    return prisma.transaction.update({
      where: { id },
      data,
      include: {
        customer: true,
        salesOrder: true,
      },
    });
  }

  /**
   * Soft delete transaction
   */
  async softDelete(id: string) {
    return prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get income summary
   */
  async getIncomeSummary(filters: { startDate?: Date; endDate?: Date } = {}) {
    const where: Prisma.TransactionWhereInput = {
      transactionType: 'INCOME',
      status: 'COMPLETED',
      deletedAt: null,
    };

    if (filters.startDate || filters.endDate) {
      where.transactionDate = buildDateRangeFilter(filters);
    }

    const [totalIncome, incomeByPaymentMode, incomeCount] = await Promise.all([
      prisma.transaction.aggregate({
        where,
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.groupBy({
        by: ['paymentMode'],
        where,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      totalIncome: totalIncome._sum.amount || 0,
      incomeCount,
      incomeByPaymentMode,
    };
  }

  /**
   * Get expense summary
   */
  async getExpenseSummary(filters: { startDate?: Date; endDate?: Date } = {}) {
    const where: Prisma.TransactionWhereInput = {
      transactionType: 'EXPENSE',
      status: 'COMPLETED',
      deletedAt: null,
    };

    if (filters.startDate || filters.endDate) {
      where.transactionDate = buildDateRangeFilter(filters);
    }

    const [totalExpense, expenseByCategory, expenseCount] = await Promise.all([
      prisma.transaction.aggregate({
        where,
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      totalExpense: totalExpense._sum.amount || 0,
      expenseCount,
      expenseByCategory,
    };
  }

  /**
   * Get metal purchase summary
   */
  async getMetalPurchaseSummary(filters: { startDate?: Date; endDate?: Date; metalType?: MetalType } = {}) {
    const where: Prisma.TransactionWhereInput = {
      transactionType: 'METAL_PURCHASE',
      status: 'COMPLETED',
      deletedAt: null,
    };

    if (filters.startDate || filters.endDate) {
      where.transactionDate = buildDateRangeFilter(filters);
    }

    if (filters.metalType) {
      where.metalType = filters.metalType;
    }

    const [totalAmount, totalWeight, purchasesByMetal] = await Promise.all([
      prisma.transaction.aggregate({
        where,
        _sum: {
          amount: true,
          metalWeight: true,
        },
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.groupBy({
        by: ['metalType', 'metalPurity'],
        where,
        _sum: {
          metalWeight: true,
          metalCost: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      totalAmount: totalAmount._sum.amount || 0,
      totalWeight: totalAmount._sum.metalWeight || 0,
      purchaseCount: totalWeight,
      purchasesByMetal,
    };
  }

  /**
   * Get financial dashboard summary
   */
  async getDashboardSummary(filters: { startDate?: Date; endDate?: Date } = {}) {
    const [income, expense, metalPurchase] = await Promise.all([
      this.getIncomeSummary(filters),
      this.getExpenseSummary(filters),
      this.getMetalPurchaseSummary(filters),
    ]);

    const netIncome = Number(income.totalIncome) - Number(expense.totalExpense);

    return {
      income,
      expense,
      metalPurchase,
      netIncome,
    };
  }

  /**
   * Get transactions by customer
   */
  async findByCustomer(customerId: string, pagination: PaginationParams = {}) {
    return this.findAll({ customerId }, pagination);
  }

  /**
   * Find transactions by sales order
   */
  async findBySalesOrder(salesOrderId: string) {
    const where = this.withShopContext({
      salesOrderId,
      deletedAt: null,
    });

    return prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
    });
  }
}
