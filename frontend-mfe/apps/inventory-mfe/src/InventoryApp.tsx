import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@restaurant/shared-ui';
import InventoryRoutes from './routes';
import InventoryLayout from './components/layout/InventoryLayout';

const InventoryApp: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-neutral-50">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">
              Inventory System Error
            </div>
            <div className="text-neutral-600 text-sm">
              Something went wrong with the inventory management system.
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      }
    >
      <InventoryLayout>
        <Routes>
          <Route path="/*" element={<InventoryRoutes />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </InventoryLayout>
    </ErrorBoundary>
  );
};

export default InventoryApp;