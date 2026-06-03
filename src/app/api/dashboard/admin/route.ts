import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    // Fetch counts and products in parallel
    const [totalProducts, productsForInventory, totalQuotations, totalOrders, recentOrders, recentQuotations] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({ select: { inventoryQuantity: true } }),
      prisma.quotation.count(),
      prisma.order.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      prisma.quotation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
    ]);

    // Calculate total inventory
    const totalInventory = productsForInventory.reduce(
      (sum, p) => sum.plus(new Decimal(p.inventoryQuantity)),
      new Decimal(0)
    );

    return NextResponse.json({
      stats: {
        totalProducts,
        totalInventory: totalInventory.toFixed(5),
        totalQuotations,
        totalOrders,
      },
      recentOrders,
      recentQuotations,
    });
  } catch (error: any) {
    console.error('GET /api/dashboard/admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
