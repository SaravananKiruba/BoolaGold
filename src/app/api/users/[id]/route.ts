import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission, hashPassword, isSuperAdmin } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/users/[id] - Get user by ID
 * SUPER_ADMIN: Can view any user
 * OWNER: Can view users in their shop only
 * Users: Can view their own profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!session) {
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

    // 🔒 SECURITY: Check if user can access this user
    const canViewUser = session.userId === id || 
                       isSuperAdmin(session) || 
                       (hasPermission(session, 'USER_MANAGE') && user.shopId === session.shopId);
    
    if (!canViewUser) {
      return createErrorResponse('Unauthorized: Cannot view this user', 403);
    }

    return createSuccessResponse(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return createErrorResponse('Failed to fetch user');
  }
}

/**
 * PATCH /api/users/[id] - Update user
 * SUPER_ADMIN: Can update any user
 * OWNER: Can update users in their shop only
 * Users: Can update their own profile (limited fields)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!session) {
      return createErrorResponse('Unauthorized', 403);
    }

    // Fetch user to check shop ownership
    const existingUser = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingUser) {
      return createErrorResponse('User not found', 404);
    }

    // 🔒 SECURITY: Check if user can update this user
    const isOwnProfile = session.userId === id;
    const canManageUser = isSuperAdmin(session) || 
                         (hasPermission(session, 'USER_MANAGE') && existingUser.shopId === session.shopId);
    
    if (!isOwnProfile && !canManageUser) {
      return createErrorResponse('Unauthorized: Cannot update this user', 403);
    }

    const body = await request.json();
    const { name, email, phone, password, role, isActive } = body;

    const updateData: any = {
      ...(name && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
    };

    // Only managers can change role and isActive status
    if (canManageUser && !isOwnProfile) {
      if (role) {
        // SUPER_ADMIN can set any role, OWNER can only set SALES/ACCOUNTS
        if (isSuperAdmin(session)) {
          if (['SUPER_ADMIN', 'OWNER', 'SALES', 'ACCOUNTS'].includes(role)) {
            updateData.role = role;
          }
        } else if (['SALES', 'ACCOUNTS'].includes(role)) {
          updateData.role = role;
        }
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
 * DELETE /api/users/[id] - Soft delete user
 * SUPER_ADMIN: Can delete any user
 * OWNER: Can delete users in their shop only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    const canManageUsers = hasPermission(session, 'USER_MANAGE') || hasPermission(session, 'SUPER_ADMIN_USERS_MANAGE');
    if (!canManageUsers) {
      return createErrorResponse('Unauthorized', 403);
    }

    // Prevent deleting own account
    if (session?.userId === id) {
      return createErrorResponse('Cannot delete your own account', 400);
    }

    // Fetch user to check shop ownership
    const userToDelete = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!userToDelete) {
      return createErrorResponse('User not found', 404);
    }

    // 🔒 SECURITY: OWNER can only delete users in their shop
    if (!isSuperAdmin(session) && userToDelete.shopId !== session?.shopId) {
      return createErrorResponse('Unauthorized: Cannot delete users from other shops', 403);
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
