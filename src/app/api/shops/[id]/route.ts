import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/shops/[id] - Get shop by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    // Users can only view their own shop details
    if (!session || (session.shopId !== id && !hasPermission(session, 'SHOP_CONFIG'))) {
      return createErrorResponse('Unauthorized', 403);
    }

    const shop = await prisma.shop.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            products: true,
            salesOrders: true,
            purchaseOrders: true,
          },
        },
      },
    });

    if (!shop) {
      return createErrorResponse('Shop not found', 404);
    }

    // Parse termsAndConditions if it's a JSON string
    const shopData = {
      ...shop,
      termsAndConditions: shop.termsAndConditions 
        ? JSON.parse(shop.termsAndConditions) 
        : [],
    };

    return createSuccessResponse(shopData);
  } catch (error) {
    console.error('Error fetching shop:', error);
    return createErrorResponse('Failed to fetch shop');
  }
}

/**
 * PATCH /api/shops/[id] - Update shop (OWNER only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      isActive,
    } = body;

    const shop = await prisma.shop.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(tagline !== undefined && { tagline }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(website !== undefined && { website }),
        ...(gstNumber && { gstNumber }),
        ...(panNumber && { panNumber }),
        ...(logo !== undefined && { logo }),
        ...(primaryColor && { primaryColor }),
        ...(invoicePrefix && { invoicePrefix }),
        ...(bankName !== undefined && { bankName }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(ifscCode !== undefined && { ifscCode }),
        ...(bankBranch !== undefined && { bankBranch }),
        ...(termsAndConditions && { termsAndConditions: JSON.stringify(termsAndConditions) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return createSuccessResponse(shop);
  } catch (error) {
    console.error('Error updating shop:', error);
    return createErrorResponse('Failed to update shop');
  }
}

/**
 * DELETE /api/shops/[id] - Soft delete shop (OWNER only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!hasPermission(session, 'SHOP_CONFIG')) {
      return createErrorResponse('Unauthorized', 403);
    }

    await prisma.shop.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return createSuccessResponse({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    return createErrorResponse('Failed to delete shop');
  }
}
