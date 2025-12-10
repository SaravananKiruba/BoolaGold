/**
 * API Repository Helper
 * Helper utilities for using repositories in API routes with proper session context
 */

import { SessionPayload, getSession } from '@/lib/auth';
import { RepositoryFactory } from '@/lib/repositoryFactory';
import { NextRequest } from 'next/server';

/**
 * Get session from request and verify it
 * @throws Error if session is invalid
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized: Invalid or missing session');
  }
  return session;
}

/**
 * Repository collection type
 */
type RepositoryCollection = {
  bisCompliance: ReturnType<typeof RepositoryFactory.bisCompliance>;
  customer: ReturnType<typeof RepositoryFactory.customer>;
  emiPayment: ReturnType<typeof RepositoryFactory.emiPayment>;
  product: ReturnType<typeof RepositoryFactory.product>;
  purchaseOrder: ReturnType<typeof RepositoryFactory.purchaseOrder>;
  rateMaster: ReturnType<typeof RepositoryFactory.rateMaster>;
  salesOrder: ReturnType<typeof RepositoryFactory.salesOrder>;
  stockItem: ReturnType<typeof RepositoryFactory.stockItem>;
  supplier: ReturnType<typeof RepositoryFactory.supplier>;
  transaction: ReturnType<typeof RepositoryFactory.transaction>;
};

/**
 * Create repositories with session from request
 * Use this in API routes to get properly initialized repositories
 * 
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   try {
 *     const repos = await getRepositories(request);
 *     const products = await repos.product.findAll();
 *     return apiResponse(products);
 *   } catch (error) {
 *     return apiError(error);
 *   }
 * }
 * ```
 */
export async function getRepositories(request: NextRequest): Promise<RepositoryCollection> {
  const session = await getSessionFromRequest(request);
  return {
    bisCompliance: RepositoryFactory.bisCompliance(session),
    customer: RepositoryFactory.customer(session),
    emiPayment: RepositoryFactory.emiPayment(session),
    product: RepositoryFactory.product(session),
    purchaseOrder: RepositoryFactory.purchaseOrder(session),
    rateMaster: RepositoryFactory.rateMaster(session),
    salesOrder: RepositoryFactory.salesOrder(session),
    stockItem: RepositoryFactory.stockItem(session),
    supplier: RepositoryFactory.supplier(session),
    transaction: RepositoryFactory.transaction(session),
  };
}

/**
 * Get a specific repository with session from request
 * 
 * @example
 * ```ts
 * const productRepo = await getRepository(request, 'product');
 * ```
 */
export async function getRepository(
  request: NextRequest,
  repositoryName: keyof RepositoryCollection
) {
  const repos = await getRepositories(request);
  return repos[repositoryName];
}

/**
 * Create a single repository with session
 * Use this when you already have the session
 */
export function createRepository(
  session: SessionPayload | null,
  repositoryName: keyof typeof RepositoryFactory
) {
  return RepositoryFactory[repositoryName](session);
}
