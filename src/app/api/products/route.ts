// Product API Route - GET all products, POST create product
// GET /api/products - List all products with filters and pagination
// POST /api/products - Create a new product

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { successResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { weightSchema, amountSchema } from '@/utils/validation';
import { MetalType, AuditModule } from '@/domain/entities/types';
import { logCreate } from '@/utils/audit';
import { generateBarcode } from '@/utils/barcode';
import { calculateProductPrice } from '@/utils/pricing';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { getRepositories } from '@/utils/apiRepository';

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  metalType: z.nativeEnum(MetalType),
  purity: z.string().max(20),
  grossWeight: weightSchema,
  netWeight: weightSchema,
  huid: z.string().max(50).optional(),
  tagNumber: z.string().max(50).optional(),
  description: z.string().optional(),
  makingCharges: amountSchema,
  wastagePercent: z.number().min(0).max(100),
  stoneWeight: weightSchema.optional(),
  stoneValue: amountSchema.optional(),
  stoneDescription: z.string().optional(),
  hallmarkNumber: z.string().max(50).optional(),
  bisCompliant: z.boolean().default(false),
  collectionName: z.string().max(100).optional(),
  design: z.string().max(200).optional(),
  size: z.string().max(50).optional(),
  supplierId: z.string().uuid().optional(),
  reorderLevel: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  isCustomOrder: z.boolean().default(false),
  priceOverride: amountSchema.optional(),
  priceOverrideReason: z.string().optional(),
  calculatePrice: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'PRODUCT_VIEW')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Parse filters
    const filters: any = {
      search: searchParams.get('search') || undefined,
      barcode: searchParams.get('barcode') || undefined,
      huid: searchParams.get('huid') || undefined,
      tagNumber: searchParams.get('tagNumber') || undefined,
      metalType: searchParams.get('metalType') as MetalType | undefined,
      purity: searchParams.get('purity') || undefined,
      collectionName: searchParams.get('collectionName') || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      stockStatus: searchParams.get('stockStatus') || undefined,
      isActive: searchParams.get('isActive')
        ? searchParams.get('isActive') === 'true'
        : undefined,
      isCustomOrder: searchParams.get('isCustomOrder')
        ? searchParams.get('isCustomOrder') === 'true'
        : undefined,
      lowStock: searchParams.get('lowStock')
        ? searchParams.get('lowStock') === 'true'
        : undefined,
    };

    const repos = await getRepositories(request);
    const repository = repos.product;
    const result = await repository.findAll(filters, { page, pageSize });

    return NextResponse.json(successResponse(result.data, result.meta), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permission
    const session = await getSession();
    if (!hasPermission(session, 'PRODUCT_CREATE')) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Generate barcode
    const tempId = Math.random().toString(36).substring(7);
    const barcode = generateBarcode('PRD', tempId);

    const repos = await getRepositories(request);
    const repository = repos.product;

    // Check if barcode exists (very unlikely but safe to check)
    const existingProduct = await repository.findByBarcode(barcode);
    if (existingProduct) {
      return NextResponse.json(errorResponse('Barcode collision, please try again'), {
        status: 409,
      });
    }

    // Calculate price if requested and rate is available
    let calculatedPrice = null;
    let rateUsedId = null;

    if (data.calculatePrice) {
      // Find current active rate for this metal type and purity
      const currentRate = await prisma.rateMaster.findFirst({
        where: {
          metalType: data.metalType,
          purity: data.purity,
          isActive: true,
          shopId: session!.shopId!, // Filter by shop
        },
        orderBy: {
          effectiveDate: 'desc',
        },
      });

      if (currentRate) {
        const priceCalc = calculateProductPrice({
          netWeight: data.netWeight,
          wastagePercent: data.wastagePercent,
          metalRatePerGram: Number(currentRate.ratePerGram),
          makingCharges: data.makingCharges,
          stoneValue: data.stoneValue || 0,
        });

        calculatedPrice = priceCalc.totalPrice;
        rateUsedId = currentRate.id;
      }
    }

    // Prepare product data
    const productData: any = {
      name: data.name,
      metalType: data.metalType,
      purity: data.purity,
      grossWeight: data.grossWeight,
      netWeight: data.netWeight,
      barcode,
      huid: data.huid || null,
      tagNumber: data.tagNumber || null,
      description: data.description || null,
      makingCharges: data.makingCharges,
      wastagePercent: data.wastagePercent,
      stoneWeight: data.stoneWeight || null,
      stoneValue: data.stoneValue || null,
      stoneDescription: data.stoneDescription || null,
      hallmarkNumber: data.hallmarkNumber || null,
      bisCompliant: data.bisCompliant,
      collectionName: data.collectionName || null,
      design: data.design || null,
      size: data.size || null,
      supplierId: data.supplierId || null,
      reorderLevel: data.reorderLevel,
      isActive: data.isActive,
      isCustomOrder: data.isCustomOrder,
      calculatedPrice,
      priceOverride: data.priceOverride || null,
      priceOverrideReason: data.priceOverrideReason || null,
      lastPriceUpdate: calculatedPrice ? new Date() : null,
      rateUsedId,
    };

    const product = await repository.create(productData);

    // Log the creation
    await logCreate(AuditModule.PRODUCTS, product.id, product, session!.shopId!);

    return NextResponse.json(successResponse(product), { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
