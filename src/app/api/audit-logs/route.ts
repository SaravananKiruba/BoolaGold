// Audit Logs API - Search, filter and export audit logs
// GET /api/audit-logs - Search and filter audit logs
// User Story 28: System Logging and Audit Trail

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response';
import { AuditAction, AuditModule, AuditSeverity } from '@/domain/entities/types';
import { getSession, hasPermission } from '@/lib/auth';

/**
 * GET /api/audit-logs
 * Search and filter audit logs with pagination
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 50)
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * - userId: Filter by user ID
 * - action: Filter by action (CREATE, UPDATE, DELETE, STATUS_CHANGE)
 * - module: Filter by module (CUSTOMERS, PRODUCTS, STOCK, etc.)
 * - severity: Filter by severity (INFO, WARNING, ERROR)
 * - entityId: Filter by entity ID
 * - search: Search in error messages
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'AUDIT_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const { searchParams } = request.nextUrl;

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    // Build filter
    const where: any = {};

    // Date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // User filter
    const userId = searchParams.get('userId');
    if (userId) {
      where.userId = userId;
    }

    // Action filter
    const action = searchParams.get('action') as AuditAction | null;
    if (action && Object.values(AuditAction).includes(action)) {
      where.action = action;
    }

    // Module filter
    const module = searchParams.get('module') as AuditModule | null;
    if (module && Object.values(AuditModule).includes(module)) {
      where.module = module;
    }

    // Severity filter
    const severity = searchParams.get('severity') as AuditSeverity | null;
    if (severity && Object.values(AuditSeverity).includes(severity)) {
      where.severity = severity;
    }

    // Entity ID filter
    const entityId = searchParams.get('entityId');
    if (entityId) {
      where.entityId = entityId;
    }

    // Search filter
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { errorMessage: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search } },
        { userId: { contains: search } },
      ];
    }

    // Get logs with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json(
      successResponse(logs, {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      })
    );
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
