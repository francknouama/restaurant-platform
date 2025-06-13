import { apiClient, authenticatedRequest } from '../apiClient';
import {
  KitchenOrder,
  KitchenOrderID,
  KitchenOrderStatus,
  KitchenPriority,
  KitchenItemStatus,
  KitchenOrderFilters,
  KitchenMetrics,
  StationMetrics,
  CreateKitchenOrderRequest,
  UpdateKitchenOrderRequest,
  UpdateKitchenItemRequest,
  ApiResponse,
  PaginatedResponse,
  idToString
} from '../../types';

// Kitchen API service matching Go backend endpoints
export const kitchenApi = {
  // Kitchen order management
  getKitchenOrders: (filters?: KitchenOrderFilters): Promise<PaginatedResponse<KitchenOrder>> => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.status) params.append('status', filters.status.join(','));
      if (filters.priority) params.append('priority', filters.priority.join(','));
      if (filters.station) params.append('station', filters.station);
      if (filters.tableID) params.append('tableId', filters.tableID);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }
    
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<PaginatedResponse<KitchenOrder>>>(`/kitchen/orders?${params}`)
    );
  },

  getKitchenOrder: (id: KitchenOrderID): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.get<ApiResponse<KitchenOrder>>(`/kitchen/orders/${idToString(id)}`)
    ),

  createKitchenOrder: (data: CreateKitchenOrderRequest): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<KitchenOrder>>('/kitchen/orders', data)
    ),

  updateKitchenOrder: (id: KitchenOrderID, data: UpdateKitchenOrderRequest): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.put<ApiResponse<KitchenOrder>>(`/kitchen/orders/${idToString(id)}`, data)
    ),

  deleteKitchenOrder: (id: KitchenOrderID): Promise<void> =>
    authenticatedRequest(() => 
      apiClient.delete<ApiResponse<void>>(`/kitchen/orders/${idToString(id)}`)
    ),

  // Kitchen order status management
  updateOrderStatus: (id: KitchenOrderID, status: KitchenOrderStatus): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.patch<ApiResponse<KitchenOrder>>(
        `/kitchen/orders/${idToString(id)}/status`, 
        { status }
      )
    ),

  // Specific kitchen operations
  startOrderPreparation: (id: KitchenOrderID): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<KitchenOrder>>(
        `/kitchen/orders/${idToString(id)}/start`
      )
    ),

  markOrderReady: (id: KitchenOrderID): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<KitchenOrder>>(
        `/kitchen/orders/${idToString(id)}/ready`
      )
    ),

  completeKitchenOrder: (id: KitchenOrderID): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<KitchenOrder>>(
        `/kitchen/orders/${idToString(id)}/complete`
      )
    ),

  cancelKitchenOrder: (id: KitchenOrderID, reason?: string): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<KitchenOrder>>(
        `/kitchen/orders/${idToString(id)}/cancel`, 
        { reason }
      )
    ),

  // Station assignment
  assignStation: (id: KitchenOrderID, station: string): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.patch<ApiResponse<KitchenOrder>>(
        `/kitchen/orders/${idToString(id)}/station`, 
        { station }
      )
    ),

  unassignStation: (id: KitchenOrderID): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.delete<ApiResponse<KitchenOrder>>(
        `/kitchen/orders/${idToString(id)}/station`
      )
    ),

  // Priority management
  updatePriority: (id: KitchenOrderID, priority: KitchenPriority): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.patch<ApiResponse<KitchenOrder>>(
        `/kitchen/orders/${idToString(id)}/priority`, 
        { priority }
      )
    ),

  // Kitchen item management
  updateKitchenItem: (
    orderId: KitchenOrderID, 
    itemId: string, 
    data: UpdateKitchenItemRequest
  ): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.put<ApiResponse<KitchenOrder>>(
        `/kitchen/orders/${idToString(orderId)}/items/${itemId}`, 
        data
      )
    ),

  startItemPreparation: (orderId: KitchenOrderID, itemId: string): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<KitchenOrder>>(
        `/kitchen/orders/${idToString(orderId)}/items/${itemId}/start`
      )
    ),

  completeItem: (orderId: KitchenOrderID, itemId: string): Promise<KitchenOrder> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<KitchenOrder>>(
        `/kitchen/orders/${idToString(orderId)}/items/${itemId}/complete`
      )
    ),

  // Kitchen queue management
  getKitchenQueue: (station?: string): Promise<KitchenOrder[]> => {
    const params = new URLSearchParams();
    if (station) params.append('station', station);
    
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<KitchenOrder[]>>(`/kitchen/queue?${params}`)
    );
  },

  reorderQueue: (orderIds: KitchenOrderID[]): Promise<void> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<void>>(
        '/kitchen/queue/reorder', 
        { orderIds: orderIds.map(idToString) }
      )
    ),

  // Kitchen metrics and analytics
  getKitchenMetrics: (
    dateFrom?: string, 
    dateTo?: string
  ): Promise<KitchenMetrics> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<KitchenMetrics>>(`/kitchen/metrics?${params}`)
    );
  },

  getStationMetrics: (
    station?: string, 
    dateFrom?: string, 
    dateTo?: string
  ): Promise<StationMetrics[]> => {
    const params = new URLSearchParams();
    if (station) params.append('station', station);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<StationMetrics[]>>(`/kitchen/stations/metrics?${params}`)
    );
  },

  getPerformanceReport: (
    dateFrom: string, 
    dateTo: string
  ): Promise<any> =>
    authenticatedRequest(() => 
      apiClient.get<ApiResponse<any>>(
        `/kitchen/reports/performance?dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
    ),

  // Kitchen stations
  getStations: (): Promise<string[]> =>
    authenticatedRequest(() => 
      apiClient.get<ApiResponse<string[]>>('/kitchen/stations')
    ),

  getStationOrders: (station: string): Promise<KitchenOrder[]> =>
    authenticatedRequest(() => 
      apiClient.get<ApiResponse<KitchenOrder[]>>(`/kitchen/stations/${station}/orders`)
    ),

  // Real-time kitchen updates
  subscribeToKitchenUpdates: (): EventSource => {
    const url = `${process.env.REACT_APP_API_URL || '/api/v1'}/kitchen/events`;
    return new EventSource(url);
  },

  subscribeToStationUpdates: (station: string): EventSource => {
    const url = `${process.env.REACT_APP_API_URL || '/api/v1'}/kitchen/stations/${station}/events`;
    return new EventSource(url);
  },

  // Batch operations
  bulkUpdateStatus: (
    orderIds: KitchenOrderID[], 
    status: KitchenOrderStatus
  ): Promise<{ success: KitchenOrderID[]; failed: KitchenOrderID[] }> =>
    authenticatedRequest(() => 
      apiClient.patch<ApiResponse<{ success: KitchenOrderID[]; failed: KitchenOrderID[] }>>(
        '/kitchen/orders/bulk/status', 
        { 
          orderIds: orderIds.map(idToString), 
          status 
        }
      )
    ),

  bulkAssignStation: (
    orderIds: KitchenOrderID[], 
    station: string
  ): Promise<{ success: KitchenOrderID[]; failed: KitchenOrderID[] }> =>
    authenticatedRequest(() => 
      apiClient.patch<ApiResponse<{ success: KitchenOrderID[]; failed: KitchenOrderID[] }>>(
        '/kitchen/orders/bulk/station', 
        { 
          orderIds: orderIds.map(idToString), 
          station 
        }
      )
    ),

  // Kitchen configuration
  getKitchenSettings: (): Promise<any> =>
    authenticatedRequest(() => 
      apiClient.get<ApiResponse<any>>('/kitchen/settings')
    ),

  updateKitchenSettings: (settings: any): Promise<any> =>
    authenticatedRequest(() => 
      apiClient.put<ApiResponse<any>>('/kitchen/settings', settings)
    ),
};

export default kitchenApi;