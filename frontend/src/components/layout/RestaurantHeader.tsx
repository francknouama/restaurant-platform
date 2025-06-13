import React from 'react';

const RestaurantHeader: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search and Current Page Info */}
        <div className="flex items-center flex-1">
          <div className="max-w-lg w-full">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Search orders, menus, customers..."
                type="search"
              />
            </div>
          </div>
        </div>

        {/* Right side - Status indicators and notifications */}
        <div className="flex items-center space-x-4">
          {/* Restaurant Status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Restaurant Open</span>
          </div>

          {/* Live indicators */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-orange-600">🔥</span>
              <span className="text-gray-600">8 in kitchen</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-blue-600">📅</span>
              <span className="text-gray-600">23 reservations</span>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none">
            <span className="text-lg">🔔</span>
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-700">
              New Order
            </button>
            <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50">
              Quick Menu
            </button>
          </div>
        </div>
      </div>

      {/* Live Stats Bar */}
      <div className="mt-4 grid grid-cols-6 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-2">
          <div className="text-lg font-bold text-blue-600">5</div>
          <div className="text-xs text-blue-600">New Orders</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-2">
          <div className="text-lg font-bold text-yellow-600">8</div>
          <div className="text-xs text-yellow-600">Preparing</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-2">
          <div className="text-lg font-bold text-purple-600">3</div>
          <div className="text-xs text-purple-600">Ready</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <div className="text-lg font-bold text-green-600">$1,247</div>
          <div className="text-xs text-green-600">Today's Sales</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-2">
          <div className="text-lg font-bold text-orange-600">12m</div>
          <div className="text-xs text-orange-600">Avg Prep Time</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-lg font-bold text-gray-600">85%</div>
          <div className="text-xs text-gray-600">Table Occupancy</div>
        </div>
      </div>
    </header>
  );
};

export default RestaurantHeader;