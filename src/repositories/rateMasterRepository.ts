// Rate Master Repository - Robust Implementation
// Handles all rate master operations with comprehensive error handling and transaction support

import { Prisma, RateMaster } from '@prisma/client';
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
   * Create a new rate master entry with transaction support
   */
  async create(data: Prisma.RateMasterCreateInput): Promise<RateMaster> {
    try {
      return await prisma.$transaction(async (tx) => {
        // If this is set as active, deactivate other rates for the same metal type and purity
        if (data.isActive) {
          await tx.rateMaster.updateMany({
            where: {
              metalType: data.metalType,
              purity: data.purity,
              isActive: true,
              id: { not: undefined }, // Exclude new record (doesn't exist yet)
            },
            data: { isActive: false },
          });
        }

        // Create the new rate master
        return await tx.rateMaster.create({
          data,
        });
      });
    } catch (error: any) {
      console.error('Error creating rate master:', error);
      throw new Error(`Failed to create rate master: ${error.message}`);
    }
  }

  /**
   * Find rate master by ID
   */
  async findById(id: string): Promise<RateMaster | null> {
    try {
      return await prisma.rateMaster.findUnique({
        where: { id },
      });
    } catch (error: any) {
      console.error('Error finding rate master by ID:', error);
      throw new Error(`Failed to find rate master: ${error.message}`);
    }
  }

  /**
   * Find all rate masters with comprehensive filtering and pagination
   */
  async findAll(filters: RateMasterFilters = {}, pagination: PaginationParams = {}) {
    try {
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

      // Date range filters
      if (filters.effectiveDateFrom || filters.effectiveDateTo) {
        where.effectiveDate = {};
        if (filters.effectiveDateFrom) {
          where.effectiveDate.gte = filters.effectiveDateFrom;
        }
        if (filters.effectiveDateTo) {
          where.effectiveDate.lte = filters.effectiveDateTo;
        }
      }

      // Execute queries in parallel for better performance
      const [rates, totalCount] = await Promise.all([
        prisma.rateMaster.findMany({
          where,
          skip,
          take,
          orderBy: [
            { isActive: 'desc' }, // Active rates first
            { effectiveDate: 'desc' }, // Then by date descending
          ],
        }),
        prisma.rateMaster.count({ where }),
      ]);

      return createPaginatedResponse(rates, page, pageSize, totalCount);
    } catch (error: any) {
      console.error('Error finding rate masters:', error);
      throw new Error(`Failed to fetch rate masters: ${error.message}`);
    }
  }

  /**
   * Get current active rate for a metal type and purity
   * Returns the most recent active rate that is currently valid
   */
  async getCurrentRate(metalType: MetalType, purity: string): Promise<RateMaster | null> {
    try {
      const now = new Date();

      return await prisma.rateMaster.findFirst({
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
    } catch (error: any) {
      console.error('Error getting current rate:', error);
      throw new Error(`Failed to get current rate: ${error.message}`);
    }
  }

  /**
   * Get all current active rates (one per metal type and purity combination)
   * Returns the most recent active rate for each unique metal type + purity combination
   */
  async getAllCurrentRates(): Promise<RateMaster[]> {
    try {
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
      const uniqueRates = new Map<string, RateMaster>();

      for (const rate of rates) {
        const key = `${rate.metalType}-${rate.purity}`;
        if (!uniqueRates.has(key)) {
          uniqueRates.set(key, rate);
        }
      }

      return Array.from(uniqueRates.values());
    } catch (error: any) {
      console.error('Error getting all current rates:', error);
      throw new Error(`Failed to get current rates: ${error.message}`);
    }
  }

  /**
   * Get rate history for a metal type and purity
   */
  async getRateHistory(
    metalType: MetalType,
    purity: string,
    pagination: PaginationParams = {}
  ) {
    try {
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
    } catch (error: any) {
      console.error('Error getting rate history:', error);
      throw new Error(`Failed to get rate history: ${error.message}`);
    }
  }

  /**
   * Update rate master with transaction support
   */
  async update(id: string, data: Prisma.RateMasterUpdateInput): Promise<RateMaster> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get the existing rate to check metal type and purity
        const existing = await tx.rateMaster.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new Error('Rate master not found');
        }

        // If activating this rate, deactivate others for same metal type and purity
        if (data.isActive === true) {
          const metalType = (data.metalType as MetalType) || existing.metalType;
          const purity = (data.purity as string) || existing.purity;

          await tx.rateMaster.updateMany({
            where: {
              metalType,
              purity,
              isActive: true,
              id: { not: id },
            },
            data: { isActive: false },
          });
        }

        // Update the rate master
        return await tx.rateMaster.update({
          where: { id },
          data,
        });
      });
    } catch (error: any) {
      console.error('Error updating rate master:', error);
      throw new Error(`Failed to update rate master: ${error.message}`);
    }
  }

  /**
   * Deactivate old rates for a metal type and purity
   */
  async deactivateOldRates(metalType: MetalType, purity: string, excludeId?: string): Promise<number> {
    try {
      const where: Prisma.RateMasterWhereInput = {
        metalType,
        purity,
        isActive: true,
      };

      if (excludeId) {
        where.id = { not: excludeId };
      }

      const result = await prisma.rateMaster.updateMany({
        where,
        data: { isActive: false },
      });

      return result.count;
    } catch (error: any) {
      console.error('Error deactivating old rates:', error);
      throw new Error(`Failed to deactivate old rates: ${error.message}`);
    }
  }

  /**
   * Delete rate master (soft delete recommended, but this is hard delete)
   */
  async delete(id: string): Promise<RateMaster> {
    try {
      return await prisma.rateMaster.delete({
        where: { id },
      });
    } catch (error: any) {
      console.error('Error deleting rate master:', error);
      throw new Error(`Failed to delete rate master: ${error.message}`);
    }
  }

  /**
   * Get distinct purities for a metal type
   */
  async getDistinctPurities(metalType: MetalType): Promise<string[]> {
    try {
      const rates = await prisma.rateMaster.findMany({
        where: { metalType },
        distinct: ['purity'],
        select: { purity: true },
        orderBy: { purity: 'asc' },
      });

      return rates.map((r) => r.purity);
    } catch (error: any) {
      console.error('Error getting distinct purities:', error);
      throw new Error(`Failed to get purities: ${error.message}`);
    }
  }

  /**
   * Get rate statistics for analytics
   */
  async getRateStatistics(
    metalType: MetalType,
    purity: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
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
        rates: rates.map(r => ({
          date: r.effectiveDate,
          rate: Number(r.ratePerGram),
        })),
      };
    } catch (error: any) {
      console.error('Error getting rate statistics:', error);
      throw new Error(`Failed to get rate statistics: ${error.message}`);
    }
  }

  /**
   * Check if a rate is currently valid
   */
  async isRateValid(id: string): Promise<boolean> {
    try {
      const rate = await this.findById(id);
      if (!rate || !rate.isActive) return false;

      const now = new Date();
      if (rate.effectiveDate > now) return false;
      if (rate.validUntil && rate.validUntil < now) return false;

      return true;
    } catch (error: any) {
      console.error('Error checking rate validity:', error);
      return false;
    }
  }

  /**
   * Get rates expiring soon (within specified days)
   */
  async getRatesExpiringSoon(days: number = 7): Promise<RateMaster[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      return await prisma.rateMaster.findMany({
        where: {
          isActive: true,
          validUntil: {
            gte: now,
            lte: futureDate,
          },
        },
        orderBy: { validUntil: 'asc' },
      });
    } catch (error: any) {
      console.error('Error getting expiring rates:', error);
      throw new Error(`Failed to get expiring rates: ${error.message}`);
    }
  }
}

export const rateMasterRepository = new RateMasterRepository();
