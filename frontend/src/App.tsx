import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout
import RestaurantLayout from './components/layout/RestaurantLayout';

// Pages
import RestaurantDashboard from './pages/RestaurantDashboard';
import MenuManagement from './pages/MenuManagement';
import OrderProcessing from './pages/OrderProcessing';
import KitchenDashboard from './pages/KitchenDashboard';
import ReservationManagement from './pages/ReservationManagement';

const InventoryManagement: React.FC = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Inventory Management</h1>
    <p className="text-gray-600">Stock and supplier management - coming in Phase 4...</p>
    <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-purple-900">Planned Features:</h3>
      <ul className="mt-2 text-sm text-purple-700 list-disc list-inside space-y-1">
        <li>Stock level monitoring</li>
        <li>Supplier management</li>
        <li>Reorder alerts and automation</li>
        <li>Waste tracking functionality</li>
      </ul>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RestaurantLayout />}>
          <Route index element={<RestaurantDashboard />} />
          <Route path="menus/*" element={<MenuManagement />} />
          <Route path="orders/*" element={<OrderProcessing />} />
          <Route path="kitchen" element={<KitchenDashboard />} />
          <Route path="reservations" element={<ReservationManagement />} />
          <Route path="inventory" element={<InventoryManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;