/**
 * Repository Factory
 * Centralized factory for creating repository instances with session context
 */

import { SessionPayload } from '@/lib/auth';
import { createBisComplianceRepository } from '@/repositories/bisComplianceRepository';
import { createCustomerRepository } from '@/repositories/customerRepository';
import { createEmiPaymentRepository } from '@/repositories/emiPaymentRepository';
import { createProductRepository } from '@/repositories/productRepository';
import { createPurchaseOrderRepository } from '@/repositories/purchaseOrderRepository';
import { createRateMasterRepository } from '@/repositories/rateMasterRepository';
import { createSalesOrderRepository } from '@/repositories/salesOrderRepository';
import { createStockItemRepository } from '@/repositories/stockItemRepository';
import { createSupplierRepository } from '@/repositories/supplierRepository';
import { createTransactionRepository } from '@/repositories/transactionRepository';

/**
 * Create all repositories with the given session context
 */
export function createRepositories(session: SessionPayload | null) {
  return {
    bisCompliance: createBisComplianceRepository(session),
    customer: createCustomerRepository(session),
    emiPayment: createEmiPaymentRepository(session),
    product: createProductRepository(session),
    purchaseOrder: createPurchaseOrderRepository(session),
    rateMaster: createRateMasterRepository(session),
    salesOrder: createSalesOrderRepository(session),
    stockItem: createStockItemRepository(session),
    supplier: createSupplierRepository(session),
    transaction: createTransactionRepository(session),
  };
}

/**
 * Repository factory type
 */
export type Repositories = ReturnType<typeof createRepositories>;

/**
 * Individual repository factory functions for specific use cases
 */
export const RepositoryFactory = {
  bisCompliance: createBisComplianceRepository,
  customer: createCustomerRepository,
  emiPayment: createEmiPaymentRepository,
  product: createProductRepository,
  purchaseOrder: createPurchaseOrderRepository,
  rateMaster: createRateMasterRepository,
  salesOrder: createSalesOrderRepository,
  stockItem: createStockItemRepository,
  supplier: createSupplierRepository,
  transaction: createTransactionRepository,
};
