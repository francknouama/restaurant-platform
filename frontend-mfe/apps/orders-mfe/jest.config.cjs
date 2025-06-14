module.exports = {
  testEnvironment: 'node',
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
  ],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '@restaurant/shared-ui': '<rootDir>/src/__mocks__/shared-ui.js',
    '@restaurant/shared-state': '<rootDir>/src/__mocks__/shared-state.js',
    '@restaurant/shared-utils': '<rootDir>/src/__mocks__/shared-utils.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@restaurant|lucide-react|date-fns|clsx)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/__mocks__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['lcov', 'text', 'text-summary'],
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 10000
};