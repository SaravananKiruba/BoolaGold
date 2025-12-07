// Stock Item Repository

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { buildSoftDeleteFilter } from '@/utils/filters';
import { StockStatus } from '@/domain/entities/types';

export interface StockItemFilters {
  productId?: string;
  status?: StockStatus;
  purchaseOrderId?: string;
}

export class StockItemRepository {
  /**
   * Create stock item
   */
  async create(data: Prisma.StockItemCreateInput) {
    return prisma.stockItem.create({
      data,
      include: {
        product: true,
      },
    });
  }

  /**
   * Create multiple stock items
   */
  async createMany(items: Prisma.StockItemCreateManyInput[]) {
    return prisma.stockItem.createMany({
      data: items,
    });
  }

  /**
   * Find stock item by ID
   */
  async findById(id: string, includeDeleted = false) {
    return prisma.stockItem.findFirst({
      where: {
        id,
        ...buildSoftDeleteFilter(includeDeleted),
      },
      include: {
        product: true,
        purchaseOrder: true,
        salesOrderLine: true,
      },
    });
  }

  /**
   * Find stock item by tag ID
   */
  async findByTagId(tagId: string) {
    return prisma.stockItem.findFirst({
      where: {
        tagId,
        deletedAt: null,
      },
      include: {
        product: true,
        purchaseOrder: true,
        salesOrderLine: true,
      },
    });
  }

  /**
   * Find stock item by barcode
   */
  async findByBarcode(barcode: string) {
    return prisma.stockItem.findFirst({
      where: {
        barcode,
        deletedAt: null,
      },
      include: {
        product: true,
      },
    });
  }

  /**
   * Find available stock items for a product (FIFO)
   */
  async findAvailableByProduct(productId: string, limit?: number) {
    return prisma.stockItem.findMany({
      where: {
        productId,
        status: 'AVAILABLE',
        deletedAt: null,
      },
      orderBy: {
        purchaseDate: 'asc', // FIFO: oldest first
      },
      take: limit,
      include: {
        product: true,
      },
    });
  }

  /**
   * Find all stock items with filters
   */
  async findAll(filters: StockItemFilters = {}, pagination: PaginationParams = {}) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.StockItemWhereInput = {
      ...buildSoftDeleteFilter(),
    };

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.purchaseOrderId) {
      where.purchaseOrderId = filters.purchaseOrderId;
    }

    const [items, totalCount] = await Promise.all([
      prisma.stockItem.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
        },
      }),
      prisma.stockItem.count({ where }),
    ]);

    return createPaginatedResponse(items, page, pageSize, totalCount);
  }

  /**
   * Update stock item status
   */
  async updateStatus(id: string, status: StockStatus) {
    return prisma.stockItem.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Mark stock item as sold
   */
  async markAsSold(id: string, salesOrderLineId: string) {
    return prisma.stockItem.update({
      where: { id },
      data: {
        status: 'SOLD',
        saleDate: new Date(),
        salesOrderLineId,
      },
    });
  }

  /**
   * Reserve stock item
   */
  async reserve(id: string) {
    return prisma.stockItem.update({
      where: { id },
      data: { status: 'RESERVED' },
    });
  }

  /**
   * Release reserved stock item
   */
  async release(id: string) {
    return prisma.stockItem.update({
      where: { id },
      data: { status: 'AVAILABLE' },
    });
  }

  /**
   * Get inventory value (based on purchase cost)
   */
  async getInventoryValue() {
    const result = await prisma.stockItem.aggregate({
      where: {
        status: { in: ['AVAILABLE', 'RESERVED'] },
        deletedAt: null,
      },
      _sum: {
        purchaseCost: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalValue: result._sum.purchaseCost || 0,
      totalItems: result._count.id,
    };
  }

  /**
   * Get stock summary by product
   */
  async getStockSummaryByProduct(productId: string) {
    const summary = await prisma.stockItem.groupBy({
      by: ['status'],
      where: {
        productId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
      _sum: {
        purchaseCost: true,
      },
    });

    return summary;
  }
}

export const stockItemRepository = new StockItemRepository();
