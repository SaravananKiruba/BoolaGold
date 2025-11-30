// Supplier Repository - User Story 9

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { buildSoftDeleteFilter } from '@/utils/filters';

export interface SupplierFilters {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  isActive?: boolean;
}

export class SupplierRepository {
  /**
   * Create a new supplier
   */
  async create(data: Prisma.SupplierCreateInput) {
    return prisma.supplier.create({
      data,
    });
  }

  /**
   * Find supplier by ID
   */
  async findById(id: string, includeDeleted = false) {
    return prisma.supplier.findFirst({
      where: {
        id,
        ...buildSoftDeleteFilter(includeDeleted),
      },
    });
  }

  /**
   * Find supplier by phone number
   */
  async findByPhone(phone: string) {
    return prisma.supplier.findFirst({
      where: {
        phone,
        deletedAt: null,
      },
    });
  }

  /**
   * Find all suppliers with filtering and pagination
   */
  async findAll(filters: SupplierFilters, pagination: PaginationParams) {
    const { skip, take, page, pageSize } = normalizePagination(pagination);
    const where: Prisma.SupplierWhereInput = {
      ...buildSoftDeleteFilter(false),
    };

    // Apply filters
    if (filters.name) {
      where.name = {
        contains: filters.name,
      };
    }

    if (filters.phone) {
      where.phone = {
        contains: filters.phone,
      };
    }

    if (filters.email) {
      where.email = {
        contains: filters.email,
      };
    }

    if (filters.city) {
      where.city = {
        contains: filters.city,
      };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy: { registrationDate: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return createPaginatedResponse(data, page, pageSize, total);
  }

  /**
   * Update supplier
   */
  async update(id: string, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete supplier
   */
  async softDelete(id: string) {
    return prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore soft deleted supplier
   */
  async restore(id: string) {
    return prisma.supplier.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Activate/deactivate supplier
   */
  async updateStatus(id: string, isActive: boolean) {
    return prisma.supplier.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Get all products linked to a supplier
   */
  async getSupplierProducts(supplierId: string, pagination: PaginationParams) {
    const { skip, take, page, pageSize } = normalizePagination(pagination);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          supplierId,
          deletedAt: null,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({
        where: {
          supplierId,
          deletedAt: null,
        },
      }),
    ]);

    return createPaginatedResponse(products, page, pageSize, total);
  }

  /**
   * Get purchase order history with this supplier
   */
  async getPurchaseOrderHistory(supplierId: string, pagination: PaginationParams) {
    const { skip, take, page, pageSize } = normalizePagination(pagination);

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: {
          supplierId,
          deletedAt: null,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          payments: true,
        },
        skip,
        take,
        orderBy: { orderDate: 'desc' },
      }),
      prisma.purchaseOrder.count({
        where: {
          supplierId,
          deletedAt: null,
        },
      }),
    ]);

    return createPaginatedResponse(orders, page, pageSize, total);
  }

  /**
   * Get supplier statistics
   */
  async getSupplierStats(supplierId: string) {
    const [
      totalPurchaseOrders,
      completedOrders,
      pendingOrders,
      totalProductsSupplied,
      totalAmountPurchased,
      totalAmountPaid,
    ] = await Promise.all([
      // Total purchase orders
      prisma.purchaseOrder.count({
        where: {
          supplierId,
          deletedAt: null,
        },
      }),
      // Completed orders
      prisma.purchaseOrder.count({
        where: {
          supplierId,
          status: 'DELIVERED',
          deletedAt: null,
        },
      }),
      // Pending orders
      prisma.purchaseOrder.count({
        where: {
          supplierId,
          status: { in: ['PENDING', 'CONFIRMED', 'PARTIAL'] },
          deletedAt: null,
        },
      }),
      // Total products supplied
      prisma.product.count({
        where: {
          supplierId,
          deletedAt: null,
        },
      }),
      // Total amount purchased
      prisma.purchaseOrder.aggregate({
        where: {
          supplierId,
          deletedAt: null,
        },
        _sum: {
          totalAmount: true,
        },
      }),
      // Total amount paid
      prisma.purchaseOrder.aggregate({
        where: {
          supplierId,
          deletedAt: null,
        },
        _sum: {
          paidAmount: true,
        },
      }),
    ]);

    return {
      totalPurchaseOrders,
      completedOrders,
      pendingOrders,
      totalProductsSupplied,
      totalAmountPurchased: totalAmountPurchased._sum.totalAmount || 0,
      totalAmountPaid: Number(totalAmountPaid._sum.paidAmount || 0),
      outstandingAmount:
        Number(totalAmountPurchased._sum.totalAmount || 0) - Number(totalAmountPaid._sum.paidAmount || 0),
    };
  }
}

export const supplierRepository = new SupplierRepository();
