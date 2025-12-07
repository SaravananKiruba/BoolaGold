// EMI Payment Repository for EMI Management (User Story 16)

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { buildSoftDeleteFilter } from '@/utils/filters';
import { EmiInstallmentStatus, PaymentMethod } from '@/domain/entities/types';
import { BaseRepository, RepositoryOptions } from './baseRepository';

export interface EmiPaymentFilters {
  customerId?: string;
  status?: EmiInstallmentStatus;
  overdue?: boolean;
}

export class EmiPaymentRepository extends BaseRepository {
  constructor(options: RepositoryOptions) {
    super(options);
  }

  /**
   * Create a new EMI payment with installments
   */
  async create(data: Omit<Prisma.EmiPaymentCreateInput, 'shop'>) {
    return prisma.emiPayment.create({
      data: {
        ...data,
        shopId: this.getShopId(),
      },
      include: {
        customer: true,
        installments: true,
      },
    });
  }

  /**
   * Find EMI payment by ID
   */
  async findById(id: string, includeDeleted = false) {
    const where = this.withShopContext({
      id,
      ...buildSoftDeleteFilter(includeDeleted),
    });

    return prisma.emiPayment.findFirst({
      where,
      include: {
        customer: true,
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });
  }

  /**
   * Find all EMI payments with pagination and filters
   */
  async findAll(filters: EmiPaymentFilters = {}, pagination: PaginationParams = {}) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.EmiPaymentWhereInput = this.withShopContext({
      ...buildSoftDeleteFilter(),
    });

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Filter for overdue EMIs
    if (filters.overdue) {
      where.nextInstallmentDate = {
        lt: new Date(),
      };
      where.status = {
        in: [EmiInstallmentStatus.PENDING, EmiInstallmentStatus.OVERDUE],
      };
    }

    const [emiPayments, totalCount] = await Promise.all([
      prisma.emiPayment.findMany({
        where,
        skip,
        take,
        orderBy: { nextInstallmentDate: 'asc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: {
              installments: true,
            },
          },
        },
      }),
      prisma.emiPayment.count({ where }),
    ]);

    return createPaginatedResponse(emiPayments, page, pageSize, totalCount);
  }

  /**
   * Update EMI payment
   */
  async update(id: string, data: Prisma.EmiPaymentUpdateInput) {
    return prisma.emiPayment.update({
      where: { id },
      data,
      include: {
        customer: true,
        installments: true,
      },
    });
  }

  /**
   * Soft delete EMI payment
   */
  async softDelete(id: string) {
    return prisma.emiPayment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Record installment payment
   */
  async recordInstallmentPayment(
    emiPaymentId: string,
    installmentId: string,
    amount: number,
    paymentMode: PaymentMethod,
    referenceNumber?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Get EMI payment details
      const emiPayment = await tx.emiPayment.findUnique({
        where: { id: emiPaymentId },
        include: {
          installments: {
            orderBy: { installmentNumber: 'asc' },
          },
        },
      });

      if (!emiPayment) {
        throw new Error('EMI payment not found');
      }

      // Get installment
      const installment = await tx.emiInstallment.findUnique({
        where: { id: installmentId },
      });

      if (!installment) {
        throw new Error('Installment not found');
      }

      // Update installment
      const newPaidAmount = Number(installment.paidAmount) + amount;
      const installmentStatus =
        newPaidAmount >= Number(installment.amount)
          ? EmiInstallmentStatus.PAID
          : EmiInstallmentStatus.PENDING;

      const updatedInstallment = await tx.emiInstallment.update({
        where: { id: installmentId },
        data: {
          paidAmount: newPaidAmount,
          paymentDate: new Date(),
          paymentMode,
          referenceNumber: referenceNumber || null,
          status: installmentStatus,
        },
      });

      // Update EMI payment
      const newRemainingAmount = Number(emiPayment.remainingAmount) - amount;
      const nextPendingInstallment = emiPayment.installments.find(
        (inst) => inst.status === EmiInstallmentStatus.PENDING && inst.id !== installmentId
      );

      const emiStatus =
        newRemainingAmount <= 0
          ? EmiInstallmentStatus.PAID
          : EmiInstallmentStatus.PENDING;

      const updatedEmi = await tx.emiPayment.update({
        where: { id: emiPaymentId },
        data: {
          remainingAmount: Math.max(0, newRemainingAmount),
          lastPaymentDate: new Date(),
          nextInstallmentDate: nextPendingInstallment
            ? nextPendingInstallment.dueDate
            : emiPayment.nextInstallmentDate,
          currentInstallment: installment.installmentNumber + 1,
          status: emiStatus,
        },
      });

      return {
        installment: updatedInstallment,
        emiPayment: updatedEmi,
      };
    });
  }

  /**
   * Get overdue EMIs
   */
  async getOverdueEmis() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.emiPayment.findMany({
      where: {
        nextInstallmentDate: {
          lt: today,
        },
        status: {
          in: [EmiInstallmentStatus.PENDING, EmiInstallmentStatus.OVERDUE],
        },
        deletedAt: null,
      },
      include: {
        customer: true,
        installments: {
          where: {
            status: {
              in: [EmiInstallmentStatus.PENDING, EmiInstallmentStatus.OVERDUE],
            },
            dueDate: {
              lt: today,
            },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });
  }

  /**
   * Mark overdue installments
   */
  async markOverdueInstallments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.$transaction(async (tx) => {
      // Update overdue installments
      const overdueInstallments = await tx.emiInstallment.updateMany({
        where: {
          dueDate: {
            lt: today,
          },
          status: EmiInstallmentStatus.PENDING,
        },
        data: {
          status: EmiInstallmentStatus.OVERDUE,
        },
      });

      // Update overdue EMI payments
      const overdueEmis = await tx.emiPayment.updateMany({
        where: {
          nextInstallmentDate: {
            lt: today,
          },
          status: EmiInstallmentStatus.PENDING,
        },
        data: {
          status: EmiInstallmentStatus.OVERDUE,
        },
      });

      return {
        overdueInstallments: overdueInstallments.count,
        overdueEmis: overdueEmis.count,
      };
    });
  }

  /**
   * Get EMI summary for customer
   */
  async getCustomerEmiSummary(customerId: string) {
    const [activeEmis, totalOwed, overdueAmount] = await Promise.all([
      prisma.emiPayment.count({
        where: {
          customerId,
          status: {
            in: [EmiInstallmentStatus.PENDING, EmiInstallmentStatus.OVERDUE],
          },
          deletedAt: null,
        },
      }),
      prisma.emiPayment.aggregate({
        where: {
          customerId,
          status: {
            in: [EmiInstallmentStatus.PENDING, EmiInstallmentStatus.OVERDUE],
          },
          deletedAt: null,
        },
        _sum: {
          remainingAmount: true,
        },
      }),
      prisma.emiPayment.aggregate({
        where: {
          customerId,
          status: EmiInstallmentStatus.OVERDUE,
          deletedAt: null,
        },
        _sum: {
          remainingAmount: true,
        },
      }),
    ]);

    return {
      activeEmis,
      totalOwed: totalOwed._sum.remainingAmount || 0,
      overdueAmount: overdueAmount._sum.remainingAmount || 0,
    };
  }

  /**
   * Find EMI payments by customer
   */
  async findByCustomer(customerId: string, pagination: PaginationParams = {}) {
    return this.findAll({ customerId }, pagination);
  }

  /**
   * Find installment by ID
   */
  async findInstallmentById(installmentId: string) {
    return prisma.emiInstallment.findUnique({
      where: { id: installmentId },
      include: {
        emiPayment: {
          include: {
            customer: true,
          },
        },
      },
    });
  }

  /**
   * Get upcoming installments
   */
  async getUpcomingInstallments(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return prisma.emiInstallment.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: futureDate,
        },
        status: EmiInstallmentStatus.PENDING,
      },
      include: {
        emiPayment: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
