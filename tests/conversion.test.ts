import { describe, it, expect } from 'vitest';
import { convertToBaseUnit, convertFromBaseUnit, calculatePrice } from '../src/lib/conversion';
import { Decimal } from 'decimal.js';

describe('Unit Conversion Engine', () => {
  describe('convertToBaseUnit', () => {
    it('should convert kg to grams correctly', () => {
      expect(convertToBaseUnit(1, 'kg').toString()).toBe('1000');
      expect(convertToBaseUnit(2.5, 'kg').toString()).toBe('2500');
      expect(convertToBaseUnit(0.12345, 'kg').toString()).toBe('123.45');
    });

    it('should convert grams to grams with no changes', () => {
      expect(convertToBaseUnit(500, 'g').toString()).toBe('500');
      expect(convertToBaseUnit(1.54321, 'g').toString()).toBe('1.54321');
    });

    it('should convert L to mL correctly', () => {
      expect(convertToBaseUnit(1, 'L').toString()).toBe('1000');
      expect(convertToBaseUnit(0.5, 'L').toString()).toBe('500');
      expect(convertToBaseUnit(2.34567, 'L').toString()).toBe('2345.67');
    });

    it('should convert mL to mL with no changes', () => {
      expect(convertToBaseUnit(250, 'mL').toString()).toBe('250');
      expect(convertToBaseUnit(0.98765, 'mL').toString()).toBe('0.98765');
    });

    it('should keep count units as units', () => {
      expect(convertToBaseUnit(10, 'unit').toString()).toBe('10');
      expect(convertToBaseUnit(1, 'unit').toString()).toBe('1');
    });

    it('should throw error for unsupported units', () => {
      expect(() => convertToBaseUnit(10, 'unknown')).toThrow();
    });
  });

  describe('convertFromBaseUnit', () => {
    it('should convert grams to kg correctly', () => {
      expect(convertFromBaseUnit(1000, 'kg').toString()).toBe('1');
      expect(convertFromBaseUnit(2500, 'kg').toString()).toBe('2.5');
      expect(convertFromBaseUnit(123.45, 'kg').toString()).toBe('0.12345');
    });

    it('should convert grams to grams with no changes', () => {
      expect(convertFromBaseUnit(500, 'g').toString()).toBe('500');
    });

    it('should convert mL to L correctly', () => {
      expect(convertFromBaseUnit(1000, 'L').toString()).toBe('1');
      expect(convertFromBaseUnit(500, 'L').toString()).toBe('0.5');
      expect(convertFromBaseUnit(2345.67, 'L').toString()).toBe('2.34567');
    });

    it('should convert mL to mL with no changes', () => {
      expect(convertFromBaseUnit(250, 'mL').toString()).toBe('250');
    });

    it('should keep count units as units', () => {
      expect(convertFromBaseUnit(10, 'unit').toString()).toBe('10');
    });

    it('should throw error for unsupported units', () => {
      expect(() => convertFromBaseUnit(10, 'invalid')).toThrow();
    });
  });

  describe('calculatePrice', () => {
    it('should calculate price accurately without floating point issues', () => {
      // Sugar: 2500 g (2.5 kg) at ₹0.08 per gram = ₹200.00
      const baseQuantity = convertToBaseUnit(2.5, 'kg'); // 2500
      const basePrice = 0.08;
      const price = calculatePrice(baseQuantity, basePrice);
      expect(price.toString()).toBe('200');

      // Citric acid: 1.12345 kg (1123.45 g) at ₹0.18 per gram = ₹202.221
      const citricQty = convertToBaseUnit(1.12345, 'kg'); // 1123.45
      const citricPrice = 0.18;
      const citricCost = calculatePrice(citricQty, citricPrice);
      expect(citricCost.toString()).toBe('202.221');
    });
  });
});
