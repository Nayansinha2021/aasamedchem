import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    console.log('[DEBUG Dashboard API] session:', session);
    console.log('[DEBUG Dashboard API] userId:', userId);

    // Fetch counts and sums in parallel
    const [quotationsCount, ordersCount, orders, recentQuotations, recentOrders] = await Promise.all([
      prisma.quotation.count({ where: { userId } }),
      prisma.order.count({ where: { userId } }),
      prisma.order.findMany({
        where: {
          userId,
          status: { not: 'CANCELLED' },
        },
        select: { total: true },
      }),
      prisma.quotation.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: { select: { name: true } } },
          },
        },
      }),
      prisma.order.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: { select: { name: true } } },
          },
        },
      }),
    ]);

    // Sum up the spending
    const totalSpending = orders.reduce((sum, order) => sum.plus(new Decimal(order.total)), new Decimal(0));

    return NextResponse.json({
      stats: {
        totalQuotations: quotationsCount,
        totalOrders: ordersCount,
        totalSpending: totalSpending.toFixed(5),
      },
      recentQuotations,
      recentOrders,
    });
  } catch (error: any) {
    console.error('GET /api/dashboard/seller error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
