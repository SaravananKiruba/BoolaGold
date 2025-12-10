// Barcode Label Generation/Printing API
// User Story 30: Barcode Management - Label printing

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response';
import { generateBatchBarcodes } from '@/utils/barcode';
import { getSession } from '@/lib/auth';

/**
 * GET /api/barcode/labels?stockItemIds=id1,id2,id3
 * Generate printable barcode labels for stock items
 * Returns label data that can be used with thermal printers or label templates
 */
export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        errorResponse('Unauthorized - Valid session required'),
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const stockItemIdsParam = searchParams.get('stockItemIds');

    if (!stockItemIdsParam) {
      return NextResponse.json(
        errorResponse('Stock item IDs are required'),
        { status: 400 }
      );
    }

    const stockItemIds = stockItemIdsParam.split(',');

    if (stockItemIds.length > 100) {
      return NextResponse.json(
        errorResponse('Maximum 100 labels per request'),
        { status: 400 }
      );
    }

    // Get stock items with product details - filtered by shop
    const stockItems = await prisma.stockItem.findMany({
      where: {
        id: { in: stockItemIds },
        deletedAt: null,
        product: {
          shopId: session.shopId || undefined, // Filter by shop
        },
      },
      include: {
        product: true,
      },
    });

    if (stockItems.length === 0) {
      return NextResponse.json(
        errorResponse('No stock items found'),
        { status: 404 }
      );
    }

    // Generate label data
    const labels = stockItems.map((item) => ({
      stockItemId: item.id,
      tagId: item.tagId,
      barcode: item.barcode,
      productName: item.product.name,
      metalType: item.product.metalType,
      purity: item.product.purity,
      netWeight: `${Number(item.product.netWeight).toFixed(3)}g`,
      grossWeight: `${Number(item.product.grossWeight).toFixed(3)}g`,
      purchaseCost: `₹${Number(item.purchaseCost).toFixed(2)}`,
      huid: item.product.huid || null,
      hallmarkNumber: item.product.hallmarkNumber || null,
      // Label template data
      labelData: {
        line1: item.product.name,
        line2: `${item.product.metalType} ${item.product.purity}`,
        line3: `Wt: ${Number(item.product.netWeight).toFixed(3)}g`,
        line4: `Tag: ${item.tagId}`,
        barcode: item.barcode,
        tagId: item.tagId,
        huid: item.product.huid || '',
      },
    }));

    return NextResponse.json(
      successResponse({
        labels,
        totalLabels: labels.length,
        format: 'standard', // Can be customized based on printer type
        printSettings: {
          labelWidth: '50mm',
          labelHeight: '30mm',
          fontSize: '10pt',
          barcodeHeight: '15mm',
        },
      })
    );
  } catch (error: any) {
    console.error('Error generating barcode labels:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

/**
 * POST /api/barcode/labels/generate-bulk
 * Generate barcodes for multiple items at once
 * 
 * Body:
 * {
 *   "productId": "uuid",
 *   "count": 10,
 *   "prefix": "STK"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, count, prefix = 'STK' } = body;

    if (!productId || !count) {
      return NextResponse.json(
        errorResponse('Product ID and count are required'),
        { status: 400 }
      );
    }

    if (count < 1 || count > 1000) {
      return NextResponse.json(
        errorResponse('Count must be between 1 and 1000'),
        { status: 400 }
      );
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        errorResponse('Product not found'),
        { status: 404 }
      );
    }

    // Generate barcodes
    const barcodes = generateBatchBarcodes(prefix, productId, count);

    // Check for duplicates in database
    const existingBarcodes = await prisma.stockItem.findMany({
      where: {
        barcode: { in: barcodes },
      },
      select: { barcode: true },
    });

    const existingSet = new Set(existingBarcodes.map((item) => item.barcode));
    const availableBarcodes = barcodes.filter((bc) => !existingSet.has(bc));

    if (availableBarcodes.length < count) {
      return NextResponse.json(
        errorResponse(`Only ${availableBarcodes.length} unique barcodes available. Some duplicates detected.`),
        { status: 409 }
      );
    }

    // Return generated barcodes
    return NextResponse.json(
      successResponse({
        productId,
        productName: product.name,
        count,
        barcodes: availableBarcodes.slice(0, count),
        message: `Generated ${count} unique barcodes`,
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error generating bulk barcodes:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
