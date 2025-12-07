import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission, isSuperAdmin } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/shops - Get all shops (SUPER_ADMIN only)
 * ⚠️ CRITICAL: Only SaaS Provider can view all shops
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    console.log('🔍 GET /api/shops - Session:', JSON.stringify(session, null, 2));
    
    // 🔒 SECURITY: Only SUPER_ADMIN can view all shops
    if (!hasPermission(session, 'SUPER_ADMIN_SHOPS_MANAGE')) {
      console.error('❌ GET /api/shops - Unauthorized:', {
        session,
        hasPermission: hasPermission(session, 'SUPER_ADMIN_SHOPS_MANAGE'),
        isSuperAdmin: session?.role === 'SUPER_ADMIN'
      });
      return createErrorResponse('Unauthorized: Only Super Admin can view all shops', 403);
    }
    
    console.log('✅ GET /api/shops - Permission granted');

    const shops = await prisma.shop.findMany({
      where: { deletedAt: null },
      include: {
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
    
    // 🔒 SECURITY: Only SUPER_ADMIN can create shops
    if (!hasPermission(session, 'SUPER_ADMIN_SHOPS_MANAGE')) {
      console.error('❌ POST /api/shops - Unauthorized:', {
        session,
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
      },
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
