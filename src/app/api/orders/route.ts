import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { OrderStatus, QuotationStatus } from '@prisma/client';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const orderCreateSchema = z.object({
  quotationId: z.string().min(1, 'Quotation ID is required'),
});

// GET /api/orders - List orders
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

    // Sellers can only view their own orders
    if (userRole === 'SELLER') {
      where.userId = userId;
    } else if (userRole === 'ADMIN') {
      // Admins can filter by user
      const filterUserId = searchParams.get('userId');
      if (filterUserId) {
        where.userId = filterUserId;
      }
    }

    const orders = await prisma.order.findMany({
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
        quotation: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/orders - Convert quotation to order
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const result = orderCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.format() },
        { status: 400 }
      );
    }

    const { quotationId } = result.data;

    // Fetch quotation with items
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Check if quotation already converted to an order
    const existingOrder = await prisma.order.findUnique({
      where: { quotationId },
    });

    if (existingOrder) {
      return NextResponse.json({ error: 'This quotation has already been converted to an order.' }, { status: 400 });
    }

    // Ensure the seller owns this quotation (Admins can convert any)
    if ((session.user as any).role === 'SELLER' && quotation.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this quotation.' }, { status: 403 });
    }

    // Pre-validate inventory before creating order (Warning / check)
    // We will raise a warning, but we still allow creating a PENDING order.
    // The strict inventory block happens when the Admin approves (PROCESSING/SHIPPED) the order.
    // This allows the seller to request the order even if stock is temporarily low, and allows the admin to resolve it.
    // However, we can also check if the user is placing an order that exceeds stock, and let them know.

    // Create the order and items in a transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // Update quotation status to APPROVED
      await tx.quotation.update({
        where: { id: quotationId },
        data: { status: QuotationStatus.APPROVED },
      });

      // Create Order
      const order = await tx.order.create({
        data: {
          userId: quotation.userId,
          quotationId: quotation.id,
          status: OrderStatus.PENDING,
          total: quotation.total,
        },
      });

      // Create OrderItems
      const orderItemsToCreate = quotation.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        orderedUnit: item.orderedUnit,
        orderedQuantity: item.orderedQuantity,
        baseQuantity: item.baseQuantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      }));

      await tx.orderItem.createMany({
        data: orderItemsToCreate,
      });

      return tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
    });

    // Log the order conversion
    await logActivity(
      userId,
      'ORDER_CREATE',
      `Converted quotation request '${quotationId}' to pending Purchase Order '${newOrder?.id}' with value ₹${newOrder?.total.toString()}`
    );

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
