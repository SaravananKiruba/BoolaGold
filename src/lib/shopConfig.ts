/**
 * Shop Configuration Utility
 * Dynamically fetches shop configuration from database based on user session
 */

import prisma from '@/lib/prisma';
import { SessionPayload } from '@/lib/auth';

export interface ShopConfig {
  // Basic Information
  name: string;
  tagline: string;

  // Contact Details
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;

  // Business Details
  gstNumber: string;
  panNumber: string;

  // Branding
  logo?: string;
  primaryColor?: string;

  // Print Settings
  showLogoOnPrint: boolean;
  invoicePrefix: string;

  // Additional Terms
  termsAndConditions?: string[];
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
}

/**
 * Get shop configuration from database
 */
export async function getShopConfig(session: SessionPayload | null): Promise<ShopConfig | null> {
  if (!session?.shopId) {
    return null;
  }

  const shop = await prisma.shop.findFirst({
    where: {
      id: session.shopId,
      isActive: true,
      deletedAt: null,
    },
  });

  if (!shop) {
    return null;
  }

  return {
    name: shop.name,
    tagline: shop.tagline || '',
    address: shop.address,
    city: shop.city,
    state: shop.state,
    pincode: shop.pincode,
    phone: shop.phone,
    email: shop.email,
    website: shop.website || undefined,
    gstNumber: shop.gstNumber,
    panNumber: shop.panNumber,
    logo: shop.logo || undefined,
    primaryColor: shop.primaryColor || '#667eea',
    showLogoOnPrint: true,
    invoicePrefix: shop.invoicePrefix,
    termsAndConditions: shop.termsAndConditions
      ? JSON.parse(shop.termsAndConditions)
      : [],
    bankDetails: shop.bankName
      ? {
          bankName: shop.bankName,
          accountNumber: shop.accountNumber || '',
          ifscCode: shop.ifscCode || '',
          branch: shop.bankBranch || '',
        }
      : undefined,
  };
}

/**
 * Get shop configuration by shop ID (for system use)
 */
export async function getShopConfigById(shopId: string): Promise<ShopConfig | null> {
  const shop = await prisma.shop.findFirst({
    where: {
      id: shopId,
      isActive: true,
      deletedAt: null,
    },
  });

  if (!shop) {
    return null;
  }

  return {
    name: shop.name,
    tagline: shop.tagline || '',
    address: shop.address,
    city: shop.city,
    state: shop.state,
    pincode: shop.pincode,
    phone: shop.phone,
    email: shop.email,
    website: shop.website || undefined,
    gstNumber: shop.gstNumber,
    panNumber: shop.panNumber,
    logo: shop.logo || undefined,
    primaryColor: shop.primaryColor || '#667eea',
    showLogoOnPrint: true,
    invoicePrefix: shop.invoicePrefix,
    termsAndConditions: shop.termsAndConditions
      ? JSON.parse(shop.termsAndConditions)
      : [],
    bankDetails: shop.bankName
      ? {
          bankName: shop.bankName,
          accountNumber: shop.accountNumber || '',
          ifscCode: shop.ifscCode || '',
          branch: shop.bankBranch || '',
        }
      : undefined,
  };
}

/**
 * Fallback shop configuration for backward compatibility
 * This is used when no session is available (e.g., during development)
 */
export const defaultShopConfig: ShopConfig = {
  name: 'BoolaGold Jewellers',
  tagline: 'Trust in Every Piece',
  address: '123, Jewelry Street, Gandhi Nagar',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600020',
  phone: '+91 98765 43210',
  email: 'info@boolagold.com',
  website: 'www.boolagold.com',
  gstNumber: '33AAAAA0000A1Z5',
  panNumber: 'AAAAA0000A',
  primaryColor: '#667eea',
  showLogoOnPrint: true,
  invoicePrefix: 'BG-',
  termsAndConditions: [
    'All sales are subject to Chennai jurisdiction',
    'Goods once sold cannot be returned',
    'All gold items are BIS hallmarked',
    'Please verify weight and purity at the time of purchase',
  ],
  bankDetails: {
    bankName: 'State Bank of India',
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234',
    branch: 'T Nagar Branch',
  },
};
