import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';
import { useRestaurantEvents } from '@restaurant/shared-state';

interface Timer {
  id: string;
  orderId: string;
  orderNumber: string;
  itemName: string;
  station: 'grill' | 'prep' | 'salad' | 'dessert' | 'drinks';
  type: 'cooking' | 'prep' | 'resting' | 'holding' | 'custom';
  duration: number; // in seconds
  elapsed: number; // in seconds
  status: 'running' | 'paused' | 'completed' | 'overdue';
  startedAt: string;
  completesAt: string;
  customerName?: string;
  tableNumber?: number;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  chefId?: string;
}

interface TimerPreset {
  id: string;
  name: string;
  station: string;
  duration: number;
  description: string;
  category: 'cooking' | 'prep' | 'resting' | 'holding';
}

const TimerManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { onOrderUpdated } = useRestaurantEvents();
  const [timers, setTimers] = useState<Timer[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTimerForm, setNewTimerForm] = useState({
    itemName: '',
    station: 'grill' as Timer['station'],
    type: 'cooking' as Timer['type'],
    duration: 600, // 10 minutes default
    notes: ''
  });

  // Timer presets for quick timer creation
  const [timerPresets] = useState<TimerPreset[]>([
    { id: 'grill_steak', name: 'Steak (Medium)', station: 'grill', duration: 480, description: '8 minutes total', category: 'cooking' },
    { id: 'grill_chicken', name: 'Chicken Breast', station: 'grill', duration: 720, description: '12 minutes', category: 'cooking' },
    { id: 'grill_salmon', name: 'Salmon Fillet', station: 'grill', duration: 600, description: '10 minutes', category: 'cooking' },
    { id: 'prep_pasta', name: 'Pasta Cooking', station: 'prep', duration: 480, description: '8-10 minutes', category: 'cooking' },
    { id: 'prep_sauce', name: 'Sauce Reduction', station: 'prep', duration: 900, description: '15 minutes', category: 'cooking' },
    { id: 'prep_marinade', name: 'Quick Marinade', station: 'prep', duration: 300, description: '5 minutes', category: 'prep' },
    { id: 'salad_dressing', name: 'Dressing Rest', station: 'salad', duration: 180, description: '3 minutes', category: 'resting' },
    { id: 'dessert_ice_cream', name: 'Ice Cream Tempering', station: 'dessert', duration: 300, description: '5 minutes', category: 'prep' },
    { id: 'drinks_cold_brew', name: 'Cold Brew Steeping', station: 'drinks', duration: 240, description: '4 minutes', category: 'prep' }
  ]);

  // Mock initial timers
  useEffect(() => {
    const mockTimers: Timer[] = [
      {
        id: 'timer_001',
        orderId: 'order_001',
        orderNumber: '#1001',
        itemName: 'Grilled Salmon',
        station: 'grill',
        type: 'cooking',
        duration: 600,
        elapsed: 360,
        status: 'running',
        startedAt: new Date(Date.now() - 6 * 60000).toISOString(),
        completesAt: new Date(Date.now() + 4 * 60000).toISOString(),
        customerName: 'John Doe',
        tableNumber: 5,
        priority: 'high',
        notes: 'Medium rare, extra seasoning',
        chefId: 'chef_001'
      },
      {
        id: 'timer_002',
        orderId: 'order_002',
        orderNumber: '#1002',
        itemName: 'Pasta Sauce',
        station: 'prep',
        type: 'cooking',
        duration: 900,
        elapsed: 720,
        status: 'running',
        startedAt: new Date(Date.now() - 12 * 60000).toISOString(),
        completesAt: new Date(Date.now() + 3 * 60000).toISOString(),
        customerName: 'Jane Smith',
        priority: 'medium',
        notes: 'Reduction for special sauce',
        chefId: 'chef_003'
      },
      {
        id: 'timer_003',
        orderId: 'order_003',
        orderNumber: '#1003',
        itemName: 'Steak Rest',
        station: 'grill',
        type: 'resting',
        duration: 300,
        elapsed: 420,
        status: 'overdue',
        startedAt: new Date(Date.now() - 7 * 60000).toISOString(),
        completesAt: new Date(Date.now() - 2 * 60000).toISOString(),
        customerName: 'Mike Johnson',
        tableNumber: 12,
        priority: 'high',
        notes: 'Let rest before slicing',
        chefId: 'chef_001'
      }
    ];
    setTimers(mockTimers);
  }, []);

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(timer => {
        if (timer.status === 'running') {
          const now = Date.now();
          const startedAt = new Date(timer.startedAt).getTime();
          const newElapsed = Math.floor((now - startedAt) / 1000);
          
          let newStatus = timer.status;
          if (newElapsed >= timer.duration) {
            newStatus = newElapsed > timer.duration + 60 ? 'overdue' : 'completed';
          }

          return {
            ...timer,
            elapsed: newElapsed,
            status: newStatus
          };
        }
        return timer;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = (timer: Timer): number => {
    return timer.duration - timer.elapsed;
  };

  const getTimerProgress = (timer: Timer): number => {
    return Math.min((timer.elapsed / timer.duration) * 100, 100);
  };

  const getTimerStatusColor = (timer: Timer): string => {
    switch (timer.status) {
      case 'running':
        const remaining = getRemainingTime(timer);
        if (remaining <= 30) return 'text-red-600 bg-red-100';
        if (remaining <= 120) return 'text-amber-600 bg-amber-100';
        return 'text-blue-600 bg-blue-100';
      case 'paused': return 'text-gray-600 bg-gray-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-700 bg-red-200';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const handlePauseTimer = (timerId: string) => {
    setTimers(prev => prev.map(timer =>
      timer.id === timerId
        ? { ...timer, status: timer.status === 'running' ? 'paused' as const : 'running' as const }
        : timer
    ));
  };

  const handleCompleteTimer = (timerId: string) => {
    setTimers(prev => prev.map(timer =>
      timer.id === timerId
        ? { ...timer, status: 'completed' as const }
        : timer
    ));
  };

  const handleDeleteTimer = (timerId: string) => {
    setTimers(prev => prev.filter(timer => timer.id !== timerId));
  };

  const handleAddTimer = (preset?: TimerPreset) => {
    if (preset) {
      setNewTimerForm({
        itemName: preset.name,
        station: preset.station as Timer['station'],
        type: preset.category as Timer['type'],
        duration: preset.duration,
        notes: preset.description
      });
    }
    setShowCreateModal(true);
  };

  const handleCreateTimer = () => {
    const newTimer: Timer = {
      id: `timer_${Date.now()}`,
      orderId: `order_${Date.now()}`,
      orderNumber: `#${Math.floor(Math.random() * 9000) + 1000}`,
      itemName: newTimerForm.itemName,
      station: newTimerForm.station,
      type: newTimerForm.type,
      duration: newTimerForm.duration,
      elapsed: 0,
      status: 'running',
      startedAt: new Date().toISOString(),
      completesAt: new Date(Date.now() + newTimerForm.duration * 1000).toISOString(),
      priority: 'medium',
      notes: newTimerForm.notes
    };

    setTimers(prev => [...prev, newTimer]);
    setShowCreateModal(false);
    setNewTimerForm({
      itemName: '',
      station: 'grill',
      type: 'cooking',
      duration: 600,
      notes: ''
    });
  };

  const filteredTimers = timers.filter(timer => {
    if (selectedStation !== 'all' && timer.station !== selectedStation) return false;
    if (!showCompleted && timer.status === 'completed') return false;
    return true;
  });

  const activeTimers = filteredTimers.filter(t => t.status === 'running');
  const overdueTimers = filteredTimers.filter(t => t.status === 'overdue');
  const pausedTimers = filteredTimers.filter(t => t.status === 'paused');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Timer Management</h1>
          <p className="text-neutral-600">
            {activeTimers.length} active • {overdueTimers.length} overdue • {pausedTimers.length} paused
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Stations</option>
            <option value="grill">Grill</option>
            <option value="prep">Prep</option>
            <option value="salad">Salad</option>
            <option value="dessert">Dessert</option>
            <option value="drinks">Drinks</option>
          </select>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-700">Show Completed</span>
          </label>

          <Button
            onClick={() => handleAddTimer()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + New Timer
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
          >
            Back to Queue
          </Button>
        </div>
      </div>

      {/* Quick Timer Presets */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <h3 className="font-semibold mb-4">Quick Timer Presets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {timerPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleAddTimer(preset)}
              className="p-3 border border-neutral-200 rounded-lg text-left hover:bg-neutral-50 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className={`station-indicator ${preset.station}`}></span>
                <span className="font-medium text-sm">{preset.name}</span>
              </div>
              <div className="text-xs text-neutral-600">{preset.description}</div>
              <div className="text-xs text-neutral-500 mt-1 capitalize">{preset.station}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Alert for Overdue Timers */}
      {overdueTimers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-600 font-semibold">⚠️ {overdueTimers.length} Overdue Timer(s)</div>
            <div className="text-sm text-red-700">Immediate attention required</div>
          </div>
        </div>
      )}

      {/* Active Timers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTimers.map((timer) => (
          <div
            key={timer.id}
            className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
              timer.status === 'overdue' 
                ? 'border-red-300 bg-red-50' 
                : timer.status === 'completed'
                ? 'border-green-300 bg-green-50'
                : 'border-neutral-200'
            }`}
          >
            {/* Timer Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className={`station-indicator ${timer.station}`}></span>
                <span className="font-semibold">{timer.orderNumber}</span>
                <span className={`priority-indicator ${timer.priority}`}>
                  {timer.priority}
                </span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTimerStatusColor(timer)}`}>
                {timer.status}
              </span>
            </div>

            {/* Timer Info */}
            <div className="mb-4">
              <h3 className="font-medium text-neutral-900 mb-1">{timer.itemName}</h3>
              <div className="text-sm text-neutral-600">
                {timer.customerName}
                {timer.tableNumber && ` • Table ${timer.tableNumber}`}
                <span className="ml-2 capitalize">{timer.type} timer</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-neutral-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(getTimerProgress(timer))}%</span>
              </div>
              <div className="bg-neutral-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    timer.status === 'overdue' 
                      ? 'bg-red-500' 
                      : timer.status === 'completed'
                      ? 'bg-green-500'
                      : getRemainingTime(timer) <= 30
                      ? 'bg-red-500'
                      : getRemainingTime(timer) <= 120
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(getTimerProgress(timer), 100)}%` }}
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="text-center mb-4">
              <div className={`timer-display text-3xl font-mono ${
                timer.status === 'overdue' ? 'expired' : 
                getRemainingTime(timer) <= 30 ? 'critical' : 
                getRemainingTime(timer) <= 120 ? 'warning' : ''
              }`}>
                {timer.status === 'overdue' 
                  ? `+${formatTime(Math.abs(getRemainingTime(timer)))}`
                  : formatTime(getRemainingTime(timer))
                }
              </div>
              <div className="text-sm text-neutral-600">
                {timer.status === 'overdue' ? 'Overdue by' : 'Remaining'}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Target: {formatTime(timer.duration)} • Elapsed: {formatTime(timer.elapsed)}
              </div>
            </div>

            {/* Notes */}
            {timer.notes && (
              <div className="mb-4 p-2 bg-neutral-50 border border-neutral-200 rounded text-sm">
                <span className="font-medium text-neutral-700">Notes: </span>
                <span className="text-neutral-600">{timer.notes}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              {timer.status === 'running' && (
                <Button
                  onClick={() => handlePauseTimer(timer.id)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  Pause
                </Button>
              )}
              
              {timer.status === 'paused' && (
                <Button
                  onClick={() => handlePauseTimer(timer.id)}
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Resume
                </Button>
              )}

              {(timer.status === 'running' || timer.status === 'overdue') && (
                <Button
                  onClick={() => handleCompleteTimer(timer.id)}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Complete
                </Button>
              )}

              <Button
                onClick={() => handleDeleteTimer(timer.id)}
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                ×
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredTimers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-neutral-400 text-lg mb-2">No active timers</div>
          <div className="text-neutral-500 text-sm">
            {selectedStation !== 'all' ? `No timers for ${selectedStation} station` : 'Create a new timer to get started'}
          </div>
          <Button
            onClick={() => handleAddTimer()}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Create Timer
          </Button>
        </div>
      )}

      {/* Create Timer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Timer</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={newTimerForm.itemName}
                  onChange={(e) => setNewTimerForm(prev => ({ ...prev, itemName: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter item name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Station
                  </label>
                  <select
                    value={newTimerForm.station}
                    onChange={(e) => setNewTimerForm(prev => ({ ...prev, station: e.target.value as Timer['station'] }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="grill">Grill</option>
                    <option value="prep">Prep</option>
                    <option value="salad">Salad</option>
                    <option value="dessert">Dessert</option>
                    <option value="drinks">Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newTimerForm.type}
                    onChange={(e) => setNewTimerForm(prev => ({ ...prev, type: e.target.value as Timer['type'] }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cooking">Cooking</option>
                    <option value="prep">Prep</option>
                    <option value="resting">Resting</option>
                    <option value="holding">Holding</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={Math.floor(newTimerForm.duration / 60)}
                  onChange={(e) => setNewTimerForm(prev => ({ ...prev, duration: parseInt(e.target.value) * 60 }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={newTimerForm.notes}
                  onChange={(e) => setNewTimerForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Add any special instructions"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTimer}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!newTimerForm.itemName.trim()}
              >
                Start Timer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerManagementPage;