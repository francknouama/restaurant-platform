// Mock for @restaurant/shared-state
export const useRestaurantEvents = () => ({
  emitOrderCreated: jest.fn(),
  onMenuItemUpdated: jest.fn(() => jest.fn()),
});