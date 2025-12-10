import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    return NextResponse.json({
      success: true,
      session: session ? {
        userId: session.userId,
        username: session.username,
        name: session.name,
        role: session.role,
        shopId: session.shopId,
        shopName: session.shopName,
        hasShopId: !!session.shopId,
        shopIdType: typeof session.shopId,
        shopIdValue: session.shopId,
      } : null,
      hasSession: !!session,
      rawSessionKeys: session ? Object.keys(session) : [],
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
