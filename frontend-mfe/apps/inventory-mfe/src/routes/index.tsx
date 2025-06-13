import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load components for better performance
const InventoryDashboard = React.lazy(() => import('../pages/InventoryDashboard'));
const InventoryManagement = React.lazy(() => import('../pages/InventoryManagement'));
const ItemManagement = React.lazy(() => import('../pages/ItemManagement'));
const CategoryManagement = React.lazy(() => import('../pages/CategoryManagement'));
const StockManagement = React.lazy(() => import('../pages/StockManagement'));
const SupplierManagement = React.lazy(() => import('../pages/SupplierManagement'));
const PurchaseOrderManagement = React.lazy(() => import('../pages/PurchaseOrderManagement'));
const InventoryAnalytics = React.lazy(() => import('../pages/InventoryAnalytics'));
const AlertsPage = React.lazy(() => import('../pages/AlertsPage'));

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-neutral-600">Loading...</span>
  </div>
);

const InventoryRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<InventoryDashboard />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/items" element={<ItemManagement />} />
        <Route path="/categories" element={<CategoryManagement />} />
        <Route path="/stock" element={<StockManagement />} />
        <Route path="/suppliers" element={<SupplierManagement />} />
        <Route path="/purchase-orders" element={<PurchaseOrderManagement />} />
        <Route path="/analytics" element={<InventoryAnalytics />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="*" element={<InventoryDashboard />} />
      </Routes>
    </Suspense>
  );
};

export default InventoryRoutes;