// Product API Route - GET, PUT, DELETE by ID
// GET /api/products/[id] - Get product details
// PUT /api/products/[id] - Update product
// DELETE /api/products/[id] - Soft delete product

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ProductRepository } from '@/repositories/productRepository';

import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/utils/response';
import { weightSchema, amountSchema } from '@/utils/validation';
import { MetalType, AuditModule } from '@/domain/entities/types';
import { logUpdate, logDelete } from '@/utils/audit';
import { calculateProductPrice } from '@/utils/pricing';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getRepositories } from '@/utils/apiRepository';

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  metalType: z.nativeEnum(MetalType).optional(),
  purity: z.string().max(20).optional(),
  grossWeight: weightSchema.optional(),
  netWeight: weightSchema.optional(),
  huid: z.string().max(50).optional(),
  tagNumber: z.string().max(50).optional(),
  description: z.string().optional(),
  makingCharges: amountSchema.optional(),
  wastagePercent: z.number().min(0).max(100).optional(),
  stoneWeight: weightSchema.optional(),
  stoneValue: amountSchema.optional(),
  stoneDescription: z.string().optional(),
  hallmarkNumber: z.string().max(50).optional(),
  bisCompliant: z.boolean().optional(),
  collectionName: z.string().max(100).optional(),
  design: z.string().max(200).optional(),
  size: z.string().max(50).optional(),
  supplierId: z.string().uuid().optional().nullable(),
  reorderLevel: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  priceOverride: amountSchema.optional(),
  priceOverrideReason: z.string().optional(),
  recalculatePrice: z.boolean().default(false),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repos = await getRepositories(request);
    const product = await repos.product.findById(id);

    if (!product) {
      return NextResponse.json(notFoundResponse('Product'), { status: 404 });
    }

    // Get stock summary
    const stockSummary = await repos.stockItem.getStockSummaryByProduct(id);

    return NextResponse.json(
      successResponse({
        ...product,
        stockSummary,
      })
    );
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;const session = await getSession();
    const body = await request.json();

    const repos = await getRepositories(request);
    const repository = repos.product;

    // Validate input
    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 });
    }

    const data = validation.data;

    // Check if product exists
    const existingProduct = await repos.product.findById(id);
    if (!existingProduct) {
      return NextResponse.json(notFoundResponse('Product'), { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.metalType) updateData.metalType = data.metalType;
    if (data.purity) updateData.purity = data.purity;
    if (data.grossWeight) updateData.grossWeight = data.grossWeight;
    if (data.netWeight) updateData.netWeight = data.netWeight;
    if (data.huid !== undefined) updateData.huid = data.huid || null;
    if (data.tagNumber !== undefined) updateData.tagNumber = data.tagNumber || null;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.makingCharges !== undefined) updateData.makingCharges = data.makingCharges;
    if (data.wastagePercent !== undefined) updateData.wastagePercent = data.wastagePercent;
    if (data.stoneWeight !== undefined) updateData.stoneWeight = data.stoneWeight || null;
    if (data.stoneValue !== undefined) updateData.stoneValue = data.stoneValue || null;
    if (data.stoneDescription !== undefined) updateData.stoneDescription = data.stoneDescription || null;
    if (data.hallmarkNumber !== undefined) updateData.hallmarkNumber = data.hallmarkNumber || null;
    if (data.bisCompliant !== undefined) updateData.bisCompliant = data.bisCompliant;
    if (data.collectionName !== undefined) updateData.collectionName = data.collectionName || null;
    if (data.design !== undefined) updateData.design = data.design || null;
    if (data.size !== undefined) updateData.size = data.size || null;
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId || null;
    if (data.reorderLevel) updateData.reorderLevel = data.reorderLevel;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.priceOverride !== undefined) updateData.priceOverride = data.priceOverride || null;
    if (data.priceOverrideReason !== undefined) updateData.priceOverrideReason = data.priceOverrideReason || null;

    // Recalculate price if requested
    if (data.recalculatePrice) {
      const metalType = data.metalType || existingProduct.metalType;
      const purity = data.purity || existingProduct.purity;

      const currentRate = await prisma.rateMaster.findFirst({
        where: {
          metalType,
          purity,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (currentRate) {
        const priceCalc = calculateProductPrice({
          netWeight: data.netWeight || Number(existingProduct.netWeight),
          wastagePercent: data.wastagePercent ?? Number(existingProduct.wastagePercent),
          metalRatePerGram: Number(currentRate.ratePerGram),
          makingCharges: data.makingCharges ?? Number(existingProduct.makingCharges),
          stoneValue: data.stoneValue ?? Number(existingProduct.stoneValue || 0),
        });

        updateData.calculatedPrice = priceCalc.totalPrice;
        updateData.lastPriceUpdate = new Date();
        updateData.rateUsedId = currentRate.id;
      }
    }

    const updatedProduct = await repository.update(id, updateData);

    // Log the update
    await logUpdate(AuditModule.PRODUCTS, id, existingProduct, updatedProduct, session!.shopId!);

    return NextResponse.json(successResponse(updatedProduct), { status: 200 });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params;const repos = await getRepositories(request);
    const session = await getSession();
    const product = await repos.product.findById(id);

    if (!product) {
      return NextResponse.json(notFoundResponse('Product'), { status: 404 });
    }

    // Check if product has active stock
    const activeStock = await repos.stockItem.findAvailableByProduct(id, 1);
    if (activeStock.length > 0) {
      return NextResponse.json(
        errorResponse('Cannot delete product with active stock items'),
        { status: 400 }
      );
    }
    const repository = repos.product;
    await repository.softDelete(id);

    // Log the deletion
    await logDelete(AuditModule.PRODUCTS, id, product, session!.shopId!);

    return NextResponse.json(successResponse({ message: 'Product deleted successfully' }), { status: 200 });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
