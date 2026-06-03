import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
import { convertToBaseUnit, calculatePrice } from '@/lib/conversion';
import { Decimal } from 'decimal.js';
import { QuotationStatus } from '@prisma/client';
import { logActivity } from '@/lib/audit';

// Schema for quotation item validation
const quotationItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  orderedQuantity: z.number().positive('Quantity must be greater than 0'),
  orderedUnit: z.string().min(1, 'Unit is required'),
});

const quotationCreateSchema = z.object({
  items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
});

// GET /api/quotations - View quotations
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    let where: any = {};

    // Sellers can only view their own quotations
    if (userRole === 'SELLER') {
      where.userId = userId;
    } else if (userRole === 'ADMIN') {
      // Admins can optionally filter by seller ID
      const filterUserId = searchParams.get('userId');
      if (filterUserId) {
        where.userId = filterUserId;
      }
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, category: true, baseUnit: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quotations);
  } catch (error: any) {
    console.error('GET /api/quotations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/quotations - Create a quotation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const result = quotationCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.format() },
        { status: 400 }
      );
    }

    const inputItems = result.data.items;
    let grandTotal = new Decimal(0);
    const processedItems: any[] = [];

    // Process and validate each item
    for (const item of inputItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      // Check unit validity based on dimension type
      const unit = item.orderedUnit.trim();
      const dt = product.dimensionType;

      if (dt === 'WEIGHT' && unit !== 'g' && unit !== 'kg') {
        return NextResponse.json(
          { error: `Invalid unit '${unit}' for WEIGHT product: ${product.name}. Allowed: g, kg` },
          { status: 400 }
        );
      }
      if (dt === 'VOLUME' && unit !== 'mL' && unit !== 'L') {
        return NextResponse.json(
          { error: `Invalid unit '${unit}' for VOLUME product: ${product.name}. Allowed: mL, L` },
          { status: 400 }
        );
      }
      if (dt === 'COUNT' && unit !== 'unit') {
        return NextResponse.json(
          { error: `Invalid unit '${unit}' for COUNT product: ${product.name}. Allowed: unit` },
          { status: 400 }
        );
      }

      // Perform unit conversion
      const baseQuantity = convertToBaseUnit(item.orderedQuantity, unit);
      const subtotal = calculatePrice(baseQuantity, product.basePrice);

      // Unit price for the ordered unit
      const unitPrice = subtotal.div(new Decimal(item.orderedQuantity));

      grandTotal = grandTotal.plus(subtotal);

      processedItems.push({
        productId: product.id,
        orderedUnit: unit,
        orderedQuantity: new Decimal(item.orderedQuantity),
        baseQuantity,
        unitPrice,
        subtotal,
      });
    }

    // Save quotation to database in a transaction
    const newQuotation = await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          userId,
          status: QuotationStatus.PENDING,
          total: grandTotal,
        },
      });

      // Create items
      const itemsToCreate = processedItems.map((item) => ({
        quotationId: quotation.id,
        productId: item.productId,
        orderedUnit: item.orderedUnit,
        orderedQuantity: item.orderedQuantity,
        baseQuantity: item.baseQuantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      }));

      await tx.quotationItem.createMany({
        data: itemsToCreate,
      });

      return tx.quotation.findUnique({
        where: { id: quotation.id },
        include: {
          items: true,
        },
      });
    });

    // Log the quotation creation
    await logActivity(
      userId,
      'QUOTATION_CREATE',
      `Generated quotation request '${newQuotation?.id}' with total value ₹${newQuotation?.total.toString()}`
    );

    return NextResponse.json(newQuotation, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/quotations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
