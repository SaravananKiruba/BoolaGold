// Product Repository

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { buildSoftDeleteFilter } from '@/utils/filters';
import { MetalType } from '@/domain/entities/types';

export interface ProductFilters {
  search?: string;
  metalType?: MetalType;
  purity?: string;
  collectionName?: string;
  isActive?: boolean;
  lowStock?: boolean;
}

export class ProductRepository {
  /**
   * Create a new product
   */
  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({
      data,
      include: {
        rateUsed: true,
      },
    });
  }

  /**
   * Find product by ID
   */
  async findById(id: string, includeDeleted = false) {
    return prisma.product.findFirst({
      where: {
        id,
        ...buildSoftDeleteFilter(includeDeleted),
      },
      include: {
        rateUsed: true,
        stockItems: {
          where: { deletedAt: null },
        },
      },
    });
  }

  /**
   * Find product by barcode
   */
  async findByBarcode(barcode: string) {
    return prisma.product.findFirst({
      where: {
        barcode,
        deletedAt: null,
      },
    });
  }

  /**
   * Find all products with pagination and filters
   */
  async findAll(filters: ProductFilters = {}, pagination: PaginationParams = {}) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.ProductWhereInput = {
      ...buildSoftDeleteFilter(),
    };

    // Apply filters
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { barcode: { contains: filters.search } },
        { huid: { contains: filters.search } },
        { tagNumber: { contains: filters.search } },
      ];
    }

    if (filters.metalType) {
      where.metalType = filters.metalType;
    }

    if (filters.purity) {
      where.purity = filters.purity;
    }

    if (filters.collectionName) {
      where.collectionName = { contains: filters.collectionName, mode: 'insensitive' };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          rateUsed: true,
          _count: {
            select: {
              stockItems: {
                where: {
                  status: 'AVAILABLE',
                  deletedAt: null,
                },
              },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return createPaginatedResponse(products, page, pageSize, totalCount);
  }

  /**
   * Update product
   */
  async update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        rateUsed: true,
      },
    });
  }

  /**
   * Soft delete product
   */
  async softDelete(id: string) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts() {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            stockItems: {
              where: {
                status: 'AVAILABLE',
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return products.filter((product) => product._count.stockItems <= product.reorderLevel);
  }

  /**
   * Bulk update prices based on new rate
   */
  async bulkUpdatePrices(
    productIds: string[],
    rateId: string,
    calculatedPrices: Record<string, number>
  ) {
    const updates = productIds.map((id) =>
      prisma.product.update({
        where: { id },
        data: {
          calculatedPrice: calculatedPrices[id],
          lastPriceUpdate: new Date(),
          rateUsedId: rateId,
        },
      })
    );

    return Promise.all(updates);
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary() {
    const summary = await prisma.product.groupBy({
      by: ['metalType'],
      where: {
        isActive: true,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
      _sum: {
        netWeight: true,
        calculatedPrice: true,
      },
    });

    return summary;
  }
}

export const productRepository = new ProductRepository();
