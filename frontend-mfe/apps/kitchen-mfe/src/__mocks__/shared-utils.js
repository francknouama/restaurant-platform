// Mock for @restaurant/shared-utils
export const formatCurrency = (amount) => `$${amount.toFixed(2)}`;
export const formatDate = (date) => new Date(date).toLocaleDateString();
export const formatTime = (date) => new Date(date).toLocaleTimeString();
export const debounce = (fn, delay) => fn;