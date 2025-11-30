// Price Calculation Utilities

import { MetalType, PriceCalculation } from '@/domain/entities/types';

export interface PriceCalculationInput {
  netWeight: number;
  wastagePercent: number;
  metalRatePerGram: number;
  makingCharges: number;
  stoneValue?: number;
}

/**
 * Calculate product price based on weight, rate, and charges
 */
export function calculateProductPrice(input: PriceCalculationInput): PriceCalculation {
  const { netWeight, wastagePercent, metalRatePerGram, makingCharges, stoneValue = 0 } = input;

  // Calculate effective weight
  const effectiveWeight = netWeight * (1 + wastagePercent / 100);

  // Calculate metal amount
  const metalAmount = effectiveWeight * metalRatePerGram;

  // Calculate total price
  const totalPrice = metalAmount + makingCharges + stoneValue;

  return {
    netWeight,
    wastagePercent,
    effectiveWeight: Number(effectiveWeight.toFixed(3)),
    metalRatePerGram,
    metalAmount: Number(metalAmount.toFixed(2)),
    makingCharges,
    stoneValue,
    totalPrice: Number(totalPrice.toFixed(2)),
  };
}

/**
 * Calculate selling price for stock item based on product details
 */
export function calculateSellingPrice(
  netWeight: number,
  wastagePercent: number,
  metalRatePerGram: number,
  makingCharges: number,
  stoneValue: number = 0
): number {
  const calculation = calculateProductPrice({
    netWeight,
    wastagePercent,
    metalRatePerGram,
    makingCharges,
    stoneValue,
  });

  return calculation.totalPrice;
}

/**
 * Calculate purchase cost for stock item
 */
export function calculatePurchaseCost(
  netWeight: number,
  metalRatePerGram: number,
  makingCharges: number = 0,
  stoneCost: number = 0
): number {
  const metalCost = netWeight * metalRatePerGram;
  const totalCost = metalCost + makingCharges + stoneCost;

  return Number(totalCost.toFixed(2));
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  orderTotal: number,
  discountPercent?: number,
  discountAmount?: number
): number {
  if (discountAmount !== undefined) {
    return Number(discountAmount.toFixed(2));
  }

  if (discountPercent !== undefined) {
    return Number(((orderTotal * discountPercent) / 100).toFixed(2));
  }

  return 0;
}

/**
 * Calculate EMI installment amount
 */
export function calculateEmiInstallment(
  principal: number,
  interestRate: number,
  numberOfInstallments: number
): number {
  if (interestRate === 0) {
    return Number((principal / numberOfInstallments).toFixed(2));
  }

  const monthlyRate = interestRate / 100 / 12;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfInstallments)) /
    (Math.pow(1 + monthlyRate, numberOfInstallments) - 1);

  return Number(emi.toFixed(2));
}
