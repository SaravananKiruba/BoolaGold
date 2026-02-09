/**
 * Metal Purity Conversion Utilities
 * 
 * Handles conversion between different metal purities for wholesale transactions
 * Formula: Pure Metal Content = Weight × (Karat ÷ 24)
 */

export interface MetalConversionResult {
  inputWeight: number;
  inputPurity: string;
  outputWeight: number;
  outputPurity: string;
  pureMetalContent: number;
  conversionRate: number;
  conversionLoss: number; // Weight difference due to purity change
}

/**
 * Extract numeric karat value from purity string
 * Examples: "22K" -> 22, "24K" -> 24, "18K" -> 18
 */
function extractKaratValue(purity: string): number {
  const match = purity.match(/(\d+\.?\d*)/);
  if (!match) {
    throw new Error(`Invalid purity format: ${purity}. Expected format: "22K", "24K", etc.`);
  }
  const karatValue = parseFloat(match[1]);
  if (karatValue <= 0 || karatValue > 24) {
    throw new Error(`Invalid karat value: ${karatValue}. Must be between 0 and 24.`);
  }
  return karatValue;
}

/**
 * Calculate pure metal content from weight and purity
 */
export function calculatePureMetalContent(weight: number, purity: string): number {
  if (weight <= 0) {
    throw new Error('Weight must be positive');
  }
  const karatValue = extractKaratValue(purity);
  return weight * (karatValue / 24);
}

/**
 * Convert metal from one purity to another
 * Maintains pure metal content constant
 * 
 * Example:
 * - Input: 100g of 22K gold
 * - Output: 91.667g of 24K gold
 * - Pure content: 91.667g (constant)
 */
export function convertMetalByPurity(
  inputWeight: number,
  inputPurity: string,
  outputPurity: string
): MetalConversionResult {
  // Validate inputs
  if (inputWeight <= 0) {
    throw new Error('Input weight must be positive');
  }

  const inputKarat = extractKaratValue(inputPurity);
  const outputKarat = extractKaratValue(outputPurity);

  // Calculate pure metal content
  const pureContent = inputWeight * (inputKarat / 24);

  // Calculate output weight to maintain same pure content
  const outputWeight = pureContent / (outputKarat / 24);

  // Calculate conversion metrics
  const conversionRate = outputKarat / inputKarat;
  const conversionLoss = Math.abs(inputWeight - outputWeight);

  return {
    inputWeight: parseFloat(inputWeight.toFixed(3)),
    inputPurity,
    outputWeight: parseFloat(outputWeight.toFixed(3)),
    outputPurity,
    pureMetalContent: parseFloat(pureContent.toFixed(3)),
    conversionRate: parseFloat(conversionRate.toFixed(4)),
    conversionLoss: parseFloat(conversionLoss.toFixed(3)),
  };
}

/**
 * Validate if metal exchange is possible
 * - Cannot exchange different metal types (GOLD ↔ SILVER blocked)
 * - Weight must be positive
 */
export function validateMetalExchange(
  inputMetalType: string,
  outputMetalType: string,
  inputWeight: number,
  inputPurity: string,
  outputPurity: string
): { valid: boolean; error?: string } {
  // Check metal type match
  if (inputMetalType !== outputMetalType) {
    return {
      valid: false,
      error: `Cannot exchange ${inputMetalType} for ${outputMetalType}. Metals must be of same type.`,
    };
  }

  // Validate weight
  if (inputWeight <= 0) {
    return {
      valid: false,
      error: 'Input weight must be positive',
    };
  }

  // Validate purity formats
  try {
    extractKaratValue(inputPurity);
    extractKaratValue(outputPurity);
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid purity format',
    };
  }

  return { valid: true };
}

/**
 * Calculate equivalent weight when exchanging same purity
 * Used when customer brings X grams and wants Y grams of same purity
 */
export function calculateEquivalentWeight(
  inputWeight: number,
  purity: string
): number {
  // For same purity, equivalent weight is same
  return parseFloat(inputWeight.toFixed(3));
}

/**
 * Format metal exchange details for display
 */
export function formatMetalExchange(conversion: MetalConversionResult): string {
  return `${conversion.inputWeight}g ${conversion.inputPurity} → ${conversion.outputWeight}g ${conversion.outputPurity} (Pure: ${conversion.pureMetalContent}g)`;
}

/**
 * Common purity options for jewelry
 */
export const COMMON_PURITIES = {
  GOLD: ['24K', '22K', '18K', '14K', '10K'],
  SILVER: ['999', '925', '900', '800'],
  PLATINUM: ['950', '900', '850'],
};

/**
 * Calculate metal value at current market rate
 * Used for wholesale inventory valuation
 */
export function calculateMetalValue(
  weight: number,
  purity: string,
  ratePerGram: number
): number {
  const pureContent = calculatePureMetalContent(weight, purity);
  return parseFloat((pureContent * ratePerGram).toFixed(2));
}
