/**
 * SHOP MANAGEMENT API - SaaS Multi-Tenant Core
 * 
 * ✅ FULLY IMPLEMENTED FEATURES:
 * 
 * 1️⃣ CREATE SHOPS (Super Admin Only)
 *    - Complete shop profile (name, address, GST, bank details)
 *    - Automatic activation (isActive: true)
 *    - Custom branding (logo, colors, invoice prefix)
 * 
 * 2️⃣ ACTIVATE/DEACTIVATE SHOPS (Super Admin Only)
 *    - Toggle shop status via PATCH /api/shops/[id]
 *    - Deactivation immediately blocks all shop users
 *    - Validation happens at login and on every API call
 * 
 * 3️⃣ SHOP ISOLATION & SECURITY
 *    - Each shop's data completely isolated
 *    - Users can only access their own shop's data
 *    - Super Admin can view/manage all shops
 * 
 * 🔒 CRITICAL SECURITY:
 * - Only SUPER_ADMIN can create/delete shops
 * - Only SUPER_ADMIN can activate/deactivate shops
 * - OWNER can view/edit only their own shop details
 * - Deactivated shops block ALL user access immediately
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission, isSuperAdmin } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/shops - Get shops
 * SUPER_ADMIN: View all shops
 * OWNER: View only their own shop
 * ⚠️ CRITICAL: Shop data isolation enforced
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    console.log('🔍 GET /api/shops - Session:', JSON.stringify(session, null, 2));
    
    // 🔒 SECURITY: Must be authenticated
    if (!session) {
      return createErrorResponse('Unauthorized: Authentication required', 401);
    }

    // Build query filter based on role
    const isSuperAdminUser = isSuperAdmin(session);
    const whereClause: any = { deletedAt: null };
    
    // 🔒 CRITICAL: Non-SUPER_ADMIN users can only see their own shop
    if (!isSuperAdminUser) {
      if (!session.shopId) {
        console.error('❌ GET /api/shops - No shopId in session for non-SUPER_ADMIN');
        return createErrorResponse('Unauthorized: No shop context', 403);
      }
      whereClause.id = session.shopId;
      console.log('🔒 GET /api/shops - Filtering by shopId:', session.shopId);
    } else {
      console.log('✅ GET /api/shops - SUPER_ADMIN - returning all shops');
    }

    const shops = await prisma.shop.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        tagline: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        phone: true,
        email: true,
        website: true,
        gstNumber: true,
        panNumber: true,
        logo: true,
        primaryColor: true,
        invoicePrefix: true,
        isActive: true,
        bankName: true,
        accountNumber: true,
        ifscCode: true,
        bankBranch: true,
        termsAndConditions: true,
        subscriptionType: true,
        trialStartDate: true,
        trialEndDate: true,
        lifetimeAmount: true,
        lifetimePaidAt: true,
        amcRenewalDate: true,
        amcLastRenewalDate: true,
        amcAmount: true,
        currentUserCount: true,
        maxUsers: true,
        deactivatedAt: true,
        deactivationReason: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            customers: true,
            products: true,
            salesOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return createSuccessResponse(shops);
  } catch (error) {
    console.error('❌ Error fetching shops:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return createErrorResponse(
      `Failed to fetch shops: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

/**
 * POST /api/shops - Create a new shop (SUPER_ADMIN only)
 * ⚠️ CRITICAL: Only SaaS Provider can create new shops
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    console.log('🔍 POST /api/shops - Session:', JSON.stringify(session, null, 2));
    
    // 🔒 SECURITY: Only SUPER_ADMIN can create new shops
    if (!hasPermission(session, 'SUPER_ADMIN_SHOPS_MANAGE')) {
      console.error('❌ POST /api/shops - Unauthorized:', {
        sessionRole: session?.role,
        hasPermission: hasPermission(session, 'SUPER_ADMIN_SHOPS_MANAGE'),
        isSuperAdmin: session?.role === 'SUPER_ADMIN'
      });
      return createErrorResponse('Unauthorized: Only Super Admin can create shops', 403);
    }
    
    console.log('✅ POST /api/shops - Permission granted');

    const body = await request.json();

    const {
      name,
      tagline,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      website,
      gstNumber,
      panNumber,
      logo,
      primaryColor,
      invoicePrefix,
      bankName,
      accountNumber,
      ifscCode,
      bankBranch,
      termsAndConditions,
    } = body;

    // Validate required fields
    if (!name || !address || !city || !state || !pincode || !phone || !email || !gstNumber || !panNumber || !invoicePrefix) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Calculate trial period dates (7 days from creation)
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 7);

    const shop = await prisma.shop.create({
      data: {
        name,
        tagline,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        website,
        gstNumber,
        panNumber,
        logo,
        primaryColor: primaryColor || '#667eea',
        invoicePrefix,
        bankName,
        accountNumber,
        ifscCode,
        bankBranch,
        termsAndConditions: termsAndConditions ? JSON.stringify(termsAndConditions) : null,
        isActive: true,
        // 🎯 SUBSCRIPTION: Start with 7-day trial
        subscriptionType: 'TRIAL',
        trialStartDate: now,
        trialEndDate: trialEnd,
        amcAmount: 10000.00,
        maxUsers: 10,
        currentUserCount: 0,
      },
    });

    console.log('✅ Shop created with trial subscription:', {
      shopId: shop.id,
      trialEndDate: trialEnd,
    });

    return createSuccessResponse(shop, 201);
  } catch (error) {
    console.error('❌ Error creating shop:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return createErrorResponse(
      `Failed to create shop: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}
