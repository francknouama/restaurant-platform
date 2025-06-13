import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import pages - will create these next
import MenuListPage from './pages/MenuListPage';
import MenuEditorPage from './pages/MenuEditorPage';
import MenuPreviewPage from './pages/MenuPreviewPage';
import ItemListPage from './pages/ItemListPage';
import ItemEditorPage from './pages/ItemEditorPage';
import ItemCreationPage from './pages/ItemCreationPage';
import CategoryListPage from './pages/CategoryListPage';
import CategoryEditorPage from './pages/CategoryEditorPage';
import MenuAnalyticsPage from './pages/MenuAnalyticsPage';

const MenuRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Default redirect to menu list */}
      <Route path="/" element={<Navigate to="/menu" replace />} />
      
      {/* Menu Management Routes */}
      <Route path="/menu" element={<MenuListPage />} />
      <Route path="/menu/edit/:menuId" element={<MenuEditorPage />} />
      <Route path="/menu/preview/:menuId" element={<MenuPreviewPage />} />
      
      {/* Item Management Routes */}
      <Route path="/menu/items" element={<ItemListPage />} />
      <Route path="/menu/items/new" element={<ItemCreationPage />} />
      <Route path="/menu/items/edit/:itemId" element={<ItemEditorPage />} />
      
      {/* Category Management Routes */}
      <Route path="/menu/categories" element={<CategoryListPage />} />
      <Route path="/menu/categories/edit/:categoryId" element={<CategoryEditorPage />} />
      
      {/* Analytics Routes */}
      <Route path="/menu/analytics" element={<MenuAnalyticsPage />} />
      
      {/* Catch all - redirect to menu list */}
      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
};

export default MenuRoutes;