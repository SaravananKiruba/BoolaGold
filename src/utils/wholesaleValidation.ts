/**
 * Wholesale Business Validation Utilities
 * 
 * Enforces business rules for wholesale vs retail shops
 */

import { PaymentMethod } from '@/domain/entities/types';

export type ShopBusinessType = 'RETAIL' | 'WHOLESALE';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate payment method matches shop business type
 * 
 * RETAIL: Can use CASH, UPI, CARD, BANK_TRANSFER, CREDIT, EMI
 * WHOLESALE: Can ONLY use METAL_EXCHANGE
 */
export function validatePaymentMethodForShopType(
  shopBusinessType: ShopBusinessType,
  paymentMethod: PaymentMethod
): ValidationResult {
  if (shopBusinessType === 'RETAIL') {
    if (paymentMethod === PaymentMethod.METAL_EXCHANGE) {
      return {
        valid: false,
        error: 'Retail shops cannot perform metal exchanges. Please use cash or digital payments.',
      };
    }
  }

  if (shopBusinessType === 'WHOLESALE') {
    if (paymentMethod !== PaymentMethod.METAL_EXCHANGE) {
      return {
        valid: false,
        error: 'Wholesale shops can only perform metal-for-metal exchanges. Cash transactions are not allowed.',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate transaction amount for shop type
 * 
 * RETAIL: Amount > 0 (cash involved)
 * WHOLESALE: Amount = 0 (no cash, only metal)
 */
export function validateTransactionAmount(
  shopBusinessType: ShopBusinessType,
  amount: number,
  paymentMethod: PaymentMethod
): ValidationResult {
  if (shopBusinessType === 'WHOLESALE') {
    if (amount !== 0) {
      return {
        valid: false,
        error: 'Wholesale transactions cannot involve cash. Amount must be 0.',
      };
    }

    if (paymentMethod !== PaymentMethod.METAL_EXCHANGE) {
      return {
        valid: false,
        error: 'Wholesale transactions must use METAL_EXCHANGE payment method.',
      };
    }
  }

  if (shopBusinessType === 'RETAIL') {
    if (paymentMethod === PaymentMethod.METAL_EXCHANGE) {
      return {
        valid: false,
        error: 'Retail shops cannot use METAL_EXCHANGE payment method.',
      };
    }

    if (amount <= 0) {
      return {
        valid: false,
        error: 'Retail transactions must have a positive amount.',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate stock acquisition type matches shop business type
 * 
 * RETAIL: Must use CASH_PURCHASE
 * WHOLESALE: Must use METAL_EXCHANGE_IN
 */
export function validateStockAcquisitionType(
  shopBusinessType: ShopBusinessType,
  acquisitionType: 'CASH_PURCHASE' | 'METAL_EXCHANGE_IN'
): ValidationResult {
  if (shopBusinessType === 'RETAIL' && acquisitionType !== 'CASH_PURCHASE') {
    return {
      valid: false,
      error: 'Retail shops can only acquire stock through cash purchases.',
    };
  }

  if (shopBusinessType === 'WHOLESALE' && acquisitionType !== 'METAL_EXCHANGE_IN') {
    return {
      valid: false,
      error: 'Wholesale shops can only acquire stock through metal exchanges.',
    };
  }

  return { valid: true };
}

/**
 * Check if shop type change is allowed
 * 
 * Rule: Shop business type CANNOT be changed after creation
 * Exception: Only if shop has ZERO transactions (fresh shop)
 */
export function canChangeShopBusinessType(
  transactionCount: number
): ValidationResult {
  if (transactionCount > 0) {
    return {
      valid: false,
      error: 'Shop business type cannot be changed after transactions have been recorded. Contact Super Admin for assistance.',
    };
  }

  return { valid: true };
}

/**
 * Validate wholesale order requirements
 * Must have metal exchange details
 */
export function validateWholesaleOrderData(data: {
  inputMetalType?: string;
  inputPurity?: string;
  inputWeight?: number;
  outputMetalType?: string;
  outputPurity?: string;
  outputWeight?: number;
}): ValidationResult {
  const required = [
    'inputMetalType',
    'inputPurity',
    'inputWeight',
    'outputMetalType',
    'outputPurity',
    'outputWeight',
  ];

  for (const field of required) {
    if (!data[field as keyof typeof data]) {
      return {
        valid: false,
        error: `Wholesale order missing required field: ${field}`,
      };
    }
  }

  if (data.inputWeight! <= 0 || data.outputWeight! <= 0) {
    return {
      valid: false,
      error: 'Metal weights must be positive values',
    };
  }

  return { valid: true };
}

/**
 * Get allowed payment methods for shop type
 */
export function getAllowedPaymentMethods(
  shopBusinessType: ShopBusinessType
): PaymentMethod[] {
  if (shopBusinessType === 'RETAIL') {
    return [
      PaymentMethod.CASH,
      PaymentMethod.UPI,
      PaymentMethod.CARD,
      PaymentMethod.BANK_TRANSFER,
      PaymentMethod.CREDIT,
      PaymentMethod.EMI,
    ];
  }

  // WHOLESALE
  return [PaymentMethod.METAL_EXCHANGE];
}

/**
 * Check if transaction should be excluded from P&L
 * Wholesale metal exchanges don't affect profit/loss
 */
export function shouldExcludeFromProfitLoss(
  shopBusinessType: ShopBusinessType,
  paymentMethod: PaymentMethod
): boolean {
  return (
    shopBusinessType === 'WHOLESALE' &&
    paymentMethod === PaymentMethod.METAL_EXCHANGE
  );
}
