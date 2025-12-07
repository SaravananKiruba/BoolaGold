import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    console.log('Login attempt:', {
      username,
      passwordLength: password?.length,
      passwordProvided: !!password,
    });

    // Validate input
    if (!username || !password) {
      console.log('Validation failed: missing username or password');
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username, deletedAt: null },
      include: {
        shop: true,
      },
    });

    console.log('User lookup result:', {
      found: !!user,
      username: user?.username,
      role: user?.role,
      isActive: user?.isActive,
      shopActive: user?.shop?.isActive,
    });

    if (!user) {
      console.log('User not found for username:', username);
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated. Please contact administrator.' },
        { status: 403 }
      );
    }

    // Check if shop is active (SUPER_ADMIN doesn't have a shop)
    if (user.role !== 'SUPER_ADMIN' && user.shop && !user.shop.isActive) {
      return NextResponse.json(
        { success: false, message: 'Shop is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    console.log('Password verification:', {
      valid: isPasswordValid,
      hashLength: user.password.length,
    });
    
    if (!isPasswordValid) {
      console.log('Password verification failed for username:', username);
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token (shopId and shopName are null for SUPER_ADMIN)
    const token = await generateToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      shopId: user.shopId || null,
      shopName: user.shop?.name || null,
    });

    // Create response with user data
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          shopId: user.shopId || null,
          shopName: user.shop?.name || null,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only session cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
