// Mock for @restaurant/shared-state
export const useRestaurantEvents = () => ({
  onOrderCreated: jest.fn(() => jest.fn()),
  onOrderUpdated: jest.fn(() => jest.fn()),
  emitOrderUpdated: jest.fn(),
  onMenuItemUpdated: jest.fn(() => jest.fn()),
  emitKitchenUpdate: jest.fn(),
});