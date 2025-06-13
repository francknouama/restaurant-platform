// Central export for all restaurant API services

export { default as menuApi } from './menuApi';
export { default as orderApi } from './orderApi';
export { default as kitchenApi } from './kitchenApi';
export { reservationApi } from './reservationApi';

// Re-export the main API client for custom requests
export { apiClient, authenticatedRequest } from '../apiClient';

// Common API utilities
export * from '../apiClient';