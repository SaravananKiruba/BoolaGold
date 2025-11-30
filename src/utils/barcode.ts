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
