import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/shops - Get all shops (OWNER only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!hasPermission(session, 'SHOP_CONFIG')) {
      return createErrorResponse('Unauthorized', 403);
    }

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
    console.error('Error fetching shops:', error);
    return createErrorResponse('Failed to fetch shops');
  }
}

/**
 * POST /api/shops - Create a new shop (OWNER only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!hasPermission(session, 'SHOP_CONFIG')) {
      return createErrorResponse('Unauthorized', 403);
    }

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
    console.error('Error creating shop:', error);
    return createErrorResponse('Failed to create shop');
  }
}
