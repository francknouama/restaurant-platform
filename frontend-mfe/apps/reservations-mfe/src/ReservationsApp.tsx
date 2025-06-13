import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@restaurant/shared-ui';

// Import all page components
import ReservationCalendarPage from './pages/ReservationCalendarPage';
import ReservationListPage from './pages/ReservationListPage';
import CreateReservationPage from './pages/CreateReservationPage';
import EditReservationPage from './pages/EditReservationPage';
import TableManagementPage from './pages/TableManagementPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import WaitlistManagementPage from './pages/WaitlistManagementPage';
import ReservationAnalyticsPage from './pages/ReservationAnalyticsPage';

// Import styles
import './styles/index.css';

const ReservationsApp: React.FC = () => {
  return (
    <ErrorBoundary mfeName="Reservations MFE">
      <div className="reservations-mfe h-full">
        <Routes>
          {/* Main Calendar View */}
          <Route path="/" element={<ReservationCalendarPage />} />
          <Route path="/calendar" element={<Navigate to="/" replace />} />
          
          {/* Calendar Views */}
          <Route path="/calendar/:view" element={<ReservationCalendarPage />} />
          <Route path="/calendar/:view/:date" element={<ReservationCalendarPage />} />
          
          {/* Reservation Management Routes */}
          <Route path="/reservations" element={<ReservationListPage />} />
          <Route path="/reservations/new" element={<CreateReservationPage />} />
          <Route path="/reservations/:reservationId" element={<EditReservationPage />} />
          <Route path="/reservations/:reservationId/edit" element={<EditReservationPage />} />
          
          {/* Table Management Routes */}
          <Route path="/tables" element={<TableManagementPage />} />
          <Route path="/tables/:tableId" element={<TableManagementPage />} />
          
          {/* Customer Management Routes */}
          <Route path="/customers" element={<CustomerManagementPage />} />
          <Route path="/customers/:customerId" element={<CustomerManagementPage />} />
          
          {/* Waitlist Management Routes */}
          <Route path="/waitlist" element={<WaitlistManagementPage />} />
          
          {/* Analytics Routes */}
          <Route path="/analytics" element={<ReservationAnalyticsPage />} />
          
          {/* Catch all - redirect to calendar */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};

export default ReservationsApp;