// Financial Reports API - P&L statement and financial analysis

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError, successResponse, errorResponse } from '@/utils/response';
import { buildDateRangeFilter } from '@/utils/filters';

import { getSession, hasPermission } from '@/lib/auth';
import { getRepositories } from '@/utils/apiRepository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/financial
 * Get comprehensive financial reports including P&L statement
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'REPORTS_FINANCIAL')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date range filter
    const dateRange = buildDateRangeFilter(
      startDate || endDate ? { 
        startDate: startDate || undefined, 
        endDate: endDate || undefined 
      } : undefined
    );

    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    // Get income, expense and metal purchase summaries using repository
    const repos = await getRepositories(request);
    const repository = repos.transaction;
    const [incomeSummary, expenseSummary, metalPurchaseSummary] = await Promise.all([
      repository.getIncomeSummary(filters),
      repository.getExpenseSummary(filters),
      repository.getMetalPurchaseSummary(filters),
    ]);

    // Calculate totals
    const totalIncome = Number(incomeSummary.totalIncome || 0);
    const totalExpense = Number(expenseSummary.totalExpense || 0);
    const metalPurchaseExpense = Number(metalPurchaseSummary.totalAmount || 0);

    // P&L calculations
    const grossProfit = totalIncome - metalPurchaseExpense;
    const operationalExpenses = totalExpense - metalPurchaseExpense;
    const netProfit = grossProfit - operationalExpenses;

    // 🔒 SECURITY: Validate session and shopId
    if (!session || !session.shopId) {
      return NextResponse.json(errorResponse('No shop context'), { status: 403 });
    }

    const shopId = session.shopId;

    // Income breakdown by category - 🔒 FILTERED BY SHOPID
    const incomeTransactions = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        transactionType: 'INCOME',
        status: 'COMPLETED',
        deletedAt: null,
        shopId,
        ...(dateRange ? { transactionDate: dateRange } : {}),
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const incomeBreakdown = incomeTransactions.map((item) => ({
      category: item.category,
      count: item._count.id,
      totalAmount: Number(item._sum.amount || 0),
    }));

    // Expense breakdown by category - 🔒 FILTERED BY SHOPID
    const expenseTransactions = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        transactionType: 'EXPENSE',
        status: 'COMPLETED',
        deletedAt: null,
        shopId,
        ...(dateRange ? { transactionDate: dateRange } : {}),
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const expenseBreakdown = expenseTransactions.map((item) => ({
      category: item.category,
      count: item._count.id,
      totalAmount: Number(item._sum.amount || 0),
    }));

    // Payment mode distribution - 🔒 FILTERED BY SHOPID
    const paymentModeDistribution = await prisma.transaction.groupBy({
      by: ['paymentMode'],
      where: {
        status: 'COMPLETED',
        deletedAt: null,
        shopId,
        ...(dateRange ? { transactionDate: dateRange } : {}),
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const paymentModeBreakdown = paymentModeDistribution.map((item) => ({
      paymentMode: item.paymentMode || 'UNKNOWN',
      count: item._count.id,
      totalAmount: Number(item._sum.amount || 0),
    }));

    // Cash flow summary (inflow vs outflow) - 🔒 FILTERED BY SHOPID
    const cashFlowData = await prisma.transaction.groupBy({
      by: ['transactionType'],
      where: {
        status: 'COMPLETED',
        deletedAt: null,
        shopId,
        ...(dateRange ? { transactionDate: dateRange } : {}),
      },
      _sum: {
        amount: true,
      },
    });

    const cashFlow = {
      inflow: Number(cashFlowData.find((item) => item.transactionType === 'INCOME')?._sum.amount || 0),
      outflow: Number(cashFlowData.find((item) => item.transactionType === 'EXPENSE')?._sum.amount || 0) +
               Number(cashFlowData.find((item) => item.transactionType === 'METAL_PURCHASE')?._sum.amount || 0),
      netCashFlow: 0,
    };
    cashFlow.netCashFlow = cashFlow.inflow - cashFlow.outflow;

    // Metal purchase expenses by metal type - 🔒 FILTERED BY SHOPID
    const metalPurchaseByType = await prisma.transaction.groupBy({
      by: ['metalType'],
      where: {
        transactionType: 'METAL_PURCHASE',
        status: 'COMPLETED',
        deletedAt: null,
        shopId,
        ...(dateRange ? { transactionDate: dateRange } : {}),
      },
      _sum: {
        amount: true,
        metalWeight: true,
      },
      _count: true,
    });

    const metalPurchaseBreakdown = metalPurchaseByType
      .filter((item) => item.metalType) // Only include items with metalType
      .map((item) => ({
        metalType: item.metalType!,
        count: item._count || 0,
        totalWeight: Number(item._sum?.metalWeight || 0),
        totalAmount: Number(item._sum?.amount || 0),
      }));

    // EMI tracking overview
    const emiWhere: any = {
      deletedAt: null,
    };

    if (dateRange) {
      emiWhere.dueDate = dateRange;
    }

    const [totalEmiOutstanding, emiReceived] = await Promise.all([
      prisma.emiPayment.aggregate({
        where: {
          deletedAt: null,
          shopId,
          status: { in: ['PENDING', 'OVERDUE'] },
        },
        _sum: {
          remainingAmount: true,
        },
      }),
      prisma.emiInstallment.aggregate({
        where: {
          ...(dateRange ? { paymentDate: dateRange } : {}),
          status: 'PAID',
        },
        _sum: {
          paidAmount: true,
        },
      }),
    ]);

    const emiTracking = {
      totalOutstanding: Number(totalEmiOutstanding._sum?.remainingAmount || 0),
      receivedInPeriod: Number(emiReceived._sum?.paidAmount || 0),
    };

    // Monthly trend (if applicable) - 🔒 FILTERED BY SHOPID
    const monthlyData = await prisma.transaction.findMany({
      where: {
        shopId,
        status: 'COMPLETED',
        deletedAt: null,
        ...(dateRange ? { transactionDate: dateRange } : {}),
      },
      select: {
        transactionDate: true,
        transactionType: true,
        amount: true,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    // Group by month
    const monthlyTrend: Record<string, { month: string; income: number; expense: number; netIncome: number }> = {};
    
    monthlyData.forEach((transaction) => {
      const monthKey = new Date(transaction.transactionDate).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyTrend[monthKey]) {
        monthlyTrend[monthKey] = {
          month: monthKey,
          income: 0,
          expense: 0,
          netIncome: 0,
        };
      }

      const amount = Number(transaction.amount || 0);
      if (transaction.transactionType === 'INCOME') {
        monthlyTrend[monthKey].income += amount;
      } else {
        monthlyTrend[monthKey].expense += amount;
      }
    });

    // Calculate net income for each month
    Object.values(monthlyTrend).forEach((month) => {
      month.netIncome = month.income - month.expense;
    });

    const monthlyTrendArray = Object.values(monthlyTrend).sort((a, b) => 
      a.month.localeCompare(b.month)
    );

    return Response.json(successResponse({
      reportType: 'Financial Report - P&L Statement',
      generatedAt: new Date().toISOString(),
      reportingPeriod: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      profitAndLoss: {
        totalIncome: Number(totalIncome.toFixed(2)),
        directCosts: {
          metalPurchases: Number(metalPurchaseExpense.toFixed(2)),
        },
        grossProfit: Number(grossProfit.toFixed(2)),
        operationalExpenses: Number(operationalExpenses.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        profitMargin: totalIncome > 0 ? Number(((netProfit / totalIncome) * 100).toFixed(2)) : 0,
      },
      incomeBreakdown,
      expenseBreakdown,
      paymentModeBreakdown,
      cashFlow: {
        inflow: Number(cashFlow.inflow.toFixed(2)),
        outflow: Number(cashFlow.outflow.toFixed(2)),
        netCashFlow: Number(cashFlow.netCashFlow.toFixed(2)),
      },
      metalPurchaseBreakdown,
      emiTracking: {
        totalOutstanding: Number(emiTracking.totalOutstanding.toFixed(2)),
        receivedInPeriod: Number(emiTracking.receivedInPeriod.toFixed(2)),
      },
      monthlyTrend: monthlyTrendArray.map((month) => ({
        month: month.month,
        income: Number(month.income.toFixed(2)),
        expense: Number(month.expense.toFixed(2)),
        netIncome: Number(month.netIncome.toFixed(2)),
      })),
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
