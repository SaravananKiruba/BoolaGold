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

/**
 * Retail = cash-first: every income/expense hits ₹ cash P&L.
 * Wholesale = metal-first: sales-related metal exchanges are excluded from P&L,
 * but operating expenses (rent, salary, utilities…) are recorded as CASH with
 * `excludeFromProfitLoss = false` so the shop's real cash P&L is still tracked.
 *
 * Rules for POST /api/transactions:
 *  RETAIL   INCOME/EXPENSE/EMI/METAL_PURCHASE       -> amount > 0, no METAL_EXCHANGE payment method
 *  WHOLESALE METAL_EXCHANGE_IN/OUT                  -> amount = 0, requires metal fields, exclude=true
 *  WHOLESALE INCOME/EXPENSE (operating)              -> cash payment method allowed, exclude=false, positive amount
 *  WHOLESALE METAL_EXCHANGE payment method          -> only allowed with the METAL_EXCHANGE_* transaction types
 */
export interface TransactionValidationInput {
  transactionType: string;
  paymentMethod: PaymentMethod;
  amount: number;
  metalWeight?: number | null;
}

export function validateTransactionForShopType(
  shopBusinessType: ShopBusinessType,
  input: TransactionValidationInput,
): ValidationResult {
  const { transactionType, paymentMethod, amount, metalWeight } = input;
  const isMetalExchangeTxn =
    transactionType === 'METAL_EXCHANGE_IN' || transactionType === 'METAL_EXCHANGE_OUT';

  if (paymentMethod === PaymentMethod.METAL_EXCHANGE && !isMetalExchangeTxn) {
    return {
      valid: false,
      error:
        'METAL_EXCHANGE payment method is only valid for METAL_EXCHANGE_IN / METAL_EXCHANGE_OUT transactions.',
    };
  }

  if (shopBusinessType === 'RETAIL') {
    if (isMetalExchangeTxn) {
      return {
        valid: false,
        error: 'Retail shops cannot record metal-exchange transactions.',
      };
    }
    if (paymentMethod === PaymentMethod.METAL_EXCHANGE) {
      return {
        valid: false,
        error: 'Retail shops cannot use METAL_EXCHANGE as a payment method.',
      };
    }
    if (amount <= 0) {
      return {
        valid: false,
        error: 'Retail transactions must have a positive amount.',
      };
    }
    return { valid: true };
  }

  // WHOLESALE
  if (isMetalExchangeTxn) {
    if (paymentMethod !== PaymentMethod.METAL_EXCHANGE) {
      return {
        valid: false,
        error: 'Metal-exchange transactions must use METAL_EXCHANGE payment method.',
      };
    }
    if (amount !== 0) {
      return {
        valid: false,
        error: 'Wholesale metal-exchange transactions cannot carry a cash amount.',
      };
    }
    if (!metalWeight || metalWeight <= 0) {
      return {
        valid: false,
        error: 'Metal-exchange transactions require a positive metalWeight.',
      };
    }
    return { valid: true };
  }

  // Wholesale operational income/expense (rent, salary, utilities…):
  // allowed as cash but tracked separately from metal flow.
  if (amount <= 0) {
    return {
      valid: false,
      error: 'Operating income/expense must have a positive amount.',
    };
  }
  return { valid: true };
}

/**
 * Whether a given transaction should have `excludeFromProfitLoss = true`.
 * Only the metal-exchange legs are excluded; wholesale operating expenses are
 * included in cash P&L just like retail.
 */
export function computeExcludeFromProfitLoss(
  shopBusinessType: ShopBusinessType,
  transactionType: string,
  paymentMethod: PaymentMethod,
): boolean {
  if (
    shopBusinessType === 'WHOLESALE' &&
    (transactionType === 'METAL_EXCHANGE_IN' || transactionType === 'METAL_EXCHANGE_OUT')
  ) {
    return true;
  }
  return shouldExcludeFromProfitLoss(shopBusinessType, paymentMethod);
}
