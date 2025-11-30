// Purchase Order Pending List API

import { NextRequest } from 'next/server';
import { purchaseOrderRepository } from '@/repositories/purchaseOrderRepository';
import { handleApiError, successResponse } from '@/utils/response';

/**
 * GET /api/purchase-orders/pending
 * Get list of pending purchase orders for stock receipt
 */
export async function GET(request: NextRequest) {
  try {
    const pendingOrders = await purchaseOrderRepository.getPendingOrders();

    // Format response with pending quantities
    const formattedOrders = pendingOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      supplier: order.supplier,
      orderDate: order.orderDate,
      expectedDeliveryDate: order.expectedDeliveryDate,
      status: order.status,
      totalAmount: order.totalAmount,
      items: order.items.map((item) => ({
        id: item.id,
        product: item.product,
        orderedQuantity: item.quantity,
        receivedQuantity: item.receivedQuantity,
        pendingQuantity: item.quantity - item.receivedQuantity,
        unitPrice: item.unitPrice,
        expectedWeight: item.expectedWeight,
      })),
    }));

    return successResponse({
      orders: formattedOrders,
      totalOrders: formattedOrders.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
