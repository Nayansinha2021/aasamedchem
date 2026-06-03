import { describe, it, expect, vi } from 'vitest';
import { Decimal } from 'decimal.js';

// Since we want to test the business rules in isolation without hitting a live DB,
// we can write a simple test for our transition logic.
// We simulate the transaction logic inside PUT /api/orders/[id]/status.

interface Product {
  id: string;
  name: string;
  inventoryQuantity: Decimal;
}

interface OrderItem {
  productId: string;
  baseQuantity: Decimal;
  orderedQuantity: number;
  orderedUnit: string;
}

const simulateStatusTransition = (
  currentStatus: string,
  targetStatus: string,
  products: Product[],
  orderItems: OrderItem[]
) => {
  const isApprovedState = (status: string) =>
    status === 'PROCESSING' || status === 'SHIPPED' || status === 'DELIVERED';

  const shouldDeductInventory = !isApprovedState(currentStatus) && isApprovedState(targetStatus);
  const shouldRestoreInventory = isApprovedState(currentStatus) && targetStatus === 'CANCELLED';

  const updatedProducts = products.map(p => ({ ...p, inventoryQuantity: new Decimal(p.inventoryQuantity) }));

  if (shouldDeductInventory) {
    for (const item of orderItems) {
      const product = updatedProducts.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (product.inventoryQuantity.lessThan(item.baseQuantity)) {
        throw new Error(
          `Insufficient inventory for ${product.name}. Required: ${item.orderedQuantity} ${item.orderedUnit}, Available: ${product.inventoryQuantity} ${item.orderedUnit}`
        );
      }

      // Deduct
      product.inventoryQuantity = product.inventoryQuantity.minus(item.baseQuantity);
    }
  } else if (shouldRestoreInventory) {
    for (const item of orderItems) {
      const product = updatedProducts.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      // Restore
      product.inventoryQuantity = product.inventoryQuantity.plus(item.baseQuantity);
    }
  }

  return {
    status: targetStatus,
    products: updatedProducts,
  };
};

describe('Inventory Deduction and Restoration Rules', () => {
  it('should deduct stock when transitioning from PENDING to PROCESSING', () => {
    const products: Product[] = [
      { id: '1', name: 'Sugar', inventoryQuantity: new Decimal(5000) }, // 5kg
    ];

    const orderItems: OrderItem[] = [
      { productId: '1', baseQuantity: new Decimal(2500), orderedQuantity: 2.5, orderedUnit: 'kg' },
    ];

    const result = simulateStatusTransition('PENDING', 'PROCESSING', products, orderItems);

    expect(result.status).toBe('PROCESSING');
    expect(result.products[0].inventoryQuantity.toString()).toBe('2500'); // 5000 - 2500 = 2500
  });

  it('should block approval if stock is insufficient', () => {
    const products: Product[] = [
      { id: '1', name: 'Sugar', inventoryQuantity: new Decimal(1000) }, // 1kg
    ];

    const orderItems: OrderItem[] = [
      { productId: '1', baseQuantity: new Decimal(2500), orderedQuantity: 2.5, orderedUnit: 'kg' },
    ];

    expect(() =>
      simulateStatusTransition('PENDING', 'PROCESSING', products, orderItems)
    ).toThrowError(/Insufficient inventory for Sugar/);
  });

  it('should restore stock when cancelling an approved order', () => {
    const products: Product[] = [
      { id: '1', name: 'Sugar', inventoryQuantity: new Decimal(2500) },
    ];

    const orderItems: OrderItem[] = [
      { productId: '1', baseQuantity: new Decimal(2500), orderedQuantity: 2.5, orderedUnit: 'kg' },
    ];

    // Current is already approved (PROCESSING), target is CANCELLED
    const result = simulateStatusTransition('PROCESSING', 'CANCELLED', products, orderItems);

    expect(result.status).toBe('CANCELLED');
    expect(result.products[0].inventoryQuantity.toString()).toBe('5000'); // 2500 + 2500 = 5000
  });

  it('should not change stock if transitioning from PROCESSING to SHIPPED', () => {
    const products: Product[] = [
      { id: '1', name: 'Sugar', inventoryQuantity: new Decimal(2500) },
    ];

    const orderItems: OrderItem[] = [
      { productId: '1', baseQuantity: new Decimal(2500), orderedQuantity: 2.5, orderedUnit: 'kg' },
    ];

    const result = simulateStatusTransition('PROCESSING', 'SHIPPED', products, orderItems);

    expect(result.status).toBe('SHIPPED');
    expect(result.products[0].inventoryQuantity.toString()).toBe('2500'); // unchanged
  });
});
