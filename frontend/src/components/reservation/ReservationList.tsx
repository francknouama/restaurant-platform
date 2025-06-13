import React, { useState } from 'react';
import { Reservation, ReservationID, ReservationStatus, ReservationFilters } from '../../types';
import ReservationCard from './ReservationCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import Card from '../ui/Card';

export interface ReservationListProps {
  reservations: Reservation[];
  loading?: boolean;
  onConfirm?: (reservationId: ReservationID) => void;
  onCancel?: (reservationId: ReservationID) => void;
  onCheckIn?: (reservationId: ReservationID) => void;
  onMarkNoShow?: (reservationId: ReservationID) => void;
  onComplete?: (reservationId: ReservationID) => void;
  onEdit?: (reservationId: ReservationID) => void;
  onFiltersChange?: (filters: ReservationFilters) => void;
  loadingReservationId?: string;
  showFilters?: boolean;
  compact?: boolean;
}

const ReservationList: React.FC<ReservationListProps> = ({
  reservations,
  loading = false,
  onConfirm,
  onCancel,
  onCheckIn,
  onMarkNoShow,
  onComplete,
  onEdit,
  loadingReservationId,
  showFilters = true,
  compact = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('TODAY');
  const [partyFilter, setPartyFilter] = useState<string>('ALL');
  const [tableFilter, setTableFilter] = useState<string>('ALL');

  // Apply filters
  const filteredReservations = reservations.filter(reservation => {
    // Status filter
    if (statusFilter !== 'ALL' && reservation.status !== statusFilter) return false;
    
    // Date filter
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (dateFilter === 'TODAY' && reservation.date !== today) return false;
    if (dateFilter === 'TOMORROW' && reservation.date !== tomorrow) return false;
    if (dateFilter === 'UPCOMING') {
      const reservationDate = new Date(reservation.date);
      const todayDate = new Date(today);
      if (reservationDate < todayDate) return false;
    }
    
    // Party size filter
    if (partyFilter !== 'ALL') {
      const partySize = reservation.partySize;
      if (partyFilter === 'SMALL' && partySize > 2) return false;
      if (partyFilter === 'MEDIUM' && (partySize < 3 || partySize > 6)) return false;
      if (partyFilter === 'LARGE' && partySize < 7) return false;
    }
    
    // Table filter
    if (tableFilter !== 'ALL' && reservation.tableID !== tableFilter) return false;
    
    return true;
  });

  // Sort reservations by date and time
  const sortedReservations = [...filteredReservations].sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
    const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
    return dateTimeA - dateTimeB;
  });

  // Calculate statistics
  const stats = {
    total: reservations.length,
    byStatus: {
      PENDING: reservations.filter(r => r.status === 'PENDING').length,
      CONFIRMED: reservations.filter(r => r.status === 'CONFIRMED').length,
      CHECKED_IN: reservations.filter(r => r.status === 'CHECKED_IN').length,
      COMPLETED: reservations.filter(r => r.status === 'COMPLETED').length,
      CANCELLED: reservations.filter(r => r.status === 'CANCELLED').length,
      NO_SHOW: reservations.filter(r => r.status === 'NO_SHOW').length,
    },
    averagePartySize: reservations.length > 0 
      ? Math.round(reservations.reduce((sum, r) => sum + r.partySize, 0) / reservations.length)
      : 0,
  };

  // Get unique tables for filter
  const uniqueTables = Array.from(new Set(reservations.map(r => r.tableID))).sort();

  if (loading && reservations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading reservations..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
            Reservations
          </h2>
          <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
            {filteredReservations.length} reservation{filteredReservations.length !== 1 ? 's' : ''} shown
            {stats.averagePartySize > 0 && ` • ${stats.averagePartySize} avg party size`}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">{stats.byStatus.PENDING}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{stats.byStatus.CONFIRMED}</div>
            <div className="text-xs text-gray-600">Confirmed</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{stats.byStatus.CHECKED_IN}</div>
            <div className="text-xs text-gray-600">Checked In</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-600">{stats.byStatus.COMPLETED}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">{stats.byStatus.CANCELLED}</div>
            <div className="text-xs text-gray-600">Cancelled</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">{stats.byStatus.NO_SHOW}</div>
            <div className="text-xs text-gray-600">No Show</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Status:</h3>
            <div className="flex flex-wrap gap-1">
              {(['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.replace('_', ' ')} ({status === 'ALL' ? stats.total : stats.byStatus[status as ReservationStatus] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Date:</h3>
            <div className="flex flex-wrap gap-1">
              {(['TODAY', 'TOMORROW', 'UPCOMING', 'ALL'] as const).map((date) => (
                <button
                  key={date}
                  onClick={() => setDateFilter(date)}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                    dateFilter === date
                      ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {date}
                </button>
              ))}
            </div>
          </div>

          {/* Party Size Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Party Size:</h3>
            <div className="flex flex-wrap gap-1">
              {(['ALL', 'SMALL', 'MEDIUM', 'LARGE'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setPartyFilter(size)}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                    partyFilter === size
                      ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size} {size === 'SMALL' && '(1-2)'} {size === 'MEDIUM' && '(3-6)'} {size === 'LARGE' && '(7+)'}
                </button>
              ))}
            </div>
          </div>

          {/* Table Filter */}
          {uniqueTables.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Table:</h3>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setTableFilter('ALL')}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                    tableFilter === 'ALL'
                      ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ALL
                </button>
                {uniqueTables.slice(0, 8).map((table) => (
                  <button
                    key={table}
                    onClick={() => setTableFilter(table)}
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                      tableFilter === table
                        ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {table}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reservations Grid */}
      {filteredReservations.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations found</h3>
          <p className="text-gray-600">
            {reservations.length === 0 
              ? 'No reservations have been made yet.'
              : 'No reservations match your current filters. Try adjusting your filter criteria.'}
          </p>
          {(statusFilter !== 'ALL' || dateFilter !== 'TODAY' || partyFilter !== 'ALL' || tableFilter !== 'ALL') && (
            <Button 
              variant="outline" 
              size="sm"
              className="mt-4"
              onClick={() => {
                setStatusFilter('ALL');
                setDateFilter('TODAY');
                setPartyFilter('ALL');
                setTableFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className={`grid gap-6 ${
          compact 
            ? 'grid-cols-1' 
            : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
        }`}>
          {sortedReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id.value}
              reservation={reservation}
              onConfirm={onConfirm}
              onCancel={onCancel}
              onCheckIn={onCheckIn}
              onMarkNoShow={onMarkNoShow}
              onComplete={onComplete}
              onEdit={onEdit}
              loading={loadingReservationId === reservation.id.value}
              compact={compact}
            />
          ))}
        </div>
      )}

      {loading && reservations.length > 0 && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" text="Updating reservations..." />
        </div>
      )}
    </div>
  );
};

export default ReservationList;