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
  userId?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.CREATE,
    module,
    entityId,
    afterData: data,
    severity: AuditSeverity.INFO,
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
  });
}

/**
 * Log entity deletion (soft delete)
 */
export async function logDelete(
  module: AuditModule,
  entityId: string,
  data: any,
  userId?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: AuditAction.DELETE,
    module,
    entityId,
    beforeData: data,
    severity: AuditSeverity.WARNING,
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
  });
}

/**
 * Log error
 */
export async function logError(
  module: AuditModule,
  error: Error,
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
  });
}
