import React from 'react';

const RestaurantDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your restaurant management platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">📋</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Menu</p>
              <p className="text-2xl font-bold text-gray-900">Current Menu</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">🛒</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Orders Today</p>
              <p className="text-2xl font-bold text-gray-900">47</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">👨‍🍳</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Kitchen Queue</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">📅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reservations</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((order) => (
                <div key={order} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">Order #{order}001</p>
                    <p className="text-sm text-gray-600">Table 5 • 2 items</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Preparing
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kitchen Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Kitchen Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {['Grill', 'Fryer', 'Salad', 'Dessert'].map((station) => (
                <div key={station} className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{station}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">3 orders</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;