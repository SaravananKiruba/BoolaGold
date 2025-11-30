// Rate Master Repository

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { MetalType } from '@/domain/entities/types';

export interface RateMasterFilters {
  metalType?: MetalType;
  purity?: string;
  rateSource?: 'MARKET' | 'MANUAL' | 'API';
  isActive?: boolean;
  effectiveDateFrom?: Date;
  effectiveDateTo?: Date;
}

export class RateMasterRepository {
  /**
   * Create a new rate master entry
   */
  async create(data: Prisma.RateMasterCreateInput) {
    return prisma.rateMaster.create({
      data,
    });
  }

  /**
   * Find rate master by ID
   */
  async findById(id: string) {
    return prisma.rateMaster.findUnique({
      where: { id },
    });
  }

  /**
   * Find all rate masters with pagination and filters
   */
  async findAll(filters: RateMasterFilters = {}, pagination: PaginationParams = {}) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.RateMasterWhereInput = {};

    // Apply filters
    if (filters.metalType) {
      where.metalType = filters.metalType;
    }

    if (filters.purity) {
      where.purity = filters.purity;
    }

    if (filters.rateSource) {
      where.rateSource = filters.rateSource;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.effectiveDateFrom || filters.effectiveDateTo) {
      where.effectiveDate = {};
      if (filters.effectiveDateFrom) {
        where.effectiveDate.gte = filters.effectiveDateFrom;
      }
      if (filters.effectiveDateTo) {
        where.effectiveDate.lte = filters.effectiveDateTo;
      }
    }

    const [rates, totalCount] = await Promise.all([
      prisma.rateMaster.findMany({
        where,
        skip,
        take,
        orderBy: { effectiveDate: 'desc' },
      }),
      prisma.rateMaster.count({ where }),
    ]);

    return createPaginatedResponse(rates, page, pageSize, totalCount);
  }

  /**
   * Get current active rate for a metal type and purity
   */
  async getCurrentRate(metalType: MetalType, purity: string) {
    const now = new Date();
    
    return prisma.rateMaster.findFirst({
      where: {
        metalType,
        purity,
        isActive: true,
        effectiveDate: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      orderBy: {
        effectiveDate: 'desc',
      },
    });
  }

  /**
   * Get rate history for a metal type and purity
   */
  async getRateHistory(
    metalType: MetalType,
    purity: string,
    pagination: PaginationParams = {}
  ) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.RateMasterWhereInput = {
      metalType,
      purity,
    };

    const [rates, totalCount] = await Promise.all([
      prisma.rateMaster.findMany({
        where,
        skip,
        take,
        orderBy: { effectiveDate: 'desc' },
      }),
      prisma.rateMaster.count({ where }),
    ]);

    return createPaginatedResponse(rates, page, pageSize, totalCount);
  }

  /**
   * Update rate master
   */
  async update(id: string, data: Prisma.RateMasterUpdateInput) {
    return prisma.rateMaster.update({
      where: { id },
      data,
    });
  }

  /**
   * Deactivate old rates for a metal type and purity
   */
  async deactivateOldRates(metalType: MetalType, purity: string, excludeId?: string) {
    const where: Prisma.RateMasterWhereInput = {
      metalType,
      purity,
      isActive: true,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return prisma.rateMaster.updateMany({
      where,
      data: { isActive: false },
    });
  }

  /**
   * Get all current active rates (one per metal type and purity combination)
   */
  async getAllCurrentRates() {
    const now = new Date();
    
    const rates = await prisma.rateMaster.findMany({
      where: {
        isActive: true,
        effectiveDate: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      orderBy: [
        { metalType: 'asc' },
        { purity: 'asc' },
        { effectiveDate: 'desc' },
      ],
    });

    // Group by metalType and purity, keeping only the most recent
    const uniqueRates = new Map<string, any>();
    
    for (const rate of rates) {
      const key = `${rate.metalType}-${rate.purity}`;
      if (!uniqueRates.has(key)) {
        uniqueRates.set(key, rate);
      }
    }

    return Array.from(uniqueRates.values());
  }

  /**
   * Delete rate master (hard delete - use with caution)
   */
  async delete(id: string) {
    return prisma.rateMaster.delete({
      where: { id },
    });
  }

  /**
   * Get distinct purities for a metal type
   */
  async getDistinctPurities(metalType: MetalType) {
    const rates = await prisma.rateMaster.findMany({
      where: { metalType },
      distinct: ['purity'],
      select: { purity: true },
    });

    return rates.map((r) => r.purity);
  }

  /**
   * Get rate statistics for a metal type and purity over a date range
   */
  async getRateStatistics(
    metalType: MetalType,
    purity: string,
    startDate: Date,
    endDate: Date
  ) {
    const rates = await prisma.rateMaster.findMany({
      where: {
        metalType,
        purity,
        effectiveDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { effectiveDate: 'asc' },
    });

    if (rates.length === 0) {
      return null;
    }

    const rateValues = rates.map((r) => Number(r.ratePerGram));
    
    return {
      count: rates.length,
      minRate: Math.min(...rateValues),
      maxRate: Math.max(...rateValues),
      avgRate: rateValues.reduce((a, b) => a + b, 0) / rateValues.length,
      firstRate: rateValues[0],
      lastRate: rateValues[rateValues.length - 1],
      change: rateValues[rateValues.length - 1] - rateValues[0],
      changePercent:
        ((rateValues[rateValues.length - 1] - rateValues[0]) / rateValues[0]) * 100,
    };
  }
}

export const rateMasterRepository = new RateMasterRepository();
