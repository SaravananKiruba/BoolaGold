// BIS Compliance Reports API
// User Story 29: BIS Hallmark Compliance - Generate compliance reports

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response';
import { BisComplianceStatus } from '@/domain/entities/types';

/**
 * GET /api/bis-compliance/reports
 * Generate BIS compliance reports
 * 
 * Query parameters:
 * - type: Report type (summary, non-compliant, expiring)
 * - daysUntilExpiry: Days threshold for expiring items (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const reportType = searchParams.get('type') || 'summary';
    const daysUntilExpiry = parseInt(searchParams.get('daysUntilExpiry') || '30');

    if (reportType === 'summary') {
      // Overall compliance summary
      const [total, byStatus, withHuid, expiringSoon] = await Promise.all([
        prisma.bisCompliance.count(),
        prisma.bisCompliance.groupBy({
          by: ['complianceStatus'],
          _count: { id: true },
        }),
        prisma.bisCompliance.count(),

        prisma.bisCompliance.count({
          where: {
            expiryDate: {
              lte: new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000),
              gte: new Date(),
            },
          },
        }),
      ]);

      const statusSummary: any = {
        compliant: 0,
        nonCompliant: 0,
        pending: 0,
      };

      byStatus.forEach((item) => {
        if (item.complianceStatus === BisComplianceStatus.COMPLIANT) {
          statusSummary.compliant = item._count.id;
        } else if (item.complianceStatus === BisComplianceStatus.NON_COMPLIANT) {
          statusSummary.nonCompliant = item._count.id;
        } else if (item.complianceStatus === BisComplianceStatus.PENDING) {
          statusSummary.pending = item._count.id;
        }
      });

      return NextResponse.json(
        successResponse({
          reportType: 'summary',
          generatedAt: new Date().toISOString(),
          summary: {
            totalRecords: total,
            totalWithHuid: withHuid,
            expiringSoon,
            byStatus: statusSummary,
            complianceRate: total > 0 ? ((statusSummary.compliant / total) * 100).toFixed(2) : 0,
          },
        })
      );
    } else if (reportType === 'non-compliant') {
      // Non-compliant items report
      const nonCompliantItems = await prisma.bisCompliance.findMany({
        where: {
          OR: [
            { complianceStatus: BisComplianceStatus.NON_COMPLIANT },
            { huidRegistrationDate: null },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(
        successResponse({
          reportType: 'non-compliant',
          generatedAt: new Date().toISOString(),
          totalNonCompliant: nonCompliantItems.length,
          items: nonCompliantItems.map((item) => ({
            id: item.id,
            huid: item.huid,
            complianceStatus: item.complianceStatus,
            productId: item.productId,
            stockItemId: item.stockItemId,
            jewelType: item.jewelType,
            issues: [
              !item.huid && 'Missing HUID',
              !item.huidRegistrationDate && 'Missing registration date',
              item.complianceStatus === BisComplianceStatus.NON_COMPLIANT && 'Non-compliant status',
            ].filter(Boolean),
            createdAt: item.createdAt,
          })),
        })
      );
    } else if (reportType === 'expiring') {
      // Expiring certifications report
      const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);
      
      const expiringItems = await prisma.bisCompliance.findMany({
        where: {
          expiryDate: {
            lte: expiryDate,
            gte: new Date(),
          },
        },
        orderBy: { expiryDate: 'asc' },
      });

      return NextResponse.json(
        successResponse({
          reportType: 'expiring',
          generatedAt: new Date().toISOString(),
          daysThreshold: daysUntilExpiry,
          totalExpiring: expiringItems.length,
          items: expiringItems.map((item) => ({
            id: item.id,
            huid: item.huid,
            hallmarkNumber: item.hallmarkNumber,
            complianceStatus: item.complianceStatus,
            expiryDate: item.expiryDate,
            daysUntilExpiry: item.expiryDate
              ? Math.ceil((item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null,
            productId: item.productId,
            stockItemId: item.stockItemId,
            jewelType: item.jewelType,
          })),
        })
      );
    } else {
      return NextResponse.json(
        errorResponse('Invalid report type. Use: summary, non-compliant, or expiring'),
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error generating BIS compliance report:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
