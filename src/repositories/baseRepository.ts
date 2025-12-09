/**
 * Base Repository with Multi-Tenant Support
 * Provides common repository functionality with automatic shopId filtering
 */

import { SessionPayload } from '@/lib/auth';
import { Prisma } from '@prisma/client';

/**
 * Base filter that includes shopId
 */
export interface BaseFilter {
  shopId?: string;
  deletedAt?: null | { not: null };
}

/**
 * Build shopId filter from session
 */
export function buildShopFilter(session: SessionPayload | null): { shopId: string } | {} {
  if (!session?.shopId) {
    throw new Error('Unauthorized: No shop context available');
  }
  return { shopId: session.shopId };
}

/**
 * Merge shop filter with other filters
 */
export function withShopFilter<T extends Record<string, any>>(
  session: SessionPayload | null,
  filters: T
): T & { shopId: string } {
  const shopFilter = buildShopFilter(session);
  return { ...filters, ...shopFilter } as T & { shopId: string };
}

/**
 * Build soft delete filter
 */
export function buildSoftDeleteFilter(includeDeleted = false) {
  return includeDeleted ? {} : { deletedAt: null };
}

/**
 * Combine shop filter with soft delete filter
 */
export function buildBaseFilter(
  session: SessionPayload | null,
  includeDeleted = false
): { shopId: string; deletedAt: null | { not: null } } {
  return {
    ...buildShopFilter(session),
    ...buildSoftDeleteFilter(includeDeleted),
  } as { shopId: string; deletedAt: null | { not: null } };
}

/**
 * Base Repository Options
 */
export interface RepositoryOptions {
  session: SessionPayload | null;
}

/**
 * Abstract Base Repository with Multi-Tenant Support
 */
export abstract class BaseRepository {
  protected session: SessionPayload | null;

  constructor(options: RepositoryOptions) {
    this.session = options.session;
  }

  /**
   * Get shop filter for current session
   */
  protected getShopFilter(): { shopId: string } {
    return buildShopFilter(this.session) as { shopId: string };
  }

  /**
   * Get base filter (shop + soft delete)
   */
  protected getBaseFilter(includeDeleted = false) {
    return buildBaseFilter(this.session, includeDeleted);
  }

  /**
   * Merge filters with shop context
   */
  protected withShopContext<T extends Record<string, any>>(filters: T): T & { shopId: string } {
    return withShopFilter(this.session, filters);
  }

  /**
   * Ensure user has access to resource in their shop
   */
  protected ensureShopAccess(resourceShopId: string | undefined | null): void {
    const shopFilter = this.getShopFilter();
    if (resourceShopId !== shopFilter.shopId) {
      throw new Error('Unauthorized: Resource does not belong to your shop');
    }
  }

  /**
   * Get current user info for audit
   */
  protected getCurrentUser() {
    if (!this.session) {
      return { userId: 'system', username: 'system' };
    }
    return {
      userId: this.session.userId,
      username: this.session.username,
    };
  }

  /**
   * Get shop ID from session
   */
  protected getShopId(): string {
    if (!this.session?.shopId) {
      throw new Error('Unauthorized: No shop context available');
    }
    return this.session.shopId;
  }

  /**
   * Verify ownership of a resource (that it belongs to the current shop)
   * @param modelName - Name of the Prisma model (lowercase)
   * @param id - ID of the resource to verify
   * @throws Error if resource doesn't exist or doesn't belong to shop
   */
  protected async verifyOwnership(modelName: string, id: string): Promise<void> {
    const prisma = (await import('@/lib/prisma')).default;
    const model = (prisma as any)[modelName];
    
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    const resource = await model.findUnique({
      where: { id },
      select: { id: true, shopId: true },
    });

    if (!resource) {
      throw new Error(`${modelName} not found`);
    }

    this.ensureShopAccess(resource.shopId);
  }
}
