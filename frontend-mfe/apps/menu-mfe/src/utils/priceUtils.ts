/**
 * Utility functions for price formatting and calculations
 */

/**
 * Format a price as currency string
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  if (typeof price !== 'number' || isNaN(price)) {
    throw new Error('Price must be a valid number');
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format a price as a simple dollar amount (e.g., "$12.99")
 */
export function formatSimplePrice(price: number): string {
  if (typeof price !== 'number' || isNaN(price)) {
    throw new Error('Price must be a valid number');
  }

  return `$${price.toFixed(2)}`;
}

/**
 * Parse a price string to number
 */
export function parsePrice(priceString: string): number {
  if (typeof priceString !== 'string') {
    throw new Error('Price string must be a string');
  }

  // Remove currency symbols and spaces
  const cleaned = priceString.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    throw new Error('Invalid price format');
  }

  return parsed;
}

/**
 * Calculate percentage discount
 */
export function calculateDiscount(originalPrice: number, discountPercent: number): number {
  if (typeof originalPrice !== 'number' || typeof discountPercent !== 'number') {
    throw new Error('Both price and discount must be numbers');
  }

  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }

  return originalPrice * (discountPercent / 100);
}

/**
 * Apply discount to price
 */
export function applyDiscount(originalPrice: number, discountPercent: number): number {
  const discountAmount = calculateDiscount(originalPrice, discountPercent);
  return originalPrice - discountAmount;
}

/**
 * Calculate price with tax
 */
export function calculatePriceWithTax(price: number, taxRate: number): number {
  if (typeof price !== 'number' || typeof taxRate !== 'number') {
    throw new Error('Both price and tax rate must be numbers');
  }

  if (taxRate < 0) {
    throw new Error('Tax rate cannot be negative');
  }

  return price * (1 + taxRate / 100);
}

/**
 * Round price to nearest cent
 */
export function roundPrice(price: number): number {
  if (typeof price !== 'number' || isNaN(price)) {
    throw new Error('Price must be a valid number');
  }

  return Math.round(price * 100) / 100;
}

/**
 * Calculate total price for multiple items
 */
export function calculateTotal(items: Array<{ price: number; quantity: number }>): number {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  return items.reduce((total, item) => {
    if (typeof item.price !== 'number' || typeof item.quantity !== 'number') {
      throw new Error('Each item must have numeric price and quantity');
    }
    return total + (item.price * item.quantity);
  }, 0);
}

/**
 * Format price range (e.g., "$12.99 - $24.99")
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  if (typeof minPrice !== 'number' || typeof maxPrice !== 'number') {
    throw new Error('Both prices must be numbers');
  }

  if (minPrice > maxPrice) {
    throw new Error('Minimum price cannot be greater than maximum price');
  }

  if (minPrice === maxPrice) {
    return formatSimplePrice(minPrice);
  }

  return `${formatSimplePrice(minPrice)} - ${formatSimplePrice(maxPrice)}`;
}

/**
 * Validate price value
 */
export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && !isNaN(price) && price >= 0;
}

/**
 * Compare prices for sorting
 */
export function comparePrices(a: number, b: number): number {
  if (!isValidPrice(a) || !isValidPrice(b)) {
    throw new Error('Both values must be valid prices');
  }
  return a - b;
}

/**
 * Get price tier label based on price ranges
 */
export function getPriceTier(price: number): 'budget' | 'moderate' | 'premium' | 'luxury' {
  if (!isValidPrice(price)) {
    throw new Error('Price must be a valid number');
  }

  if (price < 15) return 'budget';
  if (price < 25) return 'moderate';
  if (price < 40) return 'premium';
  return 'luxury';
}