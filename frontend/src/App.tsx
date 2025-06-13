import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout
import RestaurantLayout from './components/layout/RestaurantLayout';

// Pages
import RestaurantDashboard from './pages/RestaurantDashboard';
import MenuManagement from './pages/MenuManagement';
import OrderProcessing from './pages/OrderProcessing';
import KitchenDashboard from './pages/KitchenDashboard';
import ReservationManagement from './pages/ReservationManagement';
import InventoryManagement from './pages/InventoryManagement';

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