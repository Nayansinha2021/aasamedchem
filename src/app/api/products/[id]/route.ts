import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { DimensionType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { logActivity } from '@/lib/audit';

// Schema for product update
const productUpdateSchema = z.object({
  sku: z.string().min(1, 'SKU is required').optional(),
  name: z.string().min(1, 'Product name is required').optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required').optional(),
  dimensionType: z.nativeEnum(DimensionType).optional(),
  baseUnit: z.string().min(1, 'Base unit is required').optional(),
  basePrice: z.number().positive('Price must be greater than 0').optional(),
  inventoryQuantity: z.number().nonnegative('Inventory cannot be negative').optional(),
});

// PUT /api/products/[id] - Admin Only
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = productUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.format() },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const data = result.data;

    // Check SKU collision if updating SKU
    if (data.sku && data.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existingSku) {
        return NextResponse.json({ error: 'Product with this SKU already exists' }, { status: 400 });
      }
    }

    // Construct update payload
    const updateData: any = { ...data };
    if (data.basePrice !== undefined) {
      updateData.basePrice = new Decimal(data.basePrice);
    }
    if (data.inventoryQuantity !== undefined) {
      updateData.inventoryQuantity = new Decimal(data.inventoryQuantity);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // Log the product update
    await logActivity(
      (session.user as any).id,
      'PRODUCT_UPDATE',
      `Updated product '${updatedProduct.name}' (SKU: ${updatedProduct.sku}). Changes: ${JSON.stringify(data)}`
    );

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error(`PUT /api/products/[id] (${error.message}) error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Admin Only
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { id } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if there are quotations or orders referencing this product
    const referencingQuotations = await prisma.quotationItem.count({
      where: { productId: id },
    });
    const referencingOrders = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (referencingQuotations > 0 || referencingOrders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product because it is referenced in quotations or orders. Try setting stock to 0 instead.' },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    // Log the product deletion
    await logActivity(
      (session.user as any).id,
      'PRODUCT_DELETE',
      `Deleted product '${existingProduct.name}' (SKU: ${existingProduct.sku})`
    );

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error(`DELETE /api/products/[id] error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
