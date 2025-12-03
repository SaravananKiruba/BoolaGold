// Test endpoint to verify stock data
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    console.log('[Stock Test] Starting test...');
    
    // Count total stock items
    const totalCount = await prisma.stockItem.count({
      where: {
        deletedAt: null
      }
    });
    
    console.log('[Stock Test] Total stock items:', totalCount);
    
    // Count available items
    const availableCount = await prisma.stockItem.count({
      where: {
        deletedAt: null,
        status: 'AVAILABLE'
      }
    });
    
    console.log('[Stock Test] Available stock items:', availableCount);
    
    // Get first 5 items
    const sampleItems = await prisma.stockItem.findMany({
      where: {
        deletedAt: null,
        status: 'AVAILABLE'
      },
      include: {
        product: true
      },
      take: 5
    });
    
    console.log('[Stock Test] Sample items:', sampleItems.length);
    
    // Test search with a simple query
    const searchTest = await prisma.stockItem.findMany({
      where: {
        deletedAt: null,
        OR: [
          { tagId: { contains: 'G' } },
          { product: { name: { contains: 'Ring' } } }
        ]
      },
      include: {
        product: true
      },
      take: 5
    });
    
    console.log('[Stock Test] Search test results:', searchTest.length);
    
    return NextResponse.json({
      success: true,
      data: {
        totalCount,
        availableCount,
        sampleItems: sampleItems.map(item => ({
          id: item.id,
          tagId: item.tagId,
          barcode: item.barcode,
          status: item.status,
          productName: item.product.name,
          metalType: item.product.metalType,
          purity: item.product.purity
        })),
        searchTestResults: searchTest.map(item => ({
          id: item.id,
          tagId: item.tagId,
          productName: item.product.name
        }))
      }
    });
  } catch (error: any) {
    console.error('[Stock Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
