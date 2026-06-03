import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { DimensionType } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Schema for product creation
const productCreateSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  dimensionType: z.nativeEnum(DimensionType),
  baseUnit: z.string().min(1, 'Base unit is required'),
  basePrice: z.number().positive('Price must be greater than 0'),
  inventoryQuantity: z.number().nonnegative('Inventory cannot be negative'),
});

// GET /api/products - Search, Filter, Sort, Paginate
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const dimensionType = searchParams.get('dimensionType') || '';
    const sortBy = searchParams.get('sortBy') || 'recently_added';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const skip = (page - 1) * limit;

    // Build Prisma query filters
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (dimensionType) {
      where.dimensionType = dimensionType as DimensionType;
    }

    // Build sorting
    let orderBy: any = {};
    if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'price') {
      orderBy = { basePrice: sortOrder };
    } else {
      orderBy = { createdAt: 'desc' }; // default: recently added
    }

    // Execute queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products - Admin Only
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const result = productCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      return NextResponse.json({ error: 'Product with this SKU already exists' }, { status: 400 });
    }

    // Create the product (Prisma translates numbers/Decimal objects to NUMERIC correctly)
    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description || '',
        category: data.category,
        dimensionType: data.dimensionType,
        baseUnit: data.baseUnit,
        basePrice: new Decimal(data.basePrice),
        inventoryQuantity: new Decimal(data.inventoryQuantity),
      },
    });

    // Log the product creation
    await logActivity(
      (session.user as any).id,
      'PRODUCT_CREATE',
      `Created product '${product.name}' (SKU: ${product.sku}) with base price ₹${product.basePrice.toString()} and stock ${product.inventoryQuantity.toString()}`
    );

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
