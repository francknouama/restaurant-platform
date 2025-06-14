require('@testing-library/jest-dom');

// Mock console methods in development
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  
  // Mock console.log for development logs
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  
  // Clean up any running timers
  if (jest.isMockFunction(setTimeout)) {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  }
});

// Mock Date.now for consistent testing
global.Date.now = jest.fn(() => 1640995200000); // Fixed timestamp: 2022-01-01 00:00:00 UTC