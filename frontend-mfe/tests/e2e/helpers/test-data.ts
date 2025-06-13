export const testMenuItems = [
  {
    id: 'burger-supreme',
    name: 'Burger Supreme',
    price: 12.99,
    category: 'Burgers',
    available: true,
  },
  {
    id: 'margherita-pizza',
    name: 'Margherita Pizza',
    price: 14.99,
    category: 'Pizza',
    available: true,
  },
  {
    id: 'caesar-salad',
    name: 'Caesar Salad',
    price: 8.99,
    category: 'Salads',
    available: true,
  },
  {
    id: 'grilled-salmon',
    name: 'Grilled Salmon',
    price: 18.99,
    category: 'Seafood',
    available: true,
  },
];

export const testCustomers = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-0101',
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '555-0102',
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    phone: '555-0103',
  },
];

export const testTables = [
  { number: 1, capacity: 2, location: 'Window' },
  { number: 2, capacity: 4, location: 'Center' },
  { number: 3, capacity: 6, location: 'Private' },
  { number: 4, capacity: 8, location: 'Patio' },
];

export const testInventoryItems = [
  {
    name: 'Beef Patties',
    category: 'Meat',
    currentStock: 50,
    minimumStock: 20,
    unit: 'lbs',
  },
  {
    name: 'Pizza Dough',
    category: 'Ingredients',
    currentStock: 25,
    minimumStock: 10,
    unit: 'portions',
  },
  {
    name: 'Lettuce',
    category: 'Vegetables',
    currentStock: 15,
    minimumStock: 5,
    unit: 'heads',
  },
];

export const testSuppliers = [
  {
    name: 'Premium Foods Co.',
    contact: 'supplier@premiumfoods.com',
    phone: '555-1001',
    products: ['Meat', 'Seafood'],
  },
  {
    name: 'Fresh Vegetables Ltd.',
    contact: 'orders@freshveggies.com',
    phone: '555-1002',
    products: ['Vegetables', 'Herbs'],
  },
];

export function generateTestOrder(overrides: Partial<any> = {}) {
  return {
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '555-0000',
    orderType: 'DINE_IN',
    tableNumber: 1,
    items: [
      {
        menuItemId: 'burger-supreme',
        quantity: 1,
        specialInstructions: '',
      },
    ],
    ...overrides,
  };
}

export function generateTestReservation(overrides: Partial<any> = {}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    customerName: 'Test Reservation',
    customerEmail: 'reservation@example.com',
    customerPhone: '555-0000',
    partySize: 4,
    date: tomorrow.toISOString().split('T')[0],
    time: '19:00',
    specialRequests: '',
    ...overrides,
  };
}