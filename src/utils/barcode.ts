// Barcode and Tag ID Generation Utilities

import { MetalType } from '@/domain/entities/types';

/**
 * Generate unique barcode for products and stock items
 * Format: [Prefix]-[ProductID]-[Sequence]
 */
export function generateBarcode(prefix: string, productId: string, sequence?: number): string {
  const seq = sequence ? sequence.toString().padStart(4, '0') : Date.now().toString().slice(-4);
  const shortId = productId.slice(0, 8).toUpperCase();
  return `${prefix}-${shortId}-${seq}`;
}

/**
 * Generate unique tag ID for stock items
 * Format: [MetalCode][Purity]-[Timestamp]-[UniqueID]
 */
export function generateTagId(metalType: MetalType, purity: string): string {
  const metalCode = getMetalCode(metalType);
  const purityCode = purity.replace(/[^0-9]/g, ''); // Extract numeric part
  const timestamp = Date.now().toString().slice(-8);
  const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${metalCode}${purityCode}-${timestamp}-${uniqueId}`;
}

/**
 * Get metal code abbreviation
 */
function getMetalCode(metalType: MetalType): string {
  switch (metalType) {
    case MetalType.GOLD:
      return 'G';
    case MetalType.SILVER:
      return 'S';
    case MetalType.PLATINUM:
      return 'P';
    default:
      return 'X';
  }
}

/**
 * Generate invoice number
 * Format: INV-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const sequence = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `INV-${year}${month}${day}-${sequence}`;
}

/**
 * Generate purchase order number
 * Format: PO-YYYYMMDD-XXXX
 */
export function generatePurchaseOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const sequence = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `PO-${year}${month}${day}-${sequence}`;
}

/**
 * Validate barcode format
 */
export function validateBarcode(barcode: string): boolean {
  const pattern = /^[A-Z]+-[A-Z0-9]+-[0-9]+$/;
  return pattern.test(barcode);
}

/**
 * Validate tag ID format
 */
export function validateTagId(tagId: string): boolean {
  const pattern = /^[GSP][0-9]+-[0-9]+-[A-Z0-9]+$/;
  return pattern.test(tagId);
}

/**
 * Generate multiple unique tag IDs for batch stock receipt
 * Format: [MetalCode][Purity]-[Timestamp]-[UniqueID]
 */
export function generateBatchTagIds(
  metalType: MetalType,
  purity: string,
  count: number
): string[] {
  const metalCode = getMetalCode(metalType);
  const purityCode = purity.replace(/[^0-9]/g, '');
  const timestamp = Date.now().toString().slice(-8);
  const tagIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
    tagIds.push(`${metalCode}${purityCode}-${timestamp}-${uniqueId}`);
    // Small delay to ensure unique timestamps if generating many at once
    if (i % 10 === 0 && i > 0) {
      // Add millisecond to timestamp for next batch
    }
  }

  return tagIds;
}

/**
 * Generate multiple unique barcodes for batch stock receipt
 * Format: [Prefix]-[ProductID]-[Sequence]
 */
export function generateBatchBarcodes(
  prefix: string,
  productId: string,
  count: number,
  startSequence?: number
): string[] {
  const shortId = productId.slice(0, 8).toUpperCase();
  const barcodes: string[] = [];
  const baseSequence = startSequence || Date.now();

  for (let i = 0; i < count; i++) {
    const seq = (baseSequence + i).toString().padStart(8, '0').slice(-8);
    barcodes.push(`${prefix}-${shortId}-${seq}`);
  }

  return barcodes;
}

/**
 * Generate stock item barcode with stock prefix
 */
export function generateStockBarcode(productId: string, sequence?: number): string {
  return generateBarcode('STK', productId, sequence);
}

/**
 * Check if tag ID is unique in the database (helper for validation)
 */
export async function isTagIdUnique(tagId: string): Promise<boolean> {
  // This would need to be implemented with Prisma in the actual usage
  // For now, this is a placeholder
  return true;
}

/**
 * Check if barcode is unique in the database (helper for validation)
 */
export async function isBarcodeUnique(barcode: string): Promise<boolean> {
  // This would need to be implemented with Prisma in the actual usage
  // For now, this is a placeholder
  return true;
}
