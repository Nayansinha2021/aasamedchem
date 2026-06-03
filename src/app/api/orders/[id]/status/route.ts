import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
import { logActivity } from '@/lib/audit';
import { Decimal } from 'decimal.js';
import { convertFromBaseUnit } from '@/lib/conversion';

const statusUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

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
    const result = statusUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.format() },
        { status: 400 }
      );
    }

    const targetStatus = result.data.status;

    // Fetch the order with its current status and items
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentStatus = order.status;

    // If no change, return immediately
    if (currentStatus === targetStatus) {
      return NextResponse.json(order);
    }

    // Determine inventory action
    const isApprovedState = (status: OrderStatus) =>
      status === OrderStatus.PROCESSING || status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED;

    const shouldDeductInventory = !isApprovedState(currentStatus) && isApprovedState(targetStatus);
    const shouldRestoreInventory = isApprovedState(currentStatus) && targetStatus === OrderStatus.CANCELLED;

    // Run updates in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (shouldDeductInventory) {
        // Check and deduct inventory
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          const currentStock = new Decimal(product.inventoryQuantity);
          const requiredStock = new Decimal(item.baseQuantity);

          if (currentStock.lessThan(requiredStock)) {
            // Convert to ordered unit for friendly error message
            const availableInOrderedUnit = convertFromBaseUnit(currentStock, item.orderedUnit);
            throw new Error(
              `Insufficient inventory for ${product.name}. Required: ${item.orderedQuantity} ${item.orderedUnit}, Available: ${availableInOrderedUnit.toFixed(5)} ${item.orderedUnit}`
            );
          }

          // Deduct stock
          await tx.product.update({
            where: { id: product.id },
            data: {
              inventoryQuantity: currentStock.minus(requiredStock),
            },
          });
        }
      } else if (shouldRestoreInventory) {
        // Restore inventory
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          const currentStock = new Decimal(product.inventoryQuantity);
          const restoredStock = new Decimal(item.baseQuantity);

          // Add back stock
          await tx.product.update({
            where: { id: product.id },
            data: {
              inventoryQuantity: currentStock.plus(restoredStock),
            },
          });
        }
      }

      // Update order status
      return tx.order.update({
        where: { id },
        data: { status: targetStatus },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    });

    // Log the order status change
    await logActivity(
      (session.user as any).id,
      'ORDER_STATUS_UPDATE',
      `Changed Purchase Order '${id}' status from '${currentStatus}' to '${targetStatus}'`
    );

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('PUT /api/orders/[id]/status error:', error);
    // Distinguish inventory errors (which we threw as error with message) from system errors
    const errorMessage = error.message || 'Internal server error';
    const isInventoryError =
      error.message &&
      (error.message.includes('Insufficient inventory') || error.message.includes('Product not found'));

    return NextResponse.json(
      { error: errorMessage },
      { status: isInventoryError ? 400 : 500 }
    );
  }
}
