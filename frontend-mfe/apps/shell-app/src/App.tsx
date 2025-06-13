import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from '@restaurant/shared-ui';
import { PermissionResources, PermissionActions } from '@restaurant/shared-utils';

// Layouts
import AppLayout from './layouts/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import MfeLoader from './components/MfeLoader';

// Notification component
import NotificationContainer from './components/NotificationContainer';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <NotificationContainer />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route index element={<DashboardPage />} />

              {/* Menu MFE */}
              <Route
                path="menu/*"
                element={
                  <MfeLoader
                    mfeName="Menu Management"
                    moduleName="menuMfe/Menu"
                    componentPath="default"
                    resource={PermissionResources.MENU}
                    action={PermissionActions.READ}
                  />
                }
              />

              {/* Orders MFE */}
              <Route
                path="orders/*"
                element={
                  <MfeLoader
                    mfeName="Order Processing"
                    moduleName="ordersMfe/Orders"
                    componentPath="OrdersApp"
                    resource={PermissionResources.ORDER}
                    action={PermissionActions.READ}
                  />
                }
              />

              {/* Kitchen MFE */}
              <Route
                path="kitchen/*"
                element={
                  <MfeLoader
                    mfeName="Kitchen Operations"
                    moduleName="kitchenMfe/Kitchen"
                    componentPath="KitchenApp"
                    resource={PermissionResources.KITCHEN}
                    action={PermissionActions.READ}
                  />
                }
              />

              {/* Reservations MFE */}
              <Route
                path="reservations/*"
                element={
                  <MfeLoader
                    mfeName="Reservation System"
                    moduleName="reservationsMfe/Reservations"
                    componentPath="ReservationsApp"
                    resource={PermissionResources.RESERVATION}
                    action={PermissionActions.READ}
                  />
                }
              />

              {/* Inventory MFE */}
              <Route
                path="inventory/*"
                element={
                  <MfeLoader
                    mfeName="Inventory Management"
                    moduleName="inventoryMfe/Inventory"
                    componentPath="InventoryApp"
                    resource={PermissionResources.INVENTORY}
                    action={PermissionActions.READ}
                  />
                }
              />

              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;