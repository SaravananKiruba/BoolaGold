// Purchase Order Repository

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { SessionPayload } from '@/lib/auth';
import { PaginationParams, normalizePagination, createPaginatedResponse } from '@/utils/pagination';
import { buildSoftDeleteFilter } from '@/utils/filters';
import { PurchaseOrderStatus, PaymentStatus } from '@/domain/entities/types';
import { BaseRepository, RepositoryOptions } from './baseRepository';

export interface PurchaseOrderFilters {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  paymentStatus?: PaymentStatus;
  orderNumber?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface StockReceiptItem {
  purchaseOrderItemId: string;
  productId: string;
  quantityToReceive: number;
  individualItems: {
    tagId: string;
    barcode: string;
    huid?: string;
    purchaseCost: number;
    purchaseDate: Date;
  }[];
}

export class PurchaseOrderRepository extends BaseRepository {
  constructor(options: RepositoryOptions) {
    super(options);
  }

  /**
   * Create purchase order with items
   */
  async create(data: Omit<Prisma.PurchaseOrderUncheckedCreateInput, 'shopId'>) {
    return prisma.purchaseOrder.create({
      data: {
        ...data,
        shopId: this.getShopId(),
      } as Prisma.PurchaseOrderUncheckedCreateInput,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Find purchase order by ID
   */
  async findById(id: string, includeDeleted = false) {
    const where = this.withShopContext({
      id,
      ...buildSoftDeleteFilter(includeDeleted),
    });

    return prisma.purchaseOrder.findFirst({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        stockItems: {
          where: { deletedAt: null },
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });
  }

  /**
   * Find purchase order by order number
   */
  async findByOrderNumber(orderNumber: string) {
    const where = this.withShopContext({
      orderNumber,
      deletedAt: null,
    });

    return prisma.purchaseOrder.findFirst({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Find all purchase orders with filters
   */
  async findAll(filters: PurchaseOrderFilters = {}, pagination: PaginationParams = {}) {
    const { page, pageSize, skip, take } = normalizePagination(pagination);

    const where: Prisma.PurchaseOrderWhereInput = this.withShopContext({
      ...buildSoftDeleteFilter(),
    });

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters.orderNumber) {
      where.orderNumber = { contains: filters.orderNumber };
    }

    if (filters.startDate || filters.endDate) {
      where.orderDate = {};
      if (filters.startDate) {
        where.orderDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.orderDate.lte = filters.endDate;
      }
    }

    const [orders, totalCount] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy: { orderDate: 'desc' },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
          _count: {
            select: {
              stockItems: true,
            },
          },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return createPaginatedResponse(orders, page, pageSize, totalCount);
  }

  /**
   * Update purchase order
   */
  async update(id: string, data: Prisma.PurchaseOrderUpdateInput) {
    await this.verifyOwnership('purchaseOrder', id);

    return prisma.purchaseOrder.update({
      where: { id },
      data,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Update purchase order status
   */
  async updateStatus(id: string, status: PurchaseOrderStatus) {
    await this.verifyOwnership('purchaseOrder', id);

    return prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, paidAmount?: number) {
    await this.verifyOwnership('purchaseOrder', id);

    const data: any = { paymentStatus };
    if (paidAmount !== undefined) {
      data.paidAmount = paidAmount;
    }

    return prisma.purchaseOrder.update({
      where: { id },
      data,
    });
  }

  /**
   * Record payment
   */
  async recordPayment(data: Prisma.PurchasePaymentCreateInput) {
    return prisma.purchasePayment.create({
      data,
    });
  }

  /**
   * Receive stock from purchase order
   */
  async receiveStock(purchaseOrderId: string, receiptItems: StockReceiptItem[]) {
    return prisma.$transaction(async (tx) => {
      // Get the purchase order
      const purchaseOrder = await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          items: true,
        },
      });

      if (!purchaseOrder) {
        throw new Error('Purchase order not found');
      }

      // Create stock items for each individual item - ONLY purchase cost
      const stockItems = [];
      for (const receiptItem of receiptItems) {
        for (const item of receiptItem.individualItems) {
          stockItems.push({
            productId: receiptItem.productId,
            tagId: item.tagId,
            barcode: item.barcode,
            huid: item.huid || undefined,
            purchaseCost: item.purchaseCost,
            status: 'AVAILABLE' as const,
            purchaseOrderId: purchaseOrderId,
            purchaseDate: item.purchaseDate,
          });
        }

        // Update received quantity on purchase order item
        const poItem = purchaseOrder.items.find(
          (i) => i.id === receiptItem.purchaseOrderItemId
        );
        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: receiptItem.purchaseOrderItemId },
            data: {
              receivedQuantity: {
                increment: receiptItem.quantityToReceive,
              },
            },
          });
        }
      }

      // Bulk create stock items
      await tx.stockItem.createMany({
        data: stockItems,
      });

      // Update purchase order status
      const updatedPO = await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: { items: true },
      });

      if (updatedPO) {
        const allReceived = updatedPO.items.every(
          (item) => item.receivedQuantity >= item.quantity
        );
        const anyReceived = updatedPO.items.some((item) => item.receivedQuantity > 0);

        let newStatus = updatedPO.status;
        if (allReceived) {
          newStatus = PurchaseOrderStatus.DELIVERED;
        } else if (anyReceived) {
          newStatus = PurchaseOrderStatus.PARTIAL;
        }

        await tx.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: { status: newStatus },
        });
      }

      return {
        stockItems,
        purchaseOrder: updatedPO,
      };
    });
  }

  /**
   * Get pending purchase orders (for stock receipt)
   */
  async getPendingOrders() {
    const where: Prisma.PurchaseOrderWhereInput = this.withShopContext({
      status: { in: ['PENDING', 'CONFIRMED', 'PARTIAL'] as PurchaseOrderStatus[] },
      deletedAt: null,
    });

    return prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  /**
   * Get items to receive for a purchase order
   */
  async getItemsToReceive(purchaseOrderId: string) {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    return purchaseOrder.items.map((item) => ({
      id: item.id,
      product: item.product,
      orderedQuantity: item.quantity,
      receivedQuantity: item.receivedQuantity,
      pendingQuantity: item.quantity - item.receivedQuantity,
      unitPrice: item.unitPrice,
      expectedWeight: item.expectedWeight,
    }));
  }

  /**
   * Soft delete purchase order
   */
  async softDelete(id: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Close purchase order (User Story 11)
   * Close when items fully received and financials reconciled
   */
  async closePurchaseOrder(id: string) {
    const purchaseOrder = await this.findById(id);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Check if all items are received
    const allReceived = purchaseOrder.items.every(
      (item) => item.receivedQuantity >= item.quantity
    );

    if (!allReceived) {
      throw new Error('Cannot close purchase order: Items not fully received');
    }

    // Check if fully paid
    const fullyPaid = Number(purchaseOrder.paidAmount) >= Number(purchaseOrder.totalAmount);

    if (!fullyPaid) {
      throw new Error('Cannot close purchase order: Payment not complete');
    }

    // Update status to CLOSED
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CLOSED },
    });
  }

  /**
   * Get purchase order summary
   */
  async getSummary(startDate?: Date, endDate?: Date) {
    const where: Prisma.PurchaseOrderWhereInput = this.withShopContext({
      deletedAt: null,
    });

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = startDate;
      if (endDate) where.orderDate.lte = endDate;
    }

    const [totalOrders, totalAmount, paidAmount, byStatus] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      prisma.purchaseOrder.aggregate({
        where,
        _sum: { paidAmount: true },
      }),
      prisma.purchaseOrder.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalOrders,
      totalAmount: Number(totalAmount._sum.totalAmount || 0),
      paidAmount: Number(paidAmount._sum.paidAmount || 0),
      pendingAmount: Number(totalAmount._sum.totalAmount || 0) - Number(paidAmount._sum.paidAmount || 0),
      byStatus,
    };
  }
}

/**
 * Factory function to create PurchaseOrderRepository with session
 */
export function createPurchaseOrderRepository(session: SessionPayload | null): PurchaseOrderRepository {
  return new PurchaseOrderRepository({ session });
}
