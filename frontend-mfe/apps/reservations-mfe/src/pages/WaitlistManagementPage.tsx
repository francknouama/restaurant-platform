import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';
import { useRestaurantEvents } from '@restaurant/shared-state';

interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  requestedTime: string;
  waitingSince: string;
  estimatedWait: number; // in minutes
  priority: 'normal' | 'high' | 'urgent';
  status: 'waiting' | 'notified' | 'seated' | 'cancelled' | 'noshow';
  notes?: string;
  preferredSection?: string;
  specialRequests?: string;
  quotedTime?: string;
  notifiedAt?: string;
}

const WaitlistManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { emitReservationCreated } = useRestaurantEvents();
  
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    customerName: '',
    customerPhone: '',
    partySize: 2,
    requestedTime: '',
    notes: '',
    specialRequests: ''
  });

  // Mock data for waitlist
  useEffect(() => {
    const generateMockWaitlist = (): WaitlistEntry[] => {
      const now = new Date();
      const mockEntries: WaitlistEntry[] = [];
      
      const names = [
        'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Brown',
        'Emma Wilson', 'Frank Miller', 'Grace Taylor', 'Henry Garcia'
      ];
      
      names.forEach((name, index) => {
        const waitingSince = new Date(now.getTime() - (index + 1) * 15 * 60 * 1000); // Every 15 minutes
        const requestedTime = new Date(now.getTime() + Math.random() * 2 * 60 * 60 * 1000);
        
        mockEntries.push({
          id: `wait_${index}`,
          customerName: name,
          customerPhone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          partySize: Math.floor(Math.random() * 6) + 1,
          requestedTime: requestedTime.toTimeString().slice(0, 5),
          waitingSince: waitingSince.toISOString(),
          estimatedWait: (index + 1) * 15 + Math.floor(Math.random() * 20),
          priority: index < 2 ? 'high' : index === 7 ? 'urgent' : 'normal',
          status: index < 6 ? 'waiting' : index === 6 ? 'notified' : 'seated',
          notes: index % 3 === 0 ? 'Regular customer' : undefined,
          specialRequests: index % 4 === 0 ? 'High chair needed' : undefined,
          quotedTime: index >= 6 ? new Date(now.getTime() + 10 * 60 * 1000).toTimeString().slice(0, 5) : undefined,
          notifiedAt: index === 6 ? new Date(now.getTime() - 5 * 60 * 1000).toISOString() : undefined
        });
      });
      
      return mockEntries.sort((a, b) => new Date(a.waitingSince).getTime() - new Date(b.waitingSince).getTime());
    };

    setWaitlist(generateMockWaitlist());
  }, []);

  const getWaitTime = (waitingSince: string): string => {
    const now = new Date();
    const waitStart = new Date(waitingSince);
    const diffMinutes = Math.floor((now.getTime() - waitStart.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-amber-600 bg-amber-100';
      case 'normal': return 'text-green-600 bg-green-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'waiting': return 'text-blue-600 bg-blue-100';
      case 'notified': return 'text-amber-600 bg-amber-100';
      case 'seated': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'noshow': return 'text-red-700 bg-red-200';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const handleNotifyCustomer = (entryId: string) => {
    setWaitlist(prev => prev.map(entry =>
      entry.id === entryId
        ? {
            ...entry,
            status: 'notified' as const,
            notifiedAt: new Date().toISOString(),
            quotedTime: new Date(Date.now() + 10 * 60 * 1000).toTimeString().slice(0, 5)
          }
        : entry
    ));
  };

  const handleSeatCustomer = (entryId: string) => {
    const entry = waitlist.find(e => e.id === entryId);
    if (!entry) return;

    // Create reservation from waitlist entry
    const reservation = {
      id: `res_${Date.now()}`,
      customerName: entry.customerName,
      customerEmail: `${entry.customerName.toLowerCase().replace(' ', '.')}@example.com`,
      customerPhone: entry.customerPhone,
      partySize: entry.partySize,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      duration: 120,
      status: 'confirmed' as const,
      source: 'walk-in' as const,
      priority: entry.priority === 'urgent' ? 'vip' as const : 'normal' as const,
      specialRequests: entry.specialRequests,
      notes: `From waitlist - waited ${getWaitTime(entry.waitingSince)}`,
      confirmationCode: `W${Math.floor(Math.random() * 9000) + 1000}`,
      createdAt: new Date().toISOString()
    };

    // Emit reservation created event
    emitReservationCreated(reservation);

    // Update waitlist entry status
    setWaitlist(prev => prev.map(e =>
      e.id === entryId
        ? { ...e, status: 'seated' as const }
        : e
    ));

    // Navigate to table assignment or reservation details
    navigate(`/reservations/${reservation.id}`, {
      state: { message: 'Customer seated! Reservation created from waitlist.' }
    });
  };

  const handleRemoveFromWaitlist = (entryId: string, status: 'cancelled' | 'noshow') => {
    setWaitlist(prev => prev.map(entry =>
      entry.id === entryId
        ? { ...entry, status }
        : entry
    ));
  };

  const handleAddToWaitlist = () => {
    if (!newEntry.customerName || !newEntry.customerPhone) {
      return;
    }

    const waitlistEntry: WaitlistEntry = {
      id: `wait_${Date.now()}`,
      customerName: newEntry.customerName,
      customerPhone: newEntry.customerPhone,
      partySize: newEntry.partySize,
      requestedTime: newEntry.requestedTime || new Date().toTimeString().slice(0, 5),
      waitingSince: new Date().toISOString(),
      estimatedWait: 30 + Math.floor(Math.random() * 30),
      priority: 'normal',
      status: 'waiting',
      notes: newEntry.notes || undefined,
      specialRequests: newEntry.specialRequests || undefined
    };

    setWaitlist(prev => [...prev, waitlistEntry]);
    setNewEntry({
      customerName: '',
      customerPhone: '',
      partySize: 2,
      requestedTime: '',
      notes: '',
      specialRequests: ''
    });
    setShowAddModal(false);
  };

  const handleUpdatePriority = (entryId: string, priority: 'normal' | 'high' | 'urgent') => {
    setWaitlist(prev => prev.map(entry =>
      entry.id === entryId
        ? { ...entry, priority }
        : entry
    ));
  };

  const activeWaitlist = waitlist.filter(entry => 
    entry.status === 'waiting' || entry.status === 'notified'
  );

  const completedToday = waitlist.filter(entry => 
    entry.status === 'seated' || entry.status === 'cancelled' || entry.status === 'noshow'
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Waitlist Management</h1>
          <p className="text-neutral-600">
            {activeWaitlist.length} people waiting • Avg wait: {Math.round(activeWaitlist.reduce((acc, entry) => acc + entry.estimatedWait, 0) / activeWaitlist.length || 0)}min
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Add to Waitlist
          </Button>
          
          <Button
            onClick={() => navigate('/tables')}
            variant="outline"
          >
            Table Status
          </Button>
          
          <Button
            onClick={() => navigate('/reservations')}
            variant="outline"
          >
            Reservations
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value text-blue-600">{activeWaitlist.length}</div>
          <div className="metric-label">Currently Waiting</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-amber-600">
            {activeWaitlist.filter(e => e.status === 'notified').length}
          </div>
          <div className="metric-label">Notified</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-green-600">
            {completedToday.filter(e => e.status === 'seated').length}
          </div>
          <div className="metric-label">Seated Today</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {Math.round(activeWaitlist.reduce((acc, entry) => acc + entry.estimatedWait, 0) / activeWaitlist.length || 0)}m
          </div>
          <div className="metric-label">Avg Wait Time</div>
        </div>
      </div>

      {/* Active Waitlist */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold">Current Waitlist</h2>
        </div>
        
        {activeWaitlist.length > 0 ? (
          <div className="divide-y divide-neutral-200">
            {activeWaitlist.map((entry, index) => (
              <div key={entry.id} className="p-6 hover:bg-neutral-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                      {index + 1}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-neutral-900">{entry.customerName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(entry.priority)}`}>
                          {entry.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-600">
                        {entry.customerPhone} • Party of {entry.partySize}
                        {entry.requestedTime && (
                          <span> • Requested {entry.requestedTime}</span>
                        )}
                      </div>
                      {entry.specialRequests && (
                        <div className="text-sm text-amber-600 mt-1">
                          ⚠️ {entry.specialRequests}
                        </div>
                      )}
                      {entry.notes && (
                        <div className="text-sm text-neutral-500 mt-1">
                          Note: {entry.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium text-neutral-900">
                        {getWaitTime(entry.waitingSince)} waiting
                      </div>
                      <div className="text-sm text-neutral-600">
                        Est. {entry.estimatedWait}min total
                      </div>
                      {entry.status === 'notified' && entry.quotedTime && (
                        <div className="text-sm text-amber-600">
                          Quoted for {entry.quotedTime}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Priority selector */}
                      <select
                        value={entry.priority}
                        onChange={(e) => handleUpdatePriority(entry.id, e.target.value as any)}
                        className="text-xs px-2 py-1 border border-neutral-300 rounded"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      
                      {entry.status === 'waiting' && (
                        <Button
                          onClick={() => handleNotifyCustomer(entry.id)}
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          Notify
                        </Button>
                      )}
                      
                      {(entry.status === 'notified' || entry.status === 'waiting') && (
                        <Button
                          onClick={() => handleSeatCustomer(entry.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Seat
                        </Button>
                      )}
                      
                      <div className="relative">
                        <select
                          onChange={(e) => {
                            if (e.target.value !== '') {
                              handleRemoveFromWaitlist(entry.id, e.target.value as any);
                              e.target.value = '';
                            }
                          }}
                          className="text-xs px-2 py-1 border border-neutral-300 rounded text-red-600"
                          defaultValue=""
                        >
                          <option value="" disabled>Remove</option>
                          <option value="cancelled">Cancel</option>
                          <option value="noshow">No Show</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-neutral-400 text-lg mb-2">No one on the waitlist</div>
            <div className="text-neutral-500 text-sm">
              Add customers to the waitlist when tables are full
            </div>
          </div>
        )}
      </div>

      {/* Completed Today */}
      {completedToday.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold">Completed Today ({completedToday.length})</h2>
          </div>
          
          <div className="divide-y divide-neutral-200">
            {completedToday.slice(0, 5).map(entry => (
              <div key={entry.id} className="p-4 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{entry.customerName}</span>
                    <span className="text-neutral-600 ml-2">• Party of {entry.partySize}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-600">
                      Waited {getWaitTime(entry.waitingSince)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(entry.status)}`}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add to Waitlist Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add to Waitlist</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={newEntry.customerName}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newEntry.customerPhone}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, customerPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Party Size
                  </label>
                  <select
                    value={newEntry.partySize}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, partySize: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Requested Time
                  </label>
                  <input
                    type="time"
                    value={newEntry.requestedTime}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, requestedTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Special Requests
                </label>
                <input
                  type="text"
                  value={newEntry.specialRequests}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, specialRequests: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="High chair, wheelchair access, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setShowAddModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToWaitlist}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!newEntry.customerName || !newEntry.customerPhone}
              >
                Add to Waitlist
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistManagementPage;