# E2E Testing with Playwright

This directory contains end-to-end tests for the Restaurant Platform using Playwright.

## Overview

Our E2E tests cover:
- **Shell App**: Authentication, navigation, and core functionality
- **Cross-MFE Communication**: Event-driven interactions between modules
- **Restaurant Workflows**: Complete business processes
- **Performance**: Load times, memory usage, and responsiveness

## Test Structure

```
tests/e2e/
├── shell-app.spec.ts              # Shell app core functionality
├── cross-mfe-communication.spec.ts # Event bus and MFE interactions
├── restaurant-workflows.spec.ts    # End-to-end business processes
├── performance.spec.ts             # Performance and load testing
├── helpers/
│   ├── auth.ts                     # Authentication utilities
│   └── test-data.ts               # Test data generators
└── README.md                      # This file
```

## Running Tests

### All E2E Tests
```bash
pnpm test:e2e
```

### With UI (Interactive Mode)
```bash
pnpm test:e2e:ui
```

### Headed Mode (See Browser)
```bash
pnpm test:e2e:headed
```

### Debug Mode
```bash
pnpm test:e2e:debug
```

### Specific Test File
```bash
pnpm test:e2e tests/e2e/shell-app.spec.ts
```

### Specific Test
```bash
pnpm test:e2e -g "should load the main shell application"
```

## Test Configuration

### Browsers
Tests run on:
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### Parallel Execution
- Tests run in parallel by default
- Configurable via `playwright.config.ts`

### Auto-Start Servers
Playwright automatically starts all MFE dev servers:
- Shell App: http://localhost:3000
- Menu MFE: http://localhost:3001
- Orders MFE: http://localhost:3002
- Kitchen MFE: http://localhost:3003
- Inventory MFE: http://localhost:3004
- Reservations MFE: http://localhost:3005

## Test Categories

### 1. Shell App Tests (`shell-app.spec.ts`)
- Application loading and initialization
- Authentication flow
- Navigation between MFEs
- Role-based access control

### 2. Cross-MFE Communication (`cross-mfe-communication.spec.ts`)
- Order creation → Kitchen queue updates
- Kitchen status → Orders status sync
- Inventory alerts → Dashboard notifications
- Reservation creation → Dashboard updates
- Menu updates → Orders availability
- Event history tracking

### 3. Restaurant Workflows (`restaurant-workflows.spec.ts`)
- Complete order lifecycle (creation → completion)
- Reservation → table assignment → order creation
- Inventory low stock → purchase order workflow
- Kitchen queue management during peak hours
- End-to-end analytics and reporting

### 4. Performance Tests (`performance.spec.ts`)
- Application load times
- MFE lazy loading efficiency
- Cross-MFE communication speed
- Concurrent user simulation
- Memory usage monitoring

## Test Helpers

### Authentication (`helpers/auth.ts`)
```typescript
import { loginAs, logout, mockAuthState } from './helpers/auth';

// Login as different user types
await loginAs(page, 'admin');
await loginAs(page, 'kitchen');
await loginAs(page, 'waitstaff');

// Mock authentication state
await mockAuthState(page, defaultUsers.admin);
```

### Test Data (`helpers/test-data.ts`)
```typescript
import { generateTestOrder, generateTestReservation } from './helpers/test-data';

const order = generateTestOrder({
  customerName: 'Custom Name',
  tableNumber: 5,
});

const reservation = generateTestReservation({
  partySize: 6,
  specialRequests: 'Anniversary dinner',
});
```

## Best Practices

### 1. Test Isolation
- Each test is independent
- Clean state between tests
- Use unique test data

### 2. Waiting Strategies
```typescript
// Wait for specific elements
await expect(page.locator('text=Order created')).toBeVisible();

// Wait for navigation
await page.waitForURL('**/dashboard');

// Wait for network idle
await page.goto('/', { waitUntil: 'networkidle' });
```

### 3. Data Test IDs
Use `data-testid` attributes for reliable element selection:
```typescript
await page.click('[data-testid="create-order-button"]');
```

### 4. Error Handling
```typescript
// Retry on failure
await expect(async () => {
  await page.click('button');
  await expect(page.locator('text=Success')).toBeVisible();
}).toPass();
```

## Debugging Tests

### 1. Visual Debugging
```bash
pnpm test:e2e:debug
```

### 2. Screenshots on Failure
Screenshots are automatically captured on test failures.

### 3. Trace Viewer
```bash
# After test failure, open trace
npx playwright show-trace test-results/path-to-trace.zip
```

### 4. Console Logs
```typescript
page.on('console', msg => console.log(msg.text()));
```

## CI/CD Integration

Tests are configured for GitHub Actions:
- Parallel execution on multiple browsers
- Artifact collection for failures
- Performance metrics reporting

### Environment Variables
- `CI=true` - Enables CI-specific configurations
- Automatic retry on failure
- GitHub Actions reporter

## Performance Monitoring

### Core Web Vitals
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

### Custom Metrics
- MFE load times
- Event processing speed
- Memory usage patterns
- Concurrent user handling

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure MFE ports (3000-3005) are available
2. **Authentication**: Check mock auth implementation
3. **Timeouts**: Increase timeout for slow operations
4. **Flaky tests**: Add proper wait conditions

### Debug Commands
```bash
# Check which ports are in use
lsof -i :3000-3005

# Run single test with verbose output
pnpm test:e2e --debug tests/e2e/shell-app.spec.ts

# Generate test report
pnpm test:e2e --reporter=html
```