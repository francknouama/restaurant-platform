import { 
  Reservation, 
  ReservationID, 
  CreateReservationRequest, 
  UpdateReservationRequest,
  ReservationFilters,
  ReservationStatus,
  TableAvailability
} from '../../types';
import { ApiResponse, PaginatedResponse } from '../../types/common';
import { apiClient, authenticatedRequest } from '../apiClient';

export const reservationApi = {
  // Reservation CRUD Operations
  async getReservations(filters?: ReservationFilters): Promise<PaginatedResponse<Reservation>> {
    const params = new URLSearchParams();
    
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach(s => params.append('status', s));
      } else {
        params.append('status', filters.status);
      }
    }
    if (filters?.date) params.append('date', filters.date);
    if (filters?.tableID) params.append('table_id', filters.tableID);
    if (filters?.customerName) params.append('customer_name', filters.customerName);
    if (filters?.partySize) params.append('party_size', filters.partySize.toString());
    if (filters?.timeFrom) params.append('time_from', filters.timeFrom);
    if (filters?.timeTo) params.append('time_to', filters.timeTo);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<PaginatedResponse<Reservation>>>(
        `/reservations?${params.toString()}`
      )
    );
  },

  async getReservation(id: ReservationID): Promise<Reservation> {
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<Reservation>>(`/reservations/${id.value}`)
    );
  },

  async createReservation(data: CreateReservationRequest): Promise<Reservation> {
    return authenticatedRequest(() => 
      apiClient.post<ApiResponse<Reservation>>('/reservations', data)
    );
  },

  async updateReservation(id: ReservationID, data: UpdateReservationRequest): Promise<Reservation> {
    return authenticatedRequest(() => 
      apiClient.put<ApiResponse<Reservation>>(`/reservations/${id.value}`, data)
    );
  },

  async deleteReservation(id: ReservationID): Promise<void> {
    return authenticatedRequest(() => 
      apiClient.delete(`/reservations/${id.value}`)
    );
  },

  // Reservation Status Management
  async updateReservationStatus(id: ReservationID, status: ReservationStatus): Promise<Reservation> {
    return authenticatedRequest(() => 
      apiClient.patch<ApiResponse<Reservation>>(
        `/reservations/${id.value}/status`, 
        { status }
      )
    );
  },

  async confirmReservation(id: ReservationID): Promise<Reservation> {
    return authenticatedRequest(() => 
      apiClient.post<ApiResponse<Reservation>>(
        `/reservations/${id.value}/confirm`
      )
    );
  },

  async cancelReservation(id: ReservationID, reason?: string): Promise<Reservation> {
    return authenticatedRequest(() => 
      apiClient.post<ApiResponse<Reservation>>(
        `/reservations/${id.value}/cancel`,
        { reason }
      )
    );
  },

  async checkInReservation(id: ReservationID): Promise<Reservation> {
    return authenticatedRequest(() => 
      apiClient.post<ApiResponse<Reservation>>(
        `/reservations/${id.value}/checkin`
      )
    );
  },

  async markNoShow(id: ReservationID): Promise<Reservation> {
    return authenticatedRequest(() => 
      apiClient.post<ApiResponse<Reservation>>(
        `/reservations/${id.value}/no-show`
      )
    );
  },

  async completeReservation(id: ReservationID): Promise<Reservation> {
    return authenticatedRequest(() => 
      apiClient.post<ApiResponse<Reservation>>(
        `/reservations/${id.value}/complete`
      )
    );
  },

  // Table Availability
  async checkTableAvailability(
    date: string, 
    time: string, 
    partySize: number, 
    duration?: number
  ): Promise<TableAvailability[]> {
    const params = new URLSearchParams({
      date,
      time,
      party_size: partySize.toString(),
      ...(duration && { duration: duration.toString() })
    });

    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<TableAvailability[]>>(
        `/reservations/availability?${params.toString()}`
      )
    );
  },

  async getTableAvailabilityForDay(date: string): Promise<TableAvailability[]> {
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<TableAvailability[]>>(
        `/reservations/availability/day/${date}`
      )
    );
  },

  // Table Management
  async getTables(): Promise<string[]> {
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<string[]>>('/tables')
    );
  },

  async getTableInfo(tableId: string): Promise<{
    id: string;
    capacity: number;
    isAvailable: boolean;
    currentReservation?: Reservation;
  }> {
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<any>>(`/tables/${tableId}`)
    );
  },

  // Reservation Search and Filters
  async searchReservations(query: string): Promise<Reservation[]> {
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<Reservation[]>>(
        `/reservations/search?q=${encodeURIComponent(query)}`
      )
    );
  },

  async getReservationsByCustomer(customerName: string): Promise<Reservation[]> {
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<Reservation[]>>(
        `/reservations/customer/${encodeURIComponent(customerName)}`
      )
    );
  },

  async getReservationsByTable(tableId: string, date?: string): Promise<Reservation[]> {
    const params = date ? `?date=${date}` : '';
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<Reservation[]>>(
        `/reservations/table/${tableId}${params}`
      )
    );
  },

  async getTodaysReservations(): Promise<Reservation[]> {
    const today = new Date().toISOString().split('T')[0];
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<Reservation[]>>(
        `/reservations/date/${today}`
      )
    );
  },

  // Bulk Operations
  async bulkUpdateStatus(
    reservationIds: ReservationID[], 
    status: ReservationStatus
  ): Promise<{
    success: Reservation[];
    failed: { id: string; error: string }[];
  }> {
    return authenticatedRequest(() => 
      apiClient.post<ApiResponse<any>>('/reservations/bulk/status', {
        reservation_ids: reservationIds.map(id => id.value),
        status
      })
    );
  },

  async bulkCancel(
    reservationIds: ReservationID[], 
    reason?: string
  ): Promise<{
    success: Reservation[];
    failed: { id: string; error: string }[];
  }> {
    return authenticatedRequest(() => 
      apiClient.post<ApiResponse<any>>('/reservations/bulk/cancel', {
        reservation_ids: reservationIds.map(id => id.value),
        reason
      })
    );
  },

  // Reservation Analytics
  async getReservationMetrics(dateFrom?: string, dateTo?: string): Promise<{
    totalReservations: number;
    confirmedReservations: number;
    cancelledReservations: number;
    noShowRate: number;
    averagePartySize: number;
    busyTimeSlots: { time: string; reservationCount: number }[];
    tableUtilization: { tableId: string; utilizationRate: number }[];
  }> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<any>>(
        `/reservations/metrics?${params.toString()}`
      )
    );
  },

  // Waitlist Management
  async addToWaitlist(data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    partySize: number;
    preferredTime?: string;
    notes?: string;
  }): Promise<{ id: string; estimatedWaitTime: number; position: number }> {
    return authenticatedRequest(() => 
      apiClient.post<ApiResponse<any>>('/reservations/waitlist', data)
    );
  },

  async getWaitlist(): Promise<Array<{
    id: string;
    customerName: string;
    partySize: number;
    estimatedWaitTime: number;
    position: number;
    createdAt: string;
  }>> {
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<any>>('/reservations/waitlist')
    );
  },

  async notifyWaitlistCustomer(waitlistId: string): Promise<void> {
    return authenticatedRequest(() => 
      apiClient.post(`/reservations/waitlist/${waitlistId}/notify`)
    );
  },

  async removeFromWaitlist(waitlistId: string): Promise<void> {
    return authenticatedRequest(() => 
      apiClient.delete(`/reservations/waitlist/${waitlistId}`)
    );
  }
};