// BIS Compliance Repository
// User Story 29: BIS Hallmark Compliance Management

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { SessionPayload } from '@/lib/auth';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { BisComplianceStatus } from '@/domain/entities/types';
import { BaseRepository, RepositoryOptions } from './baseRepository';

export interface BisComplianceFilters {
  complianceStatus?: BisComplianceStatus;
  huid?: string;
  productId?: string;
  stockItemId?: string;
  jewelType?: string;
  ahcCode?: string;
  expiringSoon?: boolean;
  daysUntilExpiry?: number;
}

export class BisComplianceRepository extends BaseRepository {
  constructor(options: RepositoryOptions) {
    super(options);
  }

  /**
   * Create a new BIS compliance record
   */
  async create(data: Omit<Prisma.BisComplianceUncheckedCreateInput, 'shopId'>) {
    return prisma.bisCompliance.create({
      data: {
        ...data,
        shopId: this.getShopId(),
      } as Prisma.BisComplianceUncheckedCreateInput,
    });
  }

  /**
   * Find BIS compliance record by ID
   */
  async findById(id: string) {
    return prisma.bisCompliance.findFirst({
      where: this.withShopContext({ id }),
    });
  }

  /**
   * Find BIS compliance record by HUID
   */
  async findByHuid(huid: string) {
    return prisma.bisCompliance.findFirst({
      where: this.withShopContext({ huid }),
    });
  }

  /**
   * Find BIS compliance record by product ID
   */
  async findByProductId(productId: string) {
    return prisma.bisCompliance.findFirst({
      where: this.withShopContext({ productId }),
    });
  }

  /**
   * Find BIS compliance record by stock item ID
   */
  async findByStockItemId(stockItemId: string) {
    return prisma.bisCompliance.findFirst({
      where: this.withShopContext({ stockItemId }),
    });
  }

  /**
   * Find all BIS compliance records with filters
   */
  async findAll(filters: BisComplianceFilters = {}, pagination: PaginationParams = {}) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.BisComplianceWhereInput = this.withShopContext({
      ...buildSoftDeleteFilter(),
    });

    if (filters.complianceStatus) {
      where.complianceStatus = filters.complianceStatus;
    }

    if (filters.huid) {
      where.huid = { contains: filters.huid };
    }

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.stockItemId) {
      where.stockItemId = filters.stockItemId;
    }

    if (filters.jewelType) {
      where.jewelType = { contains: filters.jewelType };
    }

    if (filters.ahcCode) {
      where.ahcCode = { contains: filters.ahcCode };
    }

    if (filters.expiringSoon) {
      const daysThreshold = filters.daysUntilExpiry || 30;
      const expiryDate = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000);
      where.expiryDate = {
        lte: expiryDate,
        gte: new Date(),
      };
    }

    const [records, totalCount] = await Promise.all([
      prisma.bisCompliance.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bisCompliance.count({ where }),
    ]);

    return createPaginatedResponse(records, page, pageSize, totalCount);
  }

  /**
   * Update BIS compliance record
   */
  async update(id: string, data: Prisma.BisComplianceUpdateInput) {
    return prisma.bisCompliance.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete BIS compliance record
   */
  async delete(id: string) {
    return prisma.bisCompliance.delete({
      where: { id },
    });
  }

  /**
   * Get non-compliant items
   */
  async getNonCompliantItems() {
    return prisma.bisCompliance.findMany({
      where: {
        OR: [
          { complianceStatus: BisComplianceStatus.NON_COMPLIANT },
          { huidRegistrationDate: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get expiring certifications
   */
  async getExpiringCertifications(daysUntilExpiry: number = 30) {
    const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);

    return prisma.bisCompliance.findMany({
      where: {
        expiryDate: {
          lte: expiryDate,
          gte: new Date(),
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  /**
   * Get compliance summary statistics
   */
  async getComplianceSummary() {
    const [total, byStatus] = await Promise.all([
      prisma.bisCompliance.count(),
      prisma.bisCompliance.groupBy({
        by: ['complianceStatus'],
        _count: { id: true },
      }),
    ]);

    const statusSummary: any = {
      compliant: 0,
      nonCompliant: 0,
      pending: 0,
    };

    byStatus.forEach((item) => {
      if (item.complianceStatus === BisComplianceStatus.COMPLIANT) {
        statusSummary.compliant = item._count.id;
      } else if (item.complianceStatus === BisComplianceStatus.NON_COMPLIANT) {
        statusSummary.nonCompliant = item._count.id;
      } else if (item.complianceStatus === BisComplianceStatus.PENDING) {
        statusSummary.pending = item._count.id;
      }
    });

    return {
      totalRecords: total,
      byStatus: statusSummary,
      complianceRate: total > 0 ? ((statusSummary.compliant / total) * 100).toFixed(2) : 0,
    };
  }

  /**
   * Bulk create BIS compliance records
   */
  async bulkCreate(records: Prisma.BisComplianceCreateManyInput[]) {
    return prisma.bisCompliance.createMany({
      data: records,
      skipDuplicates: true,
    });
  }

  /**
   * Check if HUID exists
   */
  async huidExists(huid: string): Promise<boolean> {
    const where = this.withShopContext({ huid });
    const count = await prisma.bisCompliance.count({
      where,
    });
    return count > 0;
  }
}

/**
 * Factory function to create BisComplianceRepository with session
 */
export function createBisComplianceRepository(session: SessionPayload | null): BisComplianceRepository {
  return new BisComplianceRepository({ session });
}
