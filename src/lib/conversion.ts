import { Decimal } from 'decimal.js';

// Configure decimal.js for maximum precision
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

/**
 * Converts a quantity in a specific unit to its base unit.
 * @param quantity The amount to convert
 * @param unit The unit of the quantity (e.g., 'g', 'kg', 'mL', 'L', 'unit')
 */
export function convertToBaseUnit(quantity: number | string | Decimal, unit: string): Decimal {
  const q = new Decimal(quantity);
  const normalizedUnit = unit.trim();

  switch (normalizedUnit) {
    case 'kg':
      return q.mul(1000);
    case 'g':
      return q;
    case 'L':
      return q.mul(1000);
    case 'mL':
      return q;
    case 'unit':
      return q;
    default:
      throw new Error(`Unsupported unit for base conversion: ${unit}`);
  }
}

/**
 * Converts a base quantity (in base unit) to a target unit.
 * @param baseQuantity The quantity in the base unit (g, mL, unit)
 * @param targetUnit The unit to convert to (e.g., 'g', 'kg', 'mL', 'L', 'unit')
 */
export function convertFromBaseUnit(baseQuantity: number | string | Decimal, targetUnit: string): Decimal {
  const bq = new Decimal(baseQuantity);
  const normalizedUnit = targetUnit.trim();

  switch (normalizedUnit) {
    case 'kg':
      return bq.div(1000);
    case 'g':
      return bq;
    case 'L':
      return bq.div(1000);
    case 'mL':
      return bq;
    case 'unit':
      return bq;
    default:
      throw new Error(`Unsupported unit for target conversion: ${targetUnit}`);
  }
}

/**
 * Calculates the total price for a given base quantity and base price.
 * Since both are in base units, price = baseQuantity * basePrice.
 * @param baseQuantity Quantity in base unit (e.g., grams, mL, units)
 * @param basePrice Price per base unit (e.g., price per gram, price per mL, price per unit)
 */
export function calculatePrice(baseQuantity: number | string | Decimal, basePrice: number | string | Decimal): Decimal {
  const bq = new Decimal(baseQuantity);
  const bp = new Decimal(basePrice);
  return bq.mul(bp);
}
