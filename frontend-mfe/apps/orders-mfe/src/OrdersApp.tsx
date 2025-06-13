import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@restaurant/shared-ui';

// Import all page components
import OrderDashboardPage from './pages/OrderDashboardPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import NewOrderPage from './pages/NewOrderPage';
import QuickOrderPage from './pages/QuickOrderPage';
import CustomerLookupPage from './pages/CustomerLookupPage';
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';

// Import styles
import './styles/index.css';

const OrdersApp: React.FC = () => {
  return (
    <ErrorBoundary mfeName="Orders MFE">
      <div className="orders-mfe h-full">
        <Routes>
          {/* Order Management Routes */}
          <Route path="/" element={<OrderDashboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="/history" element={<OrderHistoryPage />} />
          
          {/* Order Creation Routes */}
          <Route path="/new" element={<NewOrderPage />} />
          <Route path="/quick" element={<QuickOrderPage />} />
          
          {/* Customer Management Routes */}
          <Route path="/customers" element={<CustomerLookupPage />} />
          <Route path="/customers/:customerId" element={<CustomerDetailsPage />} />
          
          {/* Payment Routes */}
          <Route path="/payments" element={<PaymentHistoryPage />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};

export default OrdersApp;