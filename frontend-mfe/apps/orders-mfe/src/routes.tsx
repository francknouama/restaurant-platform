import React from 'react';
import { RouteObject } from 'react-router-dom';
import OrdersApp from './OrdersApp';

// Export routes configuration for shell app integration
export const ordersRoutes: RouteObject[] = [
  {
    path: '/orders/*',
    element: <OrdersApp />,
  },
];

// Export route metadata for navigation and permissions
export const ordersRouteMetadata = {
  basePath: '/orders',
  routes: [
    {
      path: '/',
      name: 'Order Dashboard',
      description: 'Active orders with filtering and management',
      permissions: ['order:read'],
      icon: 'ClipboardList'
    },
    {
      path: '/new',
      name: 'New Order',
      description: 'Create a new order for dine-in, takeout, or delivery',
      permissions: ['order:create'],
      icon: 'Plus'
    },
    {
      path: '/quick',
      name: 'Quick Order',
      description: 'Streamlined order creation for common items',
      permissions: ['order:create'],
      icon: 'Zap'
    },
    {
      path: '/history',
      name: 'Order History',
      description: 'View completed and cancelled orders',
      permissions: ['order:read'],
      icon: 'History'
    },
    {
      path: '/customers',
      name: 'Customer Lookup',
      description: 'Search and manage customer information',
      permissions: ['customer:read'],
      icon: 'Users'
    },
    {
      path: '/payments',
      name: 'Payment History',
      description: 'Transaction management and payment records',
      permissions: ['payment:read'],
      icon: 'CreditCard'
    }
  ]
};

export default ordersRoutes;