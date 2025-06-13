import React from 'react';
import { Outlet } from 'react-router-dom';
import RestaurantSidebar from './RestaurantSidebar';
import RestaurantHeader from './RestaurantHeader';

const RestaurantLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <RestaurantSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <RestaurantHeader />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default RestaurantLayout;