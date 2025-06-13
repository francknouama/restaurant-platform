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
import { apiClient } from '../apiClient';

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

    const response = await apiClient.get<PaginatedResponse<Reservation>>(
      `/reservations?${params.toString()}`
    );
    return response.data;
  },

  async getReservation(id: ReservationID): Promise<Reservation> {
    const response = await apiClient.get<ApiResponse<Reservation>>(`/reservations/${id.value}`);
    return response.data.data!;
  },

  async createReservation(data: CreateReservationRequest): Promise<Reservation> {
    const response = await apiClient.post<ApiResponse<Reservation>>('/reservations', data);
    return response.data.data!;
  },

  async updateReservation(id: ReservationID, data: UpdateReservationRequest): Promise<Reservation> {
    const response = await apiClient.put<ApiResponse<Reservation>>(`/reservations/${id.value}`, data);
    return response.data.data!;
  },

  async deleteReservation(id: ReservationID): Promise<void> {
    await apiClient.delete(`/reservations/${id.value}`);
  },

  // Reservation Status Management
  async updateReservationStatus(id: ReservationID, status: ReservationStatus): Promise<Reservation> {
    const response = await apiClient.patch<ApiResponse<Reservation>>(
      `/reservations/${id.value}/status`, 
      { status }
    );
    return response.data.data!;
  },

  async confirmReservation(id: ReservationID): Promise<Reservation> {
    const response = await apiClient.post<ApiResponse<Reservation>>(
      `/reservations/${id.value}/confirm`
    );
    return response.data.data!;
  },

  async cancelReservation(id: ReservationID, reason?: string): Promise<Reservation> {
    const response = await apiClient.post<ApiResponse<Reservation>>(
      `/reservations/${id.value}/cancel`,
      { reason }
    );
    return response.data.data!;
  },

  async checkInReservation(id: ReservationID): Promise<Reservation> {
    const response = await apiClient.post<ApiResponse<Reservation>>(
      `/reservations/${id.value}/checkin`
    );
    return response.data.data!;
  },

  async markNoShow(id: ReservationID): Promise<Reservation> {
    const response = await apiClient.post<ApiResponse<Reservation>>(
      `/reservations/${id.value}/no-show`
    );
    return response.data.data!;
  },

  async completeReservation(id: ReservationID): Promise<Reservation> {
    const response = await apiClient.post<ApiResponse<Reservation>>(
      `/reservations/${id.value}/complete`
    );
    return response.data.data!;
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

    const response = await apiClient.get<ApiResponse<TableAvailability[]>>(
      `/reservations/availability?${params.toString()}`
    );
    return response.data.data!;
  },

  async getTableAvailabilityForDay(date: string): Promise<TableAvailability[]> {
    const response = await apiClient.get<ApiResponse<TableAvailability[]>>(
      `/reservations/availability/day/${date}`
    );
    return response.data.data!;
  },

  // Table Management
  async getTables(): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>('/tables');
    return response.data.data!;
  },

  async getTableInfo(tableId: string): Promise<{
    id: string;
    capacity: number;
    isAvailable: boolean;
    currentReservation?: Reservation;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(`/tables/${tableId}`);
    return response.data.data!;
  },

  // Reservation Search and Filters
  async searchReservations(query: string): Promise<Reservation[]> {
    const response = await apiClient.get<ApiResponse<Reservation[]>>(
      `/reservations/search?q=${encodeURIComponent(query)}`
    );
    return response.data.data!;
  },

  async getReservationsByCustomer(customerName: string): Promise<Reservation[]> {
    const response = await apiClient.get<ApiResponse<Reservation[]>>(
      `/reservations/customer/${encodeURIComponent(customerName)}`
    );
    return response.data.data!;
  },

  async getReservationsByTable(tableId: string, date?: string): Promise<Reservation[]> {
    const params = date ? `?date=${date}` : '';
    const response = await apiClient.get<ApiResponse<Reservation[]>>(
      `/reservations/table/${tableId}${params}`
    );
    return response.data.data!;
  },

  async getTodaysReservations(): Promise<Reservation[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await apiClient.get<ApiResponse<Reservation[]>>(
      `/reservations/date/${today}`
    );
    return response.data.data!;
  },

  // Bulk Operations
  async bulkUpdateStatus(
    reservationIds: ReservationID[], 
    status: ReservationStatus
  ): Promise<{
    success: Reservation[];
    failed: { id: string; error: string }[];
  }> {
    const response = await apiClient.post<ApiResponse<any>>('/reservations/bulk/status', {
      reservation_ids: reservationIds.map(id => id.value),
      status
    });
    return response.data.data!;
  },

  async bulkCancel(
    reservationIds: ReservationID[], 
    reason?: string
  ): Promise<{
    success: Reservation[];
    failed: { id: string; error: string }[];
  }> {
    const response = await apiClient.post<ApiResponse<any>>('/reservations/bulk/cancel', {
      reservation_ids: reservationIds.map(id => id.value),
      reason
    });
    return response.data.data!;
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

    const response = await apiClient.get<ApiResponse<any>>(
      `/reservations/metrics?${params.toString()}`
    );
    return response.data.data!;
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
    const response = await apiClient.post<ApiResponse<any>>('/reservations/waitlist', data);
    return response.data.data!;
  },

  async getWaitlist(): Promise<Array<{
    id: string;
    customerName: string;
    partySize: number;
    estimatedWaitTime: number;
    position: number;
    createdAt: string;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>('/reservations/waitlist');
    return response.data.data!;
  },

  async notifyWaitlistCustomer(waitlistId: string): Promise<void> {
    await apiClient.post(`/reservations/waitlist/${waitlistId}/notify`);
  },

  async removeFromWaitlist(waitlistId: string): Promise<void> {
    await apiClient.delete(`/reservations/waitlist/${waitlistId}`);
  }
};