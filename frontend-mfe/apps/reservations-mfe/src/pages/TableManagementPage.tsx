import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';
import { useRestaurantEvents } from '@restaurant/shared-state';

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
  location: string;
  section: 'main' | 'patio' | 'bar' | 'private';
  reservations: ReservationSlot[];
  currentGuests?: number;
  server?: string;
  timeSeated?: string;
  estimatedDeparture?: string;
  notes?: string;
}

interface ReservationSlot {
  id: string;
  customerName: string;
  time: string;
  partySize: number;
  status: 'confirmed' | 'pending' | 'seated' | 'completed';
  duration: number;
}

const TableManagementPage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { onReservationCreated, onReservationUpdated } = useRestaurantEvents();
  
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [viewMode, setViewMode] = useState<'layout' | 'list'>('layout');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showTableDetails, setShowTableDetails] = useState(false);

  // Mock data for tables
  useEffect(() => {
    const generateMockTables = (): Table[] => {
      const mockTables: Table[] = [];
      const sections = ['main', 'patio', 'bar', 'private'] as const;
      const locations = ['Window', 'Center', 'Corner', 'Wall', 'Entrance'];
      const servers = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank'];
      
      let tableNumber = 1;
      
      sections.forEach((section, sectionIndex) => {
        const tablesInSection = section === 'main' ? 15 : section === 'patio' ? 8 : section === 'bar' ? 6 : 4;
        
        for (let i = 0; i < tablesInSection; i++) {
          const capacity = section === 'bar' ? [2, 4][Math.floor(Math.random() * 2)] :
                          section === 'private' ? [6, 8, 10][Math.floor(Math.random() * 3)] :
                          [2, 4, 6][Math.floor(Math.random() * 3)];
          
          const statusOptions = ['available', 'occupied', 'reserved', 'maintenance'] as const;
          const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
          
          // Generate reservations for today
          const reservations: ReservationSlot[] = [];
          const today = new Date().toISOString().split('T')[0];
          const numReservations = Math.floor(Math.random() * 4); // 0-3 reservations per table
          
          for (let j = 0; j < numReservations; j++) {
            const hour = 17 + j * 2; // 5PM, 7PM, 9PM slots
            reservations.push({
              id: `res_${tableNumber}_${j}`,
              customerName: `Customer ${tableNumber}-${j}`,
              time: `${hour.toString().padStart(2, '0')}:00`,
              partySize: Math.min(capacity, Math.floor(Math.random() * 4) + 1),
              status: ['confirmed', 'pending'][Math.floor(Math.random() * 2)] as any,
              duration: [90, 120][Math.floor(Math.random() * 2)]
            });
          }
          
          const table: Table = {
            id: tableNumber,
            number: tableNumber,
            capacity,
            status,
            location: locations[Math.floor(Math.random() * locations.length)],
            section,
            reservations,
            currentGuests: status === 'occupied' ? Math.floor(Math.random() * capacity) + 1 : undefined,
            server: status === 'occupied' ? servers[Math.floor(Math.random() * servers.length)] : undefined,
            timeSeated: status === 'occupied' ? 
              new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toTimeString().slice(0, 5) : undefined,
            estimatedDeparture: status === 'occupied' ? 
              new Date(Date.now() + Math.random() * 2 * 60 * 60 * 1000).toTimeString().slice(0, 5) : undefined,
            notes: Math.random() > 0.8 ? 'VIP table - premium service' : undefined
          };
          
          mockTables.push(table);
          tableNumber++;
        }
      });
      
      return mockTables;
    };

    const mockTables = generateMockTables();
    setTables(mockTables);
    
    // If tableId is provided, select that table
    if (tableId) {
      const table = mockTables.find(t => t.id === parseInt(tableId));
      if (table) {
        setSelectedTable(table);
        setShowTableDetails(true);
      }
    }
  }, [tableId]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-300 text-green-800';
      case 'occupied': return 'bg-red-100 border-red-300 text-red-800';
      case 'reserved': return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'maintenance': return 'bg-gray-100 border-gray-300 text-gray-800';
      case 'cleaning': return 'bg-cyan-100 border-cyan-300 text-cyan-800';
      default: return 'bg-neutral-100 border-neutral-300 text-neutral-800';
    }
  };

  const getSectionColor = (section: string): string => {
    switch (section) {
      case 'main': return 'bg-blue-500';
      case 'patio': return 'bg-green-500';
      case 'bar': return 'bg-purple-500';
      case 'private': return 'bg-amber-500';
      default: return 'bg-neutral-500';
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setShowTableDetails(true);
    navigate(`/tables/${table.id}`);
  };

  const handleStatusChange = (tableId: number, newStatus: string) => {
    setTables(prev => prev.map(table =>
      table.id === tableId
        ? { ...table, status: newStatus as any }
        : table
    ));
  };

  const handleSeatCustomers = (tableId: number, partySize: number, customerName: string) => {
    setTables(prev => prev.map(table =>
      table.id === tableId
        ? {
            ...table,
            status: 'occupied' as const,
            currentGuests: partySize,
            timeSeated: new Date().toTimeString().slice(0, 5),
            estimatedDeparture: new Date(Date.now() + 2 * 60 * 60 * 1000).toTimeString().slice(0, 5)
          }
        : table
    ));
  };

  const filteredTables = tables.filter(table => {
    if (selectedSection !== 'all' && table.section !== selectedSection) return false;
    if (selectedStatus !== 'all' && table.status !== selectedStatus) return false;
    return true;
  });

  const getTableStats = () => {
    const available = tables.filter(t => t.status === 'available').length;
    const occupied = tables.filter(t => t.status === 'occupied').length;
    const reserved = tables.filter(t => t.status === 'reserved').length;
    const occupancyRate = Math.round((occupied / tables.length) * 100);
    
    return { available, occupied, reserved, occupancyRate };
  };

  const stats = getTableStats();

  const renderTableLayout = () => {
    const sections = ['main', 'patio', 'bar', 'private'];
    
    return (
      <div className="space-y-8">
        {sections.map(section => {
          const sectionTables = filteredTables.filter(table => table.section === section);
          if (sectionTables.length === 0) return null;
          
          return (
            <div key={section} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${getSectionColor(section)}`}></div>
                  <h3 className="text-lg font-semibold capitalize">{section} Section</h3>
                  <span className="text-sm text-neutral-600">
                    ({sectionTables.length} tables)
                  </span>
                </div>
              </div>
              
              <div className="table-layout medium">
                {sectionTables.map(table => (
                  <div
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={`table-visual ${table.status} ${
                      selectedTable?.id === table.id ? 'ring-2 ring-blue-400' : ''
                    }`}
                    title={`Table ${table.number} - ${table.capacity} seats - ${table.status}`}
                  >
                    <div className="text-xs font-bold">{table.number}</div>
                    <div className="text-xs">{table.capacity}</div>
                    {table.currentGuests && (
                      <div className="text-xs mt-1 bg-red-600 text-white rounded px-1">
                        {table.currentGuests}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTableList = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Current Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Next Reservation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredTables.map(table => {
                const nextReservation = table.reservations.find(res => res.status === 'confirmed');
                
                return (
                  <tr key={table.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${getSectionColor(table.section)}`}></div>
                        <span className="font-medium">Table {table.number}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 capitalize">
                      {table.section}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {table.capacity} seats
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={table.status}
                        onChange={(e) => handleStatusChange(table.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(table.status)}`}
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="cleaning">Cleaning</option>
                      </select>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {table.status === 'occupied' && (
                        <div>
                          <div>{table.currentGuests} guests</div>
                          <div className="text-xs text-neutral-600">
                            Since {table.timeSeated}
                          </div>
                          {table.server && (
                            <div className="text-xs text-neutral-600">
                              Server: {table.server}
                            </div>
                          )}
                        </div>
                      )}
                      {table.status === 'reserved' && nextReservation && (
                        <div>
                          <div className="text-xs text-neutral-600">
                            Reserved for {nextReservation.time}
                          </div>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {nextReservation ? (
                        <div>
                          <div className="font-medium">{nextReservation.customerName}</div>
                          <div className="text-xs text-neutral-600">
                            {nextReservation.time} - {nextReservation.partySize} people
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-400">None</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleTableClick(table)}
                          size="sm"
                          variant="outline"
                        >
                          View
                        </Button>
                        {table.status === 'available' && (
                          <Button
                            onClick={() => navigate(`/reservations/new?table=${table.number}`)}
                            size="sm"
                          >
                            Reserve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Table Management</h1>
          <p className="text-neutral-600">
            {filteredTables.length} tables • {stats.occupancyRate}% occupied
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('layout')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'layout'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Layout
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              List
            </button>
          </div>

          <Button
            onClick={() => navigate('/reservations/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + New Reservation
          </Button>

          <Button
            onClick={() => navigate('/calendar')}
            variant="outline"
          >
            Calendar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value text-green-600">{stats.available}</div>
          <div className="metric-label">Available</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-red-600">{stats.occupied}</div>
          <div className="metric-label">Occupied</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-amber-600">{stats.reserved}</div>
          <div className="metric-label">Reserved</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{stats.occupancyRate}%</div>
          <div className="metric-label">Occupancy</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sections</option>
              <option value="main">Main Dining</option>
              <option value="patio">Patio</option>
              <option value="bar">Bar</option>
              <option value="private">Private Dining</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
              <option value="cleaning">Cleaning</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      {viewMode === 'layout' ? renderTableLayout() : renderTableList()}

      {/* Table Details Modal */}
      {showTableDetails && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Table {selectedTable.number}</h2>
              <Button
                onClick={() => {
                  setShowTableDetails(false);
                  setSelectedTable(null);
                  navigate('/tables');
                }}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Table Info */}
              <div>
                <h3 className="font-semibold mb-3">Table Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Capacity:</span> {selectedTable.capacity} seats
                  </div>
                  <div>
                    <span className="font-medium">Section:</span> 
                    <span className="capitalize ml-1">{selectedTable.section}</span>
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {selectedTable.location}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTable.status)}`}>
                      {selectedTable.status}
                    </span>
                  </div>
                  {selectedTable.notes && (
                    <div>
                      <span className="font-medium">Notes:</span>
                      <div className="text-neutral-600 mt-1">{selectedTable.notes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Status */}
              <div>
                <h3 className="font-semibold mb-3">Current Status</h3>
                {selectedTable.status === 'occupied' && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Guests:</span> {selectedTable.currentGuests}
                    </div>
                    <div>
                      <span className="font-medium">Seated at:</span> {selectedTable.timeSeated}
                    </div>
                    <div>
                      <span className="font-medium">Est. departure:</span> {selectedTable.estimatedDeparture}
                    </div>
                    {selectedTable.server && (
                      <div>
                        <span className="font-medium">Server:</span> {selectedTable.server}
                      </div>
                    )}
                  </div>
                )}
                {selectedTable.status === 'available' && (
                  <div className="text-green-600 font-medium">Ready for seating</div>
                )}
              </div>
            </div>

            {/* Today's Reservations */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Today's Reservations</h3>
              {selectedTable.reservations.length > 0 ? (
                <div className="space-y-2">
                  {selectedTable.reservations.map(reservation => (
                    <div key={reservation.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <div className="font-medium">{reservation.customerName}</div>
                        <div className="text-sm text-neutral-600">
                          {reservation.time} • {reservation.partySize} people • {reservation.duration}min
                        </div>
                      </div>
                      <span className={`reservation-status-badge ${reservation.status}`}>
                        {reservation.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-500">No reservations today</div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex space-x-3">
              {selectedTable.status === 'available' && (
                <>
                  <Button
                    onClick={() => navigate(`/reservations/new?table=${selectedTable.number}`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Reserve Table
                  </Button>
                  <Button
                    onClick={() => handleSeatCustomers(selectedTable.id, 2, 'Walk-in Customer')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Seat Walk-in
                  </Button>
                </>
              )}
              {selectedTable.status === 'occupied' && (
                <Button
                  onClick={() => handleStatusChange(selectedTable.id, 'available')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Clear Table
                </Button>
              )}
              <Button
                onClick={() => handleStatusChange(selectedTable.id, 'maintenance')}
                variant="outline"
              >
                Mark for Maintenance
              </Button>
            </div>
          </div>
        </div>
      )}

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <div className="text-neutral-400 text-lg mb-2">No tables found</div>
          <div className="text-neutral-500 text-sm">
            Try adjusting your filters
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagementPage;