// Barcode Scan/Search API
// User Story 30: Barcode Management - Scanning and searching

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response';

/**
 * GET /api/barcode/scan?code={barcode_or_tag}
 * Scan/search for stock item by barcode or tag ID
 * 
 * Query parameters:
 * - code: Barcode or tag ID to search for
 * - type: Search type (barcode, tag, or auto - default: auto)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const searchType = searchParams.get('type') || 'auto';

    if (!code) {
      return NextResponse.json(
        errorResponse('Barcode or tag ID is required'),
        { status: 400 }
      );
    }

    let stockItem = null;

    // Auto-detect or specific search
    if (searchType === 'auto' || searchType === 'barcode') {
      // Try barcode first
      stockItem = await prisma.stockItem.findFirst({
        where: {
          barcode: code,
          deletedAt: null,
        },
        include: {
          product: {
            include: {
              supplier: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          purchaseOrder: {
            select: {
              id: true,
              orderNumber: true,
              orderDate: true,
            },
          },
        },
      });
    }

    // If not found by barcode, try tag ID
    if (!stockItem && (searchType === 'auto' || searchType === 'tag')) {
      stockItem = await prisma.stockItem.findFirst({
        where: {
          tagId: code,
          deletedAt: null,
        },
        include: {
          product: {
            include: {
              supplier: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          purchaseOrder: {
            select: {
              id: true,
              orderNumber: true,
              orderDate: true,
            },
          },
        },
      });
    }

    if (!stockItem) {
      return NextResponse.json(
        errorResponse(`No stock item found with code: ${code}`),
        { status: 404 }
      );
    }

    // Get BIS compliance info if HUID exists
    let bisCompliance = null;
    if (stockItem.product.huid) {
      bisCompliance = await prisma.bisCompliance.findFirst({
        where: {
          OR: [
            { stockItemId: stockItem.id },
            { productId: stockItem.productId },
            { huid: stockItem.product.huid },
          ],
        },
      });
    }

    // Build response
    const response = {
      stockItem: {
        id: stockItem.id,
        tagId: stockItem.tagId,
        barcode: stockItem.barcode,
        status: stockItem.status,
        purchaseCost: Number(stockItem.purchaseCost),
        sellingPrice: Number(stockItem.sellingPrice),
        purchaseDate: stockItem.purchaseDate,
        saleDate: stockItem.saleDate,
      },
      product: {
        id: stockItem.product.id,
        name: stockItem.product.name,
        metalType: stockItem.product.metalType,
        purity: stockItem.product.purity,
        grossWeight: Number(stockItem.product.grossWeight),
        netWeight: Number(stockItem.product.netWeight),
        makingCharges: Number(stockItem.product.makingCharges),
        wastagePercent: Number(stockItem.product.wastagePercent),
        stoneWeight: stockItem.product.stoneWeight ? Number(stockItem.product.stoneWeight) : null,
        stoneValue: stockItem.product.stoneValue ? Number(stockItem.product.stoneValue) : null,
        huid: stockItem.product.huid,
        hallmarkNumber: stockItem.product.hallmarkNumber,
        tagNumber: stockItem.product.tagNumber,
        description: stockItem.product.description,
        supplier: stockItem.product.supplier,
      },
      purchaseOrder: stockItem.purchaseOrder,
      bisCompliance: bisCompliance
        ? {
            huid: bisCompliance.huid,
            complianceStatus: bisCompliance.complianceStatus,
            hallmarkNumber: bisCompliance.hallmarkNumber,
            bisStandard: bisCompliance.bisStandard,
            ahcCode: bisCompliance.ahcCode,
            jewelType: bisCompliance.jewelType,
            expiryDate: bisCompliance.expiryDate,
          }
        : null,
    };

    return NextResponse.json(successResponse(response), { status: 200 });
  } catch (error: any) {
    console.error('Error scanning barcode:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

/**
 * POST /api/barcode/scan
 * Batch scan multiple barcodes/tags
 * 
 * Body:
 * {
 *   "codes": ["barcode1", "barcode2", "tag1", ...]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codes } = body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        errorResponse('Array of codes is required'),
        { status: 400 }
      );
    }

    if (codes.length > 100) {
      return NextResponse.json(
        errorResponse('Maximum 100 codes per batch'),
        { status: 400 }
      );
    }

    // Search for all codes
    const stockItems = await prisma.stockItem.findMany({
      where: {
        OR: [
          { barcode: { in: codes } },
          { tagId: { in: codes } },
        ],
        deletedAt: null,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            metalType: true,
            purity: true,
            grossWeight: true,
            netWeight: true,
            huid: true,
          },
        },
      },
    });

    // Build results map
    const foundCodes = new Set([
      ...stockItems.map((item) => item.barcode),
      ...stockItems.map((item) => item.tagId),
    ]);

    const notFound = codes.filter((code) => !foundCodes.has(code));

    return NextResponse.json(
      successResponse({
        total: codes.length,
        found: stockItems.length,
        notFound: notFound.length,
        items: stockItems.map((item) => ({
          id: item.id,
          tagId: item.tagId,
          barcode: item.barcode,
          status: item.status,
          sellingPrice: Number(item.sellingPrice),
          product: {
            id: item.product.id,
            name: item.product.name,
            metalType: item.product.metalType,
            purity: item.product.purity,
            netWeight: Number(item.product.netWeight),
          },
        })),
        notFoundCodes: notFound,
      })
    );
  } catch (error: any) {
    console.error('Error batch scanning barcodes:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
