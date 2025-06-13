import { apiClient, authenticatedRequest } from '../apiClient';
import {
  Order,
  OrderID,
  OrderStatus,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderFilters,
  ApiResponse,
  PaginatedResponse,
  idToString
} from '../../types';

// Order API service matching Go backend endpoints
export const orderApi = {
  // Order CRUD operations
  getOrders: (filters?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.status) params.append('status', filters.status.join(','));
      if (filters.type) params.append('type', filters.type.join(','));
      if (filters.customerID) params.append('customerId', filters.customerID);
      if (filters.tableID) params.append('tableId', filters.tableID);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }
    
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<PaginatedResponse<Order>>>(`/orders?${params}`)
    );
  },

  getOrder: (id: OrderID): Promise<Order> =>
    authenticatedRequest(() => 
      apiClient.get<ApiResponse<Order>>(`/orders/${idToString(id)}`)
    ),

  createOrder: (data: CreateOrderRequest): Promise<Order> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<Order>>('/orders', data)
    ),

  updateOrder: (id: OrderID, data: UpdateOrderRequest): Promise<Order> =>
    authenticatedRequest(() => 
      apiClient.put<ApiResponse<Order>>(`/orders/${idToString(id)}`, data)
    ),

  deleteOrder: (id: OrderID): Promise<void> =>
    authenticatedRequest(() => 
      apiClient.delete<ApiResponse<void>>(`/orders/${idToString(id)}`)
    ),

  // Order status management (with business rule validation)
  updateOrderStatus: (id: OrderID, status: OrderStatus): Promise<Order> =>
    authenticatedRequest(() => 
      apiClient.patch<ApiResponse<Order>>(
        `/orders/${idToString(id)}/status`, 
        { status }
      )
    ),

  // Specific status transitions
  payOrder: (id: OrderID, paymentMethod?: string): Promise<Order> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<Order>>(
        `/orders/${idToString(id)}/pay`, 
        { paymentMethod }
      )
    ),

  cancelOrder: (id: OrderID, reason?: string): Promise<Order> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<Order>>(
        `/orders/${idToString(id)}/cancel`, 
        { reason }
      )
    ),

  completeOrder: (id: OrderID): Promise<Order> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<Order>>(`/orders/${idToString(id)}/complete`)
    ),

  // Order items management
  addOrderItem: (id: OrderID, item: any): Promise<Order> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<Order>>(
        `/orders/${idToString(id)}/items`, 
        item
      )
    ),

  updateOrderItem: (id: OrderID, itemId: string, item: any): Promise<Order> =>
    authenticatedRequest(() => 
      apiClient.put<ApiResponse<Order>>(
        `/orders/${idToString(id)}/items/${itemId}`, 
        item
      )
    ),

  removeOrderItem: (id: OrderID, itemId: string): Promise<Order> =>
    authenticatedRequest(() => 
      apiClient.delete<ApiResponse<Order>>(
        `/orders/${idToString(id)}/items/${itemId}`
      )
    ),

  // Order calculations (server-side business logic)
  calculateOrderTotal: (items: any[]): Promise<{ subtotal: number; tax: number; total: number }> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<{ subtotal: number; tax: number; total: number }>>(
        '/orders/calculate', 
        { items }
      )
    ),

  // Customer orders
  getCustomerOrders: (
    customerId: string, 
    filters?: Partial<OrderFilters>
  ): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams({ customerId });
    if (filters) {
      if (filters.status) params.append('status', filters.status.join(','));
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }
    
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<PaginatedResponse<Order>>>(
        `/customers/${customerId}/orders?${params}`
      )
    );
  },

  // Table orders (for dine-in)
  getTableOrders: (
    tableId: string, 
    activeOnly: boolean = true
  ): Promise<Order[]> => {
    const params = new URLSearchParams({ tableId });
    if (activeOnly) params.append('activeOnly', 'true');
    
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<Order[]>>(`/tables/${tableId}/orders?${params}`)
    );
  },

  // Order search
  searchOrders: (query: string, filters?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      if (filters.status) params.append('status', filters.status.join(','));
      if (filters.type) params.append('type', filters.type.join(','));
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }
    
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<PaginatedResponse<Order>>>(`/orders/search?${params}`)
    );
  },

  // Order analytics and reports
  getOrderAnalytics: (
    dateFrom?: string, 
    dateTo?: string, 
    groupBy?: 'day' | 'week' | 'month'
  ): Promise<any> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (groupBy) params.append('groupBy', groupBy);
    
    return authenticatedRequest(() => 
      apiClient.get<ApiResponse<any>>(`/orders/analytics?${params}`)
    );
  },

  getDailyReport: (date: string): Promise<any> =>
    authenticatedRequest(() => 
      apiClient.get<ApiResponse<any>>(`/orders/reports/daily?date=${date}`)
    ),

  // Order validation
  validateOrder: (orderData: CreateOrderRequest): Promise<{ isValid: boolean; errors: string[] }> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<{ isValid: boolean; errors: string[] }>>(
        '/orders/validate', 
        orderData
      )
    ),

  // Real-time order tracking
  subscribeToOrderUpdates: (orderId: OrderID): EventSource => {
    const url = `${process.env.REACT_APP_API_URL || '/api/v1'}/orders/${idToString(orderId)}/events`;
    return new EventSource(url);
  },

  // Batch operations
  bulkUpdateOrderStatus: (
    orderIds: OrderID[], 
    status: OrderStatus
  ): Promise<{ success: OrderID[]; failed: OrderID[] }> =>
    authenticatedRequest(() => 
      apiClient.patch<ApiResponse<{ success: OrderID[]; failed: OrderID[] }>>(
        '/orders/bulk/status', 
        { 
          orderIds: orderIds.map(idToString), 
          status 
        }
      )
    ),
};

export default orderApi;