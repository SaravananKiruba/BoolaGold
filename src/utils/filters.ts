// Filtering Utilities for Building Prisma Queries

import { Prisma } from '@prisma/client';

export interface DateRangeFilter {
  startDate?: Date | string;
  endDate?: Date | string;
}

export function buildDateRangeFilter(filter?: DateRangeFilter): Prisma.DateTimeFilter | undefined {
  if (!filter) return undefined;

  const conditions: Prisma.DateTimeFilter = {};

  if (filter.startDate) {
    conditions.gte = new Date(filter.startDate);
  }

  if (filter.endDate) {
    const endDate = new Date(filter.endDate);
    endDate.setHours(23, 59, 59, 999);
    conditions.lte = endDate;
  }

  return Object.keys(conditions).length > 0 ? conditions : undefined;
}

export function buildSearchFilter(
  searchTerm: string | undefined,
  fields: string[]
): Prisma.StringFilter[] | undefined {
  if (!searchTerm || fields.length === 0) return undefined;

  // MySQL doesn't support QueryMode, case-insensitive search is default
  return fields.map(() => ({
    contains: searchTerm,
  }));
}

export function buildSoftDeleteFilter(includeDeleted = false) {
  return includeDeleted ? {} : { deletedAt: null };
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function buildOrderBy(params: SortParams, defaultSort = { createdAt: 'desc' as const }) {
  if (!params.sortBy) return defaultSort;

  return {
    [params.sortBy]: params.sortOrder || 'asc',
  };
}
