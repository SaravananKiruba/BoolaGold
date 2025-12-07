import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission, hashPassword, isSuperAdmin } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/users - Get users
 * SUPER_ADMIN: Can view all users across all shops
 * OWNER: Can view only users in their own shop
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    // Check permissions based on role
    const canManageUsers = hasPermission(session, 'USER_MANAGE') || hasPermission(session, 'SUPER_ADMIN_USERS_MANAGE');
    if (!canManageUsers) {
      return createErrorResponse('Unauthorized', 403);
    }

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    // 🔒 SECURITY: Build where clause based on role
    const whereClause: any = { deletedAt: null };
    
    if (isSuperAdmin(session)) {
      // SUPER_ADMIN can see all users, optionally filtered by shopId
      if (shopId) {
        whereClause.shopId = shopId;
      }
    } else {
      // OWNER can only see users in their own shop
      whereClause.shopId = session?.shopId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return createSuccessResponse(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return createErrorResponse('Failed to fetch users');
  }
}

/**
 * POST /api/users - Create a new user
 * SUPER_ADMIN: Can create users for any shop (including OWNER role)
 * OWNER: Can create users only for their own shop (SALES/ACCOUNTS only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    const canManageUsers = hasPermission(session, 'USER_MANAGE') || hasPermission(session, 'SUPER_ADMIN_USERS_MANAGE');
    if (!canManageUsers) {
      return createErrorResponse('Unauthorized', 403);
    }

    const body = await request.json();
    const { username, password, name, email, phone, role, shopId } = body;

    // Validate required fields
    if (!username || !password || !name || !role) {
      return createErrorResponse('Missing required fields', 400);
    }

    // 🔒 SECURITY: Validate role and shopId based on user's role
    if (isSuperAdmin(session)) {
      // SUPER_ADMIN can create any role (including OWNER and SUPER_ADMIN)
      if (!['SUPER_ADMIN', 'OWNER', 'SALES', 'ACCOUNTS'].includes(role)) {
        return createErrorResponse('Invalid role', 400);
      }
      // SUPER_ADMIN must specify shopId for non-SUPER_ADMIN users
      if (role !== 'SUPER_ADMIN' && !shopId) {
        return createErrorResponse('shopId required for shop users', 400);
      }
      // SUPER_ADMIN users should not have shopId
      if (role === 'SUPER_ADMIN' && shopId) {
        return createErrorResponse('SUPER_ADMIN cannot be assigned to a shop', 400);
      }
    } else {
      // OWNER can only create SALES/ACCOUNTS for their own shop
      if (!['SALES', 'ACCOUNTS'].includes(role)) {
        return createErrorResponse('Unauthorized: Owners can only create SALES or ACCOUNTS users', 403);
      }
      // Force shopId to be the owner's shop
      if (shopId && shopId !== session?.shopId) {
        return createErrorResponse('Unauthorized: Cannot create users for other shops', 403);
      }
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return createErrorResponse('Username already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        phone,
        role,
        // Use provided shopId for SUPER_ADMIN, session shopId for OWNER
        shopId: isSuperAdmin(session) ? (role === 'SUPER_ADMIN' ? null : shopId) : session?.shopId,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        shopId: true,
        isActive: true,
        createdAt: true,
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return createSuccessResponse(user, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return createErrorResponse('Failed to create user');
  }
}
