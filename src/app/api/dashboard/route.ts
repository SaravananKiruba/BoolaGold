// Dashboard API - Get business overview metrics

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError, successResponse } from '@/utils/response';
import { buildDateRangeFilter } from '@/utils/filters';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard
 * Retail shops: cash-first metrics (revenue, AOV, ₹ payment breakdown).
 * Wholesale shops: metal-first metrics (grams in / out / net) plus a
 * reference ₹ value computed from the currently active RateMaster row —
 * flagged with `referenceOnly: true` so consumers know it isn't P&L cash.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.shopId) {
      return Response.json(
        { success: false, error: 'Unauthorized: No shop context' },
        { status: 403 },
      );
    }
    const shopId = session.shopId;

    // Shop business type controls the response shape.
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, deletedAt: null },
      select: { shopBusinessType: true },
    });
    const shopBusinessType = (shop?.shopBusinessType ?? 'RETAIL') as 'RETAIL' | 'WHOLESALE';

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dateRange = buildDateRangeFilter(
      startDate || endDate
        ? { startDate: startDate || undefined, endDate: endDate || undefined }
        : undefined,
    );

    const [totalProducts, totalCustomers] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null, isActive: true, shopId } }),
      prisma.customer.count({ where: { deletedAt: null, shopId } }),
    ]);

    const ordersWhere = {
      deletedAt: null,
      shopId,
      ...(dateRange ? { orderDate: dateRange } : {}),
    };

    const [totalOrders, completedOrders, lastOrder] = await Promise.all([
      prisma.salesOrder.count({ where: ordersWhere }),
      prisma.salesOrder.findMany({
        where: { ...ordersWhere, status: 'COMPLETED' },
        select: { finalAmount: true, orderDate: true },
      }),
      prisma.salesOrder.findFirst({
        where: { deletedAt: null, shopId },
        orderBy: { orderDate: 'desc' },
        select: { orderDate: true, invoiceNumber: true, finalAmount: true },
      }),
    ]);

    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + Number(o.finalAmount || 0),
      0,
    );
    const averageOrderValue =
      completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayOrders, todayCompletedOrders] = await Promise.all([
      prisma.salesOrder.count({
        where: {
          deletedAt: null,
          shopId,
          orderDate: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.salesOrder.findMany({
        where: {
          deletedAt: null,
          shopId,
          status: 'COMPLETED',
          orderDate: { gte: todayStart, lte: todayEnd },
        },
        select: { finalAmount: true },
      }),
    ]);
    const todayRevenue = todayCompletedOrders.reduce(
      (sum, o) => sum + Number(o.finalAmount || 0),
      0,
    );

    const paymentStatusBreakdown = await prisma.salesOrder.groupBy({
      by: ['paymentStatus'],
      where: ordersWhere,
      _count: true,
      _sum: { finalAmount: true },
    });

    const base = {
      shopBusinessType,
      totalProducts,
      totalCustomers,
      totalOrders,
      lastOrderDate: lastOrder?.orderDate || null,
      lastOrderInvoice: lastOrder?.invoiceNumber || null,
      todayOrders,
      dateRange: { startDate: startDate || null, endDate: endDate || null },
      paymentStatusBreakdown: paymentStatusBreakdown.map((item) => ({
        status: item.paymentStatus,
        count: item._count,
        totalAmount: Number(item._sum.finalAmount || 0),
      })),
    };

    if (shopBusinessType === 'RETAIL') {
      return Response.json(
        successResponse({
          ...base,
          currency: 'INR',
          totalRevenue: Number(totalRevenue.toFixed(2)),
          averageOrderValue: Number(averageOrderValue.toFixed(2)),
          lastOrderAmount: lastOrder ? Number(lastOrder.finalAmount) : null,
          todayRevenue: Number(todayRevenue.toFixed(2)),
          insights: `${todayOrders} order${todayOrders !== 1 ? 's' : ''} today`,
        }),
        { status: 200 },
      );
    }

    // ---- WHOLESALE: metal-flow view ----
    const metalTxnWhere = {
      deletedAt: null,
      shopId,
      ...(dateRange ? { transactionDate: dateRange } : {}),
      transactionType: { in: ['METAL_EXCHANGE_IN', 'METAL_EXCHANGE_OUT'] as any },
    };

    const [metalTxns, todayMetalTxns] = await Promise.all([
      prisma.transaction.findMany({
        where: metalTxnWhere,
        select: {
          transactionType: true,
          metalType: true,
          metalPurity: true,
          metalWeight: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          deletedAt: null,
          shopId,
          transactionDate: { gte: todayStart, lte: todayEnd },
          transactionType: { in: ['METAL_EXCHANGE_IN', 'METAL_EXCHANGE_OUT'] as any },
        },
        select: {
          transactionType: true,
          metalType: true,
          metalPurity: true,
          metalWeight: true,
        },
      }),
    ]);

    const gramsIn = metalTxns
      .filter((t) => t.transactionType === 'METAL_EXCHANGE_IN')
      .reduce((s, t) => s + Number(t.metalWeight || 0), 0);
    const gramsOut = metalTxns
      .filter((t) => t.transactionType === 'METAL_EXCHANGE_OUT')
      .reduce((s, t) => s + Number(t.metalWeight || 0), 0);

    const todayGramsIn = todayMetalTxns
      .filter((t) => t.transactionType === 'METAL_EXCHANGE_IN')
      .reduce((s, t) => s + Number(t.metalWeight || 0), 0);
    const todayGramsOut = todayMetalTxns
      .filter((t) => t.transactionType === 'METAL_EXCHANGE_OUT')
      .reduce((s, t) => s + Number(t.metalWeight || 0), 0);

    // Reference ₹ value using currently active RateMaster rows for this shop.
    const activeRates = await prisma.rateMaster.findMany({
      where: { shopId, isActive: true },
      select: { metalType: true, purity: true, ratePerGram: true },
    });
    const rateFor = (metalType?: string | null, purity?: string | null) => {
      if (!metalType || !purity) return 0;
      const r = activeRates.find(
        (x) => x.metalType === metalType && x.purity === purity,
      );
      return r ? Number(r.ratePerGram) : 0;
    };
    const referenceInrValue = metalTxns.reduce((sum, t) => {
      const rate = rateFor(t.metalType, t.metalPurity);
      const sign = t.transactionType === 'METAL_EXCHANGE_IN' ? 1 : -1;
      return sum + sign * Number(t.metalWeight || 0) * rate;
    }, 0);

    // Group by metal+purity for the UI breakdown card.
    const byMetal = new Map<string, { metalType: string; purity: string; gramsIn: number; gramsOut: number }>();
    for (const t of metalTxns) {
      const key = `${t.metalType}:${t.metalPurity}`;
      const entry =
        byMetal.get(key) ?? { metalType: String(t.metalType), purity: String(t.metalPurity), gramsIn: 0, gramsOut: 0 };
      if (t.transactionType === 'METAL_EXCHANGE_IN') entry.gramsIn += Number(t.metalWeight || 0);
      else entry.gramsOut += Number(t.metalWeight || 0);
      byMetal.set(key, entry);
    }

    return Response.json(
      successResponse({
        ...base,
        currency: null,
        // Cash-side metrics kept for reference only (invoice ₹ totals still exist
        // for wholesale sales that pass through the SalesOrder flow).
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        lastOrderAmount: lastOrder ? Number(lastOrder.finalAmount) : null,
        todayRevenue: Number(todayRevenue.toFixed(2)),

        // Primary wholesale metrics — weights in grams (3dp).
        metal: {
          gramsIn: Number(gramsIn.toFixed(3)),
          gramsOut: Number(gramsOut.toFixed(3)),
          netGrams: Number((gramsIn - gramsOut).toFixed(3)),
          todayGramsIn: Number(todayGramsIn.toFixed(3)),
          todayGramsOut: Number(todayGramsOut.toFixed(3)),
          referenceInrValue: Number(referenceInrValue.toFixed(2)),
          referenceOnly: true,
          breakdown: Array.from(byMetal.values()).map((b) => ({
            metalType: b.metalType,
            purity: b.purity,
            gramsIn: Number(b.gramsIn.toFixed(3)),
            gramsOut: Number(b.gramsOut.toFixed(3)),
            netGrams: Number((b.gramsIn - b.gramsOut).toFixed(3)),
          })),
        },
        insights: `${todayOrders} order${todayOrders !== 1 ? 's' : ''} today · ${todayGramsIn.toFixed(3)}g in / ${todayGramsOut.toFixed(3)}g out`,
      }),
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
