# MFE Deployment Guide

This guide provides instructions for deploying the Restaurant Platform Micro-Frontend applications.

## Architecture Overview

The restaurant platform consists of multiple micro-frontends:
- **Shell App**: Main container application
- **Menu MFE**: Menu management
- **Orders MFE**: Order processing
- **Kitchen MFE**: Kitchen operations
- **Inventory MFE**: Inventory management
- **Reservations MFE**: Reservation system

## Deployment Options

### 1. AWS S3 + CloudFront

```bash
# Deploy script example
aws s3 sync ./dist s3://restaurant-mfe-bucket/shell-app --delete
aws cloudfront create-invalidation --distribution-id EXXX --paths "/*"
```

### 2. Vercel

Each MFE can be deployed as a separate Vercel project:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "framework": null
}
```

### 3. Docker + Kubernetes

See `docker/` directory for Dockerfile examples for each MFE.

## Environment Variables

Each MFE requires the following environment variables:

```bash
# Shell App
VITE_SHELL_PORT=3000
VITE_API_BASE_URL=https://api.restaurant.com

# All MFEs
VITE_MENU_MFE_URL=https://menu.restaurant.com
VITE_ORDERS_MFE_URL=https://orders.restaurant.com
VITE_KITCHEN_MFE_URL=https://kitchen.restaurant.com
VITE_INVENTORY_MFE_URL=https://inventory.restaurant.com
VITE_RESERVATIONS_MFE_URL=https://reservations.restaurant.com
```

## CI/CD Pipeline

The GitHub Actions workflow (`../.github/workflows/frontend-mfe.yml`) handles:

1. **Build**: Compiles all MFEs
2. **Test**: Runs unit and integration tests
3. **Deploy Preview**: Creates preview deployments for PRs
4. **Deploy Production**: Deploys to production on merge to main

## Module Federation Configuration

Each MFE exposes components via Module Federation:

```javascript
// Example webpack.config.js
new ModuleFederationPlugin({
  name: 'menuMFE',
  filename: 'remoteEntry.js',
  exposes: {
    './MenuApp': './src/MenuApp'
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    'react-router-dom': { singleton: true }
  }
})
```

## Deployment Checklist

- [ ] Build all shared packages first
- [ ] Build each MFE with production configuration
- [ ] Update environment variables for production URLs
- [ ] Deploy shared assets to CDN
- [ ] Deploy each MFE to its designated URL
- [ ] Update shell app with production MFE URLs
- [ ] Test cross-MFE communication
- [ ] Verify all routes work correctly
- [ ] Check browser console for errors
- [ ] Test on multiple devices/browsers

## Rollback Strategy

1. Keep previous build artifacts
2. Use versioned deployments (e.g., `/v1.2.3/`)
3. Implement feature flags for gradual rollout
4. Monitor error rates after deployment

## Monitoring

Recommended monitoring setup:
- Application Performance Monitoring (APM)
- Error tracking (e.g., Sentry)
- Real User Monitoring (RUM)
- Synthetic monitoring for critical paths

## Security Considerations

- Enable CORS for cross-MFE communication
- Implement CSP headers
- Use HTTPS for all deployments
- Sanitize user inputs
- Implement authentication at shell level