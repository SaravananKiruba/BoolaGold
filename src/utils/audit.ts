// Audit Logging Utility

import { PrismaClient } from '@prisma/client';
import { AuditAction, AuditModule, AuditSeverity } from '@/domain/entities/types';

const prisma = new PrismaClient();

export interface AuditLogInput {
  userId?: string;
  action: AuditAction;
  module: AuditModule;
  entityId?: string;
  beforeData?: any;
  afterData?: any;
  severity?: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  stackTrace?: string;
  shopId: string;  // Required for audit logs
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        module: input.module,
        entityId: input.entityId,
        beforeData: input.beforeData,
        afterData: input.afterData,
        severity: input.severity || AuditSeverity.INFO,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        errorMessage: input.errorMessage,
        stackTrace: input.stackTrace,
        timestamp: new Date(),
        shopId: input.shopId,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Log entity creation
 */
export async function logCreate(
  module: AuditModule,
  entityId: string,
  data: any,
  shopId: string,
  userId?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.CREATE,
    module,
    entityId,
    afterData: data,
    severity: AuditSeverity.INFO,
    shopId,
  });
}

/**
 * Log entity update
 */
export async function logUpdate(
  module: AuditModule,
  entityId: string,
  beforeData: any,
  afterData: any,
  shopId: string,
  userId?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.UPDATE,
    module,
    entityId,
    beforeData,
    afterData,
    severity: AuditSeverity.INFO,
    shopId,
  });
}

/**
 * Log entity deletion (soft delete)
 */
export async function logDelete(
  module: AuditModule,
  entityId: string,
  data: any,
  shopId: string,
  userId?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.DELETE,
    module,
    entityId,
    beforeData: data,
    severity: AuditSeverity.WARNING,
    shopId,
  });
}

/**
 * Log status change
 */
export async function logStatusChange(
  module: AuditModule,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  shopId: string,
  userId?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.STATUS_CHANGE,
    module,
    entityId,
    beforeData: { status: oldStatus },
    afterData: { status: newStatus },
    severity: AuditSeverity.INFO,
    shopId,
  });
}

/**
 * Log error
 */
export async function logError(
  module: AuditModule,
  error: Error,
  shopId: string,
  entityId?: string,
  userId?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.UPDATE,
    module,
    entityId,
    errorMessage: error.message,
    stackTrace: error.stack,
    severity: AuditSeverity.ERROR,
    shopId,
  });
}

/**
 * Generic audit log function
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  return createAuditLog(input);
}
