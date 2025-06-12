import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Setup fetch mock
global.fetch = vi.fn()

// Mock environment variables for testing
vi.mock('import.meta', () => ({
  env: {
    VITE_API_URL: 'http://localhost:8080/api',
    VITE_AUTH_SERVICE_URL: 'http://localhost:8081',
    VITE_USER_SERVICE_URL: 'http://localhost:8082',
    VITE_API_GATEWAY_URL: 'http://localhost:8080',
  }
}))