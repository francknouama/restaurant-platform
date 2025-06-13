# Restaurant Platform - Micro-Frontend Architecture

## Overview

This is the micro-frontend implementation of the Restaurant Platform, built with Module Federation and React. The system is divided into multiple independent micro-frontends that work together seamlessly.

## Architecture

### Shell Application (Port 3000)
The main host application that:
- Handles authentication and authorization
- Provides the main layout and navigation
- Orchestrates loading of micro-frontends
- Manages global state and cross-MFE communication

### Micro-Frontends
- **Menu MFE** (Port 3001): Menu management functionality
- **Orders MFE** (Port 3002): Order processing and management
- **Kitchen MFE** (Port 3003): Kitchen operations and order preparation
- **Reservations MFE** (Port 3004): Table booking and management
- **Inventory MFE** (Port 3005): Stock and supplier management

### Shared Packages
- **@restaurant/shared-ui**: Common UI components and design system
- **@restaurant/shared-utils**: Utilities, types, and API clients
- **@restaurant/shared-state**: Cross-MFE state management and event bus
- **@restaurant/mfe-tools**: Build tools and Module Federation utilities

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- Backend services running on port 8080

### Installation
```bash
# Install dependencies
pnpm install

# Copy environment variables
cp apps/shell-app/.env.example apps/shell-app/.env
```

### Development

#### Start all MFEs in parallel:
```bash
pnpm dev
```

#### Start individual MFEs:
```bash
pnpm dev:shell      # Shell app only
pnpm dev:menu       # Menu MFE only
pnpm dev:orders     # Orders MFE only
# ... etc
```

### Building for Production
```bash
pnpm build
```

## Authentication & Authorization

The platform implements a comprehensive RBAC system matching the backend:

### Roles
- **Admin**: Full system access
- **Manager**: Operational management access
- **Kitchen Staff**: Kitchen and order access
- **Wait Staff**: Order and customer service access
- **Host**: Reservation and seating access
- **Cashier**: Payment and order completion access

### Protected Routes
All routes are protected and check permissions before rendering. The shell app handles:
- JWT token management with automatic refresh
- Session validation
- Permission-based route guards
- MFE access control

## Development Workflow

### Adding a New Component to Shared UI
1. Create component in `packages/shared-ui/src/components/`
2. Export from `packages/shared-ui/src/components/index.ts`
3. Build the package: `pnpm --filter @restaurant/shared-ui build`
4. Use in any MFE: `import { MyComponent } from '@restaurant/shared-ui'`

### Cross-MFE Communication
Use the event bus from `@restaurant/shared-state`:

```typescript
import { eventBus } from '@restaurant/shared-state';

// Emit event
eventBus.emit('order:created', { orderId: '123' });

// Listen for events
eventBus.on('order:created', (event) => {
  console.log('New order:', event.payload);
});
```

### API Integration
All API calls go through the shared API client:

```typescript
import { apiClient } from '@restaurant/shared-utils';

const response = await apiClient.get('/orders');
```

## Troubleshooting

### MFE Not Loading
1. Ensure the MFE is running on its designated port
2. Check browser console for CORS errors
3. Verify Module Federation configuration

### Authentication Issues
1. Ensure backend is running on port 8080
2. Check JWT token in localStorage
3. Verify API proxy configuration in webpack

### Build Errors
1. Clear all node_modules: `pnpm clean`
2. Reinstall dependencies: `pnpm install`
3. Rebuild shared packages: `pnpm build:shared`

## Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
pnpm test:e2e
```

## Deployment

Each MFE can be deployed independently:

1. Build the MFE: `pnpm --filter @restaurant/menu-mfe build`
2. Deploy the dist folder to your CDN/hosting
3. Update the remote URL in shell app configuration

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request

## License

MIT