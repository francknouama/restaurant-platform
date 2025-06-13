import React, { useState } from 'react';
import {
  useReservations,
  useTodaysReservations,
  useReservationMetrics,
  useConfirmReservation,
  useCancelReservation,
  useCheckInReservation,
  useMarkNoShow,
  useCompleteReservation,
  useWaitlist,
  useAddToWaitlist,
  useRemoveFromWaitlist,
  useNotifyWaitlistCustomer
} from '../hooks/useReservations';
import { ReservationID, ReservationFilters } from '../types';
import ReservationList from '../components/reservation/ReservationList';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const ReservationManagement: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'today' | 'all' | 'waitlist'>('today');
  const [filters] = useState<ReservationFilters>({});
  const [loadingReservationId, setLoadingReservationId] = useState<string | null>(null);

  // API Hooks
  const { data: allReservationsData, isLoading: allReservationsLoading, error: allReservationsError } = 
    useReservations(selectedView === 'all' ? filters : undefined);
  const { data: todaysReservations = [], isLoading: todaysLoading, error: todaysError } = 
    useTodaysReservations();
  const { data: metrics, isLoading: metricsLoading } = useReservationMetrics();
  const { data: waitlist = [], isLoading: waitlistLoading } = useWaitlist();

  // Mutation Hooks
  const confirmReservation = useConfirmReservation();
  const cancelReservation = useCancelReservation();
  const checkInReservation = useCheckInReservation();
  const markNoShow = useMarkNoShow();
  const completeReservation = useCompleteReservation();
  const removeFromWaitlist = useRemoveFromWaitlist();
  const notifyWaitlistCustomer = useNotifyWaitlistCustomer();

  // Determine which data to use
  const reservations = selectedView === 'today' 
    ? todaysReservations 
    : allReservationsData?.items || [];
  const loading = selectedView === 'today' ? todaysLoading : allReservationsLoading;
  const error = selectedView === 'today' ? todaysError : allReservationsError;

  // Event Handlers
  const handleConfirm = async (reservationId: ReservationID) => {
    setLoadingReservationId(reservationId.value);
    try {
      await confirmReservation.mutateAsync(reservationId);
    } finally {
      setLoadingReservationId(null);
    }
  };

  const handleCancel = async (reservationId: ReservationID) => {
    setLoadingReservationId(reservationId.value);
    try {
      await cancelReservation.mutateAsync({ id: reservationId });
    } finally {
      setLoadingReservationId(null);
    }
  };

  const handleCheckIn = async (reservationId: ReservationID) => {
    setLoadingReservationId(reservationId.value);
    try {
      await checkInReservation.mutateAsync(reservationId);
    } finally {
      setLoadingReservationId(null);
    }
  };

  const handleMarkNoShow = async (reservationId: ReservationID) => {
    setLoadingReservationId(reservationId.value);
    try {
      await markNoShow.mutateAsync(reservationId);
    } finally {
      setLoadingReservationId(null);
    }
  };

  const handleComplete = async (reservationId: ReservationID) => {
    setLoadingReservationId(reservationId.value);
    try {
      await completeReservation.mutateAsync(reservationId);
    } finally {
      setLoadingReservationId(null);
    }
  };

  const handleEdit = (reservationId: ReservationID) => {
    // TODO: Implement reservation editing modal
    console.log('Edit reservation:', reservationId.value);
  };

  // Calculate today's metrics
  const todaysMetrics = {
    totalReservations: todaysReservations.length,
    pending: todaysReservations.filter(r => r.status === 'PENDING').length,
    confirmed: todaysReservations.filter(r => r.status === 'CONFIRMED').length,
    checkedIn: todaysReservations.filter(r => r.status === 'CHECKED_IN').length,
    completed: todaysReservations.filter(r => r.status === 'COMPLETED').length,
    cancelled: todaysReservations.filter(r => r.status === 'CANCELLED').length,
    noShow: todaysReservations.filter(r => r.status === 'NO_SHOW').length,
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load reservations</h3>
          <p className="text-gray-600 mb-4">
            There was an error loading reservations. This might be because the backend server is not running.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>To fix this:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Make sure your backend Reservation Service is running</li>
              <li>Check that the API URL is correctly configured</li>
              <li>Verify your network connection</li>
            </ol>
          </div>
          <Button 
            variant="primary" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reservation Management</h1>
        <p className="text-gray-600 mt-2">
          Manage table reservations, check-ins, and waitlist. Auto-refreshes for real-time updates.
        </p>
      </div>

      {/* Reservation Business Rules Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 text-lg">💡</div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Reservation Workflow Rules</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• Reservation status flow: PENDING → CONFIRMED → CHECKED_IN → COMPLETED</li>
              <li>• Customers can be marked as NO_SHOW if they don't arrive within 15 minutes</li>
              <li>• Reservations can be cancelled at any time before completion</li>
              <li>• Waitlist customers get notified when tables become available</li>
              <li>• Special requests and dietary requirements are tracked per reservation</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* View Toggle */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <Button
            variant={selectedView === 'today' ? 'primary' : 'outline'}
            onClick={() => setSelectedView('today')}
          >
            Today's Reservations ({todaysReservations.length})
          </Button>
          <Button
            variant={selectedView === 'all' ? 'primary' : 'outline'}
            onClick={() => setSelectedView('all')}
          >
            All Reservations
          </Button>
          <Button
            variant={selectedView === 'waitlist' ? 'primary' : 'outline'}
            onClick={() => setSelectedView('waitlist')}
          >
            Waitlist ({waitlist.length})
          </Button>
        </div>
      </div>

      {/* Today's Metrics */}
      {selectedView === 'today' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="text-2xl">📅</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Today</p>
                <p className="text-2xl font-bold text-blue-600">
                  {todaysMetrics.totalReservations}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="text-2xl">⏳</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {todaysMetrics.pending}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="text-2xl">✅</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {todaysMetrics.confirmed}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="text-2xl">🚪</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Checked In</p>
                <p className="text-2xl font-bold text-green-600">
                  {todaysMetrics.checkedIn}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="text-2xl">🎉</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {todaysMetrics.completed}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="text-2xl">❌</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {todaysMetrics.cancelled}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="text-2xl">👻</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">No Show</p>
                <p className="text-2xl font-bold text-red-600">
                  {todaysMetrics.noShow}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Overall Metrics */}
      {selectedView === 'all' && metrics && !metricsLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="text-2xl">📊</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reservations</p>
                <p className="text-2xl font-bold text-blue-600">
                  {metrics.totalReservations}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="text-2xl">👥</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Party Size</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.averagePartySize}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="text-2xl">👻</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">No-Show Rate</p>
                <p className="text-2xl font-bold text-red-600">
                  {Math.round(metrics.noShowRate * 100)}%
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="text-2xl">✅</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmed Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round((metrics.confirmedReservations / metrics.totalReservations) * 100)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Waitlist View */}
      {selectedView === 'waitlist' && (
        <Card padding="lg">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Waitlist</h2>
            <p className="text-sm text-gray-600">
              {waitlist.length} customer{waitlist.length !== 1 ? 's' : ''} waiting for tables
            </p>
          </div>

          {waitlistLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Loading waitlist..." />
            </div>
          ) : waitlist.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⏰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers on waitlist</h3>
              <p className="text-gray-600">All tables are available or no one is waiting.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {waitlist.map((customer) => (
                <Card key={customer.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-bold text-orange-600">
                      #{customer.position}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{customer.customerName}</h4>
                      <p className="text-sm text-gray-600">
                        Party of {customer.partySize} • Est. wait: {customer.estimatedWaitTime}min
                      </p>
                      <p className="text-xs text-gray-500">
                        Added: {new Date(customer.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => notifyWaitlistCustomer.mutate(customer.id)}
                      loading={notifyWaitlistCustomer.isLoading}
                    >
                      Notify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromWaitlist.mutate(customer.id)}
                      loading={removeFromWaitlist.isLoading}
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Reservations List */}
      {selectedView !== 'waitlist' && (
        <Card padding="lg">
          <ReservationList
            reservations={reservations}
            loading={loading}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            onCheckIn={handleCheckIn}
            onMarkNoShow={handleMarkNoShow}
            onComplete={handleComplete}
            onEdit={handleEdit}
            loadingReservationId={loadingReservationId || undefined}
            showFilters={selectedView === 'all'}
          />
        </Card>
      )}

      {/* Development Notice */}
      <Card className="mt-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-600 text-lg">🚧</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-900">Development Mode</h3>
            <p className="mt-1 text-sm text-yellow-700">
              This interface is connected to your Go backend Reservation Service API. All reservation operations including 
              status updates, check-ins, cancellations, and waitlist management are ready for backend integration.
            </p>
            <div className="mt-3 space-y-1 text-xs text-yellow-600">
              <p><strong>Real-time Features:</strong> Auto-refresh every 30 seconds, status-aware workflows, overdue alerts</p>
              <p><strong>Workflow Ready:</strong> Complete reservation lifecycle from booking to completion</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Reservation Management Tips */}
      <Card className="mt-6 bg-green-50 border-green-200">
        <div className="flex items-start space-x-3">
          <div className="text-green-600 text-lg">💡</div>
          <div>
            <h3 className="text-sm font-medium text-green-900">Reservation Management Tips</h3>
            <ul className="mt-2 text-sm text-green-700 space-y-1">
              <li>• <strong>Confirm Early:</strong> Confirm reservations as soon as customers call</li>
              <li>• <strong>Check-In Promptly:</strong> Check in customers immediately upon arrival</li>
              <li>• <strong>Track No-Shows:</strong> Mark customers as no-show after 15 minutes</li>
              <li>• <strong>Manage Waitlist:</strong> Notify waitlist customers when tables become available</li>
              <li>• <strong>Real-time Updates:</strong> Status changes automatically sync across all devices</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReservationManagement;