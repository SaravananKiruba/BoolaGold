// Product Repository

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { SessionPayload } from '@/lib/auth';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { buildSoftDeleteFilter } from '@/utils/filters';
import { MetalType } from '@/domain/entities/types';
import { BaseRepository, RepositoryOptions } from './baseRepository';

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

export class ProductRepository extends BaseRepository {
  constructor(options: RepositoryOptions) {
    super(options);
  }

  /**
   * Create a new product
   */
  async create(data: Omit<Prisma.ProductUncheckedCreateInput, 'shopId'>) {
    return prisma.product.create({
      data: {
        ...data,
        shopId: this.getShopId(), // Automatically add shopId from session
      } as Prisma.ProductUncheckedCreateInput,
      include: {
        rateUsed: true,
      },
    });
  }

  /**
   * Find product by ID
   */
  async findById(id: string, includeDeleted = false) {
    const where = this.withShopContext({
      id,
      ...buildSoftDeleteFilter(includeDeleted),
    });

    return prisma.product.findFirst({
      where,
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
    const where = this.withShopContext({
      barcode,
      deletedAt: null,
    });

    return prisma.product.findFirst({
      where,
    });
  }

  /**
   * Find all products with pagination and filters
   */
  async findAll(filters: ProductFilters = {}, pagination: PaginationParams = {}) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.ProductWhereInput = this.withShopContext({
      ...buildSoftDeleteFilter(),
    });

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
        // 🚀 Use select instead of include for better performance
        select: {
          id: true,
          name: true,
          metalType: true,
          purity: true,
          grossWeight: true,
          netWeight: true,
          barcode: true,
          huid: true,
          tagNumber: true,
          makingCharges: true,
          wastagePercent: true,
          stoneValue: true,
          collectionName: true,
          design: true,
          isActive: true,
          isCustomOrder: true,
          calculatedPrice: true,
          reorderLevel: true,
          createdAt: true,
          updatedAt: true,
          shopId: true,
          supplierId: true,
          supplier: {
            select: {
              id: true,
              name: true,
            }
          },
          rateUsed: {
            select: {
              id: true,
              ratePerGram: true,
            }
          },
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
    // Verify ownership
    await this.verifyOwnership('product', id);

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
    // Verify ownership
    await this.verifyOwnership('product', id);

    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts() {
    const where = this.withShopContext({
      isActive: true,
      deletedAt: null,
    });

    const products = await prisma.product.findMany({
      where,
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
    // Verify all products belong to this shop
    for (const id of productIds) {
      await this.verifyOwnership('product', id);
    }

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
    const where = this.withShopContext({
      isActive: true,
      deletedAt: null,
    });

    const summary = await prisma.product.groupBy({
      by: ['metalType'],
      where,
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

/**
 * Factory function to create ProductRepository with session
 */
export function createProductRepository(session: SessionPayload | null): ProductRepository {
  return new ProductRepository({ session });
}
