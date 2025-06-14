require('@testing-library/jest-dom');

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  
  // Suppress React Router warnings in tests
  console.error = jest.fn((message) => {
    if (message && message.includes && message.includes('Router')) {
      return;
    }
    originalConsoleError(message);
  });
  
  console.warn = jest.fn((message) => {
    if (message && message.includes && message.includes('Router')) {
      return;
    }
    originalConsoleWarn(message);
  });
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clean up any running timers
  if (jest.isMockFunction(setTimeout)) {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  }
});

// Mock Date.now for consistent testing
global.Date.now = jest.fn(() => 1640995200000); // Fixed timestamp: 2022-01-01 00:00:00 UTC

// Mock ResizeObserver for components that might use it
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for components that might use it
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});