import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission, hashPassword } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

/**
 * GET /api/users - Get all users (OWNER only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!hasPermission(session, 'USER_MANAGE')) {
      return createErrorResponse('Unauthorized', 403);
    }

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId') || session?.shopId;

    const users = await prisma.user.findMany({
      where: {
        shopId,
        deletedAt: null,
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
 * POST /api/users - Create a new user (OWNER only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!hasPermission(session, 'USER_MANAGE')) {
      return createErrorResponse('Unauthorized', 403);
    }

    const body = await request.json();
    const { username, password, name, email, phone, role, shopId } = body;

    // Validate required fields
    if (!username || !password || !name || !role || !shopId) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Validate role
    if (!['OWNER', 'SALES', 'ACCOUNTS'].includes(role)) {
      return createErrorResponse('Invalid role', 400);
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
        shopId,
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
