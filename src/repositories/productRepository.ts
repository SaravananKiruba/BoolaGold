// Product Repository

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { buildSoftDeleteFilter } from '@/utils/filters';
import { MetalType } from '@/domain/entities/types';

export interface ProductFilters {
  search?: string;
  barcode?: string;
  huid?: string;
  tagNumber?: string;
  metalType?: MetalType;
  purity?: string;
  collectionName?: string;
  supplierId?: string;
  stockStatus?: string; // AVAILABLE, RESERVED, SOLD
  isActive?: boolean;
  isCustomOrder?: boolean;
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
        { name: { contains: filters.search } },
        { barcode: { contains: filters.search } },
        { huid: { contains: filters.search } },
        { tagNumber: { contains: filters.search } },
        { description: { contains: filters.search } },
        { collectionName: { contains: filters.search } },
      ];
    }

    if (filters.barcode) {
      where.barcode = { contains: filters.barcode };
    }

    if (filters.huid) {
      where.huid = { contains: filters.huid };
    }

    if (filters.tagNumber) {
      where.tagNumber = { contains: filters.tagNumber };
    }

    if (filters.metalType) {
      where.metalType = filters.metalType;
    }

    if (filters.purity) {
      where.purity = filters.purity;
    }

    if (filters.collectionName) {
      where.collectionName = { contains: filters.collectionName };
    }

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isCustomOrder !== undefined) {
      where.isCustomOrder = filters.isCustomOrder;
    }

    // Stock status filter
    if (filters.stockStatus) {
      where.stockItems = {
        some: {
          status: filters.stockStatus as any,
          deletedAt: null,
        },
      };
    }

    // Low stock filter
    if (filters.lowStock) {
      // This will be handled in post-processing
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: true,
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

    // Apply low stock filter if needed
    let filteredProducts = products;
    if (filters.lowStock) {
      filteredProducts = products.filter(
        (product) => product._count.stockItems <= product.reorderLevel
      );
    }

    return createPaginatedResponse(filteredProducts, page, pageSize, totalCount);
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
