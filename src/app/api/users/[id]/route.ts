import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission, hashPassword } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/users/[id] - Get user by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    // Users can view their own profile or OWNER can view all
    if (!session || (session.userId !== id && !hasPermission(session, 'USER_MANAGE'))) {
      return createErrorResponse('Unauthorized', 403);
    }

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        shopId: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    return createSuccessResponse(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return createErrorResponse('Failed to fetch user');
  }
}

/**
 * PATCH /api/users/[id] - Update user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    // Users can update their own profile or OWNER can update all
    if (!session || (session.userId !== id && !hasPermission(session, 'USER_MANAGE'))) {
      return createErrorResponse('Unauthorized', 403);
    }

    const body = await request.json();
    const { name, email, phone, password, role, isActive } = body;

    const updateData: any = {
      ...(name && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
    };

    // Only OWNER can change role and isActive status
    if (hasPermission(session, 'USER_MANAGE')) {
      if (role && ['OWNER', 'SALES', 'ACCOUNTS'].includes(role)) {
        updateData.role = role;
      }
      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }
    }

    // Hash password if provided
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        shopId: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return createSuccessResponse(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return createErrorResponse('Failed to update user');
  }
}

/**
 * DELETE /api/users/[id] - Soft delete user (OWNER only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!hasPermission(session, 'USER_MANAGE')) {
      return createErrorResponse('Unauthorized', 403);
    }

    // Prevent deleting own account
    if (session?.userId === id) {
      return createErrorResponse('Cannot delete your own account', 400);
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return createSuccessResponse({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return createErrorResponse('Failed to delete user');
  }
}
