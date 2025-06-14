import {
  formatPrice,
  formatSimplePrice,
  parsePrice,
  calculateDiscount,
  applyDiscount,
  calculatePriceWithTax,
  roundPrice,
  calculateTotal,
  formatPriceRange,
  isValidPrice,
  comparePrices,
  getPriceTier
} from '../priceUtils';

describe('priceUtils', () => {
  describe('formatPrice', () => {
    it('should format price as USD currency by default', () => {
      expect(formatPrice(12.99)).toBe('$12.99');
      expect(formatPrice(0)).toBe('$0.00');
      expect(formatPrice(1000.50)).toBe('$1,000.50');
    });

    it('should format price with different currencies', () => {
      expect(formatPrice(12.99, 'EUR')).toMatch(/€12\.99|12\.99\s*€/);
      expect(formatPrice(12.99, 'GBP')).toMatch(/£12\.99/);
    });

    it('should handle decimal places correctly', () => {
      expect(formatPrice(12.9)).toBe('$12.90');
      expect(formatPrice(12)).toBe('$12.00');
      expect(formatPrice(12.999)).toBe('$12.00'); // Should round down
    });

    it('should throw error for invalid price', () => {
      expect(() => formatPrice(NaN)).toThrow('Price must be a valid number');
      expect(() => formatPrice('invalid' as any)).toThrow('Price must be a valid number');
    });
  });

  describe('formatSimplePrice', () => {
    it('should format price as simple dollar amount', () => {
      expect(formatSimplePrice(12.99)).toBe('$12.99');
      expect(formatSimplePrice(0)).toBe('$0.00');
      expect(formatSimplePrice(1000.50)).toBe('$1000.50');
    });

    it('should handle decimal places correctly', () => {
      expect(formatSimplePrice(12.9)).toBe('$12.90');
      expect(formatSimplePrice(12)).toBe('$12.00');
    });

    it('should throw error for invalid price', () => {
      expect(() => formatSimplePrice(NaN)).toThrow('Price must be a valid number');
      expect(() => formatSimplePrice('invalid' as any)).toThrow('Price must be a valid number');
    });
  });

  describe('parsePrice', () => {
    it('should parse valid price strings', () => {
      expect(parsePrice('$12.99')).toBe(12.99);
      expect(parsePrice('12.99')).toBe(12.99);
      expect(parsePrice('$1,234.56')).toBe(1234.56);
      expect(parsePrice(' $15.00 ')).toBe(15.00);
    });

    it('should handle different formats', () => {
      expect(parsePrice('$12')).toBe(12);
      expect(parsePrice('12')).toBe(12);
      expect(parsePrice('0')).toBe(0);
    });

    it('should throw error for invalid input', () => {
      expect(() => parsePrice('invalid')).toThrow('Invalid price format');
      expect(() => parsePrice('')).toThrow('Invalid price format');
      expect(() => parsePrice('$')).toThrow('Invalid price format');
      expect(() => parsePrice(123 as any)).toThrow('Price string must be a string');
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate discount amount correctly', () => {
      expect(calculateDiscount(100, 10)).toBe(10);
      expect(calculateDiscount(50, 20)).toBe(10);
      expect(calculateDiscount(25.99, 15)).toBeCloseTo(3.8985);
    });

    it('should handle edge cases', () => {
      expect(calculateDiscount(100, 0)).toBe(0);
      expect(calculateDiscount(100, 100)).toBe(100);
      expect(calculateDiscount(0, 50)).toBe(0);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => calculateDiscount('100' as any, 10)).toThrow('Both price and discount must be numbers');
      expect(() => calculateDiscount(100, '10' as any)).toThrow('Both price and discount must be numbers');
      expect(() => calculateDiscount(100, -10)).toThrow('Discount percentage must be between 0 and 100');
      expect(() => calculateDiscount(100, 150)).toThrow('Discount percentage must be between 0 and 100');
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount correctly', () => {
      expect(applyDiscount(100, 10)).toBe(90);
      expect(applyDiscount(50, 20)).toBe(40);
      expect(applyDiscount(25.99, 15)).toBeCloseTo(22.0915);
    });

    it('should handle edge cases', () => {
      expect(applyDiscount(100, 0)).toBe(100);
      expect(applyDiscount(100, 100)).toBe(0);
    });
  });

  describe('calculatePriceWithTax', () => {
    it('should calculate price with tax correctly', () => {
      expect(calculatePriceWithTax(100, 10)).toBe(110);
      expect(calculatePriceWithTax(50, 8.25)).toBe(54.125);
      expect(calculatePriceWithTax(25.99, 7.5)).toBeCloseTo(27.939);
    });

    it('should handle zero tax', () => {
      expect(calculatePriceWithTax(100, 0)).toBe(100);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => calculatePriceWithTax('100' as any, 10)).toThrow('Both price and tax rate must be numbers');
      expect(() => calculatePriceWithTax(100, '10' as any)).toThrow('Both price and tax rate must be numbers');
      expect(() => calculatePriceWithTax(100, -5)).toThrow('Tax rate cannot be negative');
    });
  });

  describe('roundPrice', () => {
    it('should round price to nearest cent', () => {
      expect(roundPrice(12.995)).toBe(13);
      expect(roundPrice(12.994)).toBe(12.99);
      expect(roundPrice(12.991)).toBe(12.99);
      expect(roundPrice(12.999)).toBe(13);
    });

    it('should handle whole numbers', () => {
      expect(roundPrice(12)).toBe(12);
      expect(roundPrice(12.00)).toBe(12);
    });

    it('should throw error for invalid price', () => {
      expect(() => roundPrice(NaN)).toThrow('Price must be a valid number');
      expect(() => roundPrice('invalid' as any)).toThrow('Price must be a valid number');
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total for multiple items', () => {
      const items = [
        { price: 10.99, quantity: 2 },
        { price: 5.50, quantity: 1 },
        { price: 8.25, quantity: 3 }
      ];
      
      const expectedTotal = (10.99 * 2) + (5.50 * 1) + (8.25 * 3);
      expect(calculateTotal(items)).toBeCloseTo(expectedTotal);
    });

    it('should handle empty array', () => {
      expect(calculateTotal([])).toBe(0);
    });

    it('should handle single item', () => {
      const items = [{ price: 15.99, quantity: 1 }];
      expect(calculateTotal(items)).toBe(15.99);
    });

    it('should handle zero quantities', () => {
      const items = [
        { price: 10.99, quantity: 0 },
        { price: 5.50, quantity: 2 }
      ];
      expect(calculateTotal(items)).toBe(11.00);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => calculateTotal('invalid' as any)).toThrow('Items must be an array');
      
      const invalidItems = [{ price: 'invalid', quantity: 1 }];
      expect(() => calculateTotal(invalidItems as any)).toThrow('Each item must have numeric price and quantity');
      
      const invalidQuantity = [{ price: 10.99, quantity: 'invalid' }];
      expect(() => calculateTotal(invalidQuantity as any)).toThrow('Each item must have numeric price and quantity');
    });
  });

  describe('formatPriceRange', () => {
    it('should format price range correctly', () => {
      expect(formatPriceRange(10, 25)).toBe('$10.00 - $25.00');
      expect(formatPriceRange(5.99, 15.99)).toBe('$5.99 - $15.99');
    });

    it('should handle same prices', () => {
      expect(formatPriceRange(15, 15)).toBe('$15.00');
    });

    it('should throw error for invalid ranges', () => {
      expect(() => formatPriceRange(25, 10)).toThrow('Minimum price cannot be greater than maximum price');
      expect(() => formatPriceRange('10' as any, 25)).toThrow('Both prices must be numbers');
      expect(() => formatPriceRange(10, '25' as any)).toThrow('Both prices must be numbers');
    });
  });

  describe('isValidPrice', () => {
    it('should validate correct prices', () => {
      expect(isValidPrice(10.99)).toBe(true);
      expect(isValidPrice(0)).toBe(true);
      expect(isValidPrice(1000)).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(isValidPrice(-5)).toBe(false);
      expect(isValidPrice(NaN)).toBe(false);
      expect(isValidPrice('10.99' as any)).toBe(false);
      expect(isValidPrice(null as any)).toBe(false);
      expect(isValidPrice(undefined as any)).toBe(false);
    });
  });

  describe('comparePrices', () => {
    it('should compare prices correctly for sorting', () => {
      expect(comparePrices(10, 20)).toBeLessThan(0);
      expect(comparePrices(20, 10)).toBeGreaterThan(0);
      expect(comparePrices(15, 15)).toBe(0);
    });

    it('should handle decimal comparisons', () => {
      expect(comparePrices(10.99, 11.00)).toBeLessThan(0);
      expect(comparePrices(11.01, 11.00)).toBeGreaterThan(0);
    });

    it('should throw error for invalid prices', () => {
      expect(() => comparePrices(NaN, 10)).toThrow('Both values must be valid prices');
      expect(() => comparePrices(10, -5)).toThrow('Both values must be valid prices');
      expect(() => comparePrices('10' as any, 15)).toThrow('Both values must be valid prices');
    });

    it('should work with Array.sort', () => {
      const prices = [25.99, 10.50, 15.75, 8.25];
      const sorted = prices.sort(comparePrices);
      
      expect(sorted).toEqual([8.25, 10.50, 15.75, 25.99]);
    });
  });

  describe('getPriceTier', () => {
    it('should categorize budget prices correctly', () => {
      expect(getPriceTier(5.99)).toBe('budget');
      expect(getPriceTier(10.00)).toBe('budget');
      expect(getPriceTier(14.99)).toBe('budget');
    });

    it('should categorize moderate prices correctly', () => {
      expect(getPriceTier(15.00)).toBe('moderate');
      expect(getPriceTier(20.00)).toBe('moderate');
      expect(getPriceTier(24.99)).toBe('moderate');
    });

    it('should categorize premium prices correctly', () => {
      expect(getPriceTier(25.00)).toBe('premium');
      expect(getPriceTier(30.00)).toBe('premium');
      expect(getPriceTier(39.99)).toBe('premium');
    });

    it('should categorize luxury prices correctly', () => {
      expect(getPriceTier(40.00)).toBe('luxury');
      expect(getPriceTier(50.00)).toBe('luxury');
      expect(getPriceTier(100.00)).toBe('luxury');
    });

    it('should handle edge cases', () => {
      expect(getPriceTier(0)).toBe('budget');
      expect(getPriceTier(15)).toBe('moderate');
      expect(getPriceTier(25)).toBe('premium');
      expect(getPriceTier(40)).toBe('luxury');
    });

    it('should throw error for invalid price', () => {
      expect(() => getPriceTier(-5)).toThrow('Price must be a valid number');
      expect(() => getPriceTier(NaN)).toThrow('Price must be a valid number');
      expect(() => getPriceTier('15' as any)).toThrow('Price must be a valid number');
    });
  });

  describe('Integration Tests', () => {
    it('should work together for complex calculations', () => {
      const originalPrice = 25.99;
      const discountPercent = 15;
      const taxRate = 8.25;
      
      // Apply discount then tax
      const discountedPrice = applyDiscount(originalPrice, discountPercent);
      const finalPrice = calculatePriceWithTax(discountedPrice, taxRate);
      const roundedPrice = roundPrice(finalPrice);
      
      expect(roundedPrice).toBeCloseTo(23.9);
      expect(formatSimplePrice(roundedPrice)).toBe('$23.90');
      expect(getPriceTier(roundedPrice)).toBe('moderate');
    });

    it('should handle restaurant order calculation', () => {
      const orderItems = [
        { price: 24.99, quantity: 2 }, // Main courses
        { price: 8.50, quantity: 1 },  // Appetizer
        { price: 6.99, quantity: 3 }   // Drinks
      ];
      
      const subtotal = calculateTotal(orderItems);
      const taxAmount = calculateDiscount(subtotal, 8.25); // Tax calculated as discount
      const totalWithTax = subtotal + taxAmount;
      const finalTotal = roundPrice(totalWithTax);
      
      expect(subtotal).toBeCloseTo(79.45);
      expect(finalTotal).toBeCloseTo(85.01);
      expect(formatPrice(finalTotal)).toBe('$85.01');
    });
  });
});