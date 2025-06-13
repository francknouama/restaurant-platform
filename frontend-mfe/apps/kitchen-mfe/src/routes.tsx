import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import all page components
import KitchenQueuePage from './pages/KitchenQueuePage';
import OrderPreparationPage from './pages/OrderPreparationPage';
import StationManagementPage from './pages/StationManagementPage';
import KitchenAnalyticsPage from './pages/KitchenAnalyticsPage';
import TimerManagementPage from './pages/TimerManagementPage';
import RecipeBoardPage from './pages/RecipeBoardPage';

export const KitchenRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Kitchen Queue Routes */}
      <Route path="/" element={<KitchenQueuePage />} />
      <Route path="/queue" element={<Navigate to="/" replace />} />
      
      {/* Order Preparation Routes */}
      <Route path="/preparation/:orderId" element={<OrderPreparationPage />} />
      <Route path="/preparation" element={<OrderPreparationPage />} />
      
      {/* Station Management Routes */}
      <Route path="/stations" element={<StationManagementPage />} />
      <Route path="/stations/:stationId" element={<StationManagementPage />} />
      
      {/* Kitchen Analytics Routes */}
      <Route path="/analytics" element={<KitchenAnalyticsPage />} />
      
      {/* Timer Management Routes */}
      <Route path="/timers" element={<TimerManagementPage />} />
      
      {/* Recipe Board Routes */}
      <Route path="/recipes" element={<RecipeBoardPage />} />
      <Route path="/recipes/:itemId" element={<RecipeBoardPage />} />
      
      {/* Catch all - redirect to kitchen queue */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default KitchenRoutes;