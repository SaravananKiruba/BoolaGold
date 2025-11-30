// Audit Logs Export API - Export audit logs to CSV/JSON
// GET /api/audit-logs/export - Export filtered audit logs
// User Story 28: System Logging and Audit Trail - Export Logs

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { errorResponse } from '@/utils/response';
import { AuditAction, AuditModule, AuditSeverity } from '@/domain/entities/types';

/**
 * GET /api/audit-logs/export
 * Export audit logs as CSV or JSON
 * 
 * Query parameters:
 * - format: Export format (csv or json, default: csv)
 * - startDate, endDate, userId, action, module, severity, entityId: Same filters as search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const format = searchParams.get('format') || 'csv';

    // Build filter (same as search)
    const where: any = {};

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const userId = searchParams.get('userId');
    if (userId) where.userId = userId;

    const action = searchParams.get('action') as AuditAction | null;
    if (action && Object.values(AuditAction).includes(action)) {
      where.action = action;
    }

    const module = searchParams.get('module') as AuditModule | null;
    if (module && Object.values(AuditModule).includes(module)) {
      where.module = module;
    }

    const severity = searchParams.get('severity') as AuditSeverity | null;
    if (severity && Object.values(AuditSeverity).includes(severity)) {
      where.severity = severity;
    }

    const entityId = searchParams.get('entityId');
    if (entityId) where.entityId = entityId;

    // Get all matching logs (limit to 10000 for safety)
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10000,
    });

    if (format === 'json') {
      // Export as JSON
      return new NextResponse(JSON.stringify(logs, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.json"`,
        },
      });
    } else {
      // Export as CSV
      const csvHeaders = [
        'Timestamp',
        'User ID',
        'Action',
        'Module',
        'Entity ID',
        'Severity',
        'IP Address',
        'Error Message',
      ];

      const csvRows = logs.map((log) => [
        new Date(log.timestamp).toISOString(),
        log.userId || '',
        log.action,
        log.module,
        log.entityId || '',
        log.severity,
        log.ipAddress || '',
        (log.errorMessage || '').replace(/"/g, '""'), // Escape quotes
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.csv"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
