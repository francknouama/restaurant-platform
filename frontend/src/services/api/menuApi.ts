import { apiClient, authenticatedRequest } from '../apiClient';
import {
  Menu,
  MenuID,
  CreateMenuRequest,
  UpdateMenuRequest,
  MenuCategoryRequest,
  MenuItemRequest,
  UpdateMenuItemRequest,
  ApiResponse,
  PaginatedResponse,
  idToString,
  stringToID
} from '../../types';

// Helper function to transform API response to frontend format
const transformMenuFromApi = (apiMenu: any): Menu => ({
  ...apiMenu,
  id: stringToID<'Menu'>(apiMenu.id)
});

// Menu API service matching Go backend endpoints
export const menuApi = {
  // Menu CRUD operations
  getMenus: (): Promise<Menu[]> =>
    authenticatedRequest(() => apiClient.get<ApiResponse<PaginatedResponse<any>>>('/menus'))
      .then(response => response.items.map(transformMenuFromApi)),

  getMenu: (id: MenuID): Promise<Menu> =>
    authenticatedRequest(() => apiClient.get<ApiResponse<any>>(`/menus/${idToString(id)}`))
      .then(transformMenuFromApi),

  getActiveMenu: (): Promise<Menu> =>
    authenticatedRequest(() => apiClient.get<ApiResponse<any>>('/menus/active'))
      .then(transformMenuFromApi),

  createMenu: (data: CreateMenuRequest): Promise<Menu> =>
    authenticatedRequest(() => apiClient.post<ApiResponse<any>>('/menus', data))
      .then(transformMenuFromApi),

  updateMenu: (id: MenuID, data: UpdateMenuRequest): Promise<Menu> =>
    authenticatedRequest(() => 
      apiClient.put<ApiResponse<Menu>>(`/menus/${idToString(id)}`, data)
    ),

  deleteMenu: (id: MenuID): Promise<void> =>
    authenticatedRequest(() => 
      apiClient.delete<ApiResponse<void>>(`/menus/${idToString(id)}`)
    ),

  // Menu activation (business rule: only one active menu)
  activateMenu: (id: MenuID): Promise<void> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<void>>(`/menus/${idToString(id)}/activate`)
    ),

  deactivateMenu: (id: MenuID): Promise<void> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<void>>(`/menus/${idToString(id)}/deactivate`)
    ),

  // Menu versioning
  cloneMenu: (id: MenuID, name?: string): Promise<Menu> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<Menu>>(`/menus/${idToString(id)}/clone`, { name })
    ),

  // Category management
  addCategory: (menuId: MenuID, category: MenuCategoryRequest): Promise<Menu> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<Menu>>(`/menus/${idToString(menuId)}/categories`, category)
    ),

  updateCategory: (
    menuId: MenuID, 
    categoryId: string, 
    category: Partial<MenuCategoryRequest>
  ): Promise<Menu> =>
    authenticatedRequest(() => 
      apiClient.put<ApiResponse<Menu>>(
        `/menus/${idToString(menuId)}/categories/${categoryId}`, 
        category
      )
    ),

  removeCategory: (menuId: MenuID, categoryId: string): Promise<Menu> =>
    authenticatedRequest(() => 
      apiClient.delete<ApiResponse<Menu>>(
        `/menus/${idToString(menuId)}/categories/${categoryId}`
      )
    ),

  reorderCategories: (menuId: MenuID, categoryOrder: string[]): Promise<Menu> =>
    authenticatedRequest(() => 
      apiClient.patch<ApiResponse<Menu>>(
        `/menus/${idToString(menuId)}/categories/reorder`, 
        { categoryOrder }
      )
    ),

  // Menu item management
  addMenuItem: (
    menuId: MenuID, 
    categoryId: string, 
    item: MenuItemRequest
  ): Promise<Menu> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<Menu>>(
        `/menus/${idToString(menuId)}/categories/${categoryId}/items`, 
        item
      )
    ),

  updateMenuItem: (
    menuId: MenuID, 
    categoryId: string, 
    itemId: string, 
    item: UpdateMenuItemRequest
  ): Promise<Menu> =>
    authenticatedRequest(() => 
      apiClient.put<ApiResponse<Menu>>(
        `/menus/${idToString(menuId)}/categories/${categoryId}/items/${itemId}`, 
        item
      )
    ),

  removeMenuItem: (
    menuId: MenuID, 
    categoryId: string, 
    itemId: string
  ): Promise<Menu> =>
    authenticatedRequest(() => 
      apiClient.delete<ApiResponse<Menu>>(
        `/menus/${idToString(menuId)}/categories/${categoryId}/items/${itemId}`
      )
    ),

  // Menu item availability (real-time updates)
  setItemAvailability: (
    menuId: MenuID, 
    categoryId: string, 
    itemId: string, 
    available: boolean
  ): Promise<void> =>
    authenticatedRequest(() => 
      apiClient.patch<ApiResponse<void>>(
        `/menus/${idToString(menuId)}/categories/${categoryId}/items/${itemId}/availability`, 
        { available }
      )
    ),

  // Bulk operations
  bulkUpdateItemAvailability: (
    menuId: MenuID, 
    updates: Array<{
      categoryId: string;
      itemId: string;
      available: boolean;
    }>
  ): Promise<Menu> =>
    authenticatedRequest(() => 
      apiClient.patch<ApiResponse<Menu>>(
        `/menus/${idToString(menuId)}/items/availability/bulk`, 
        { updates }
      )
    ),

  // Menu search and filtering
  searchMenuItems: (query: string, menuId?: MenuID): Promise<PaginatedResponse<any>> =>
    authenticatedRequest(() => {
      const params = new URLSearchParams({ q: query });
      if (menuId) {
        params.append('menuId', idToString(menuId));
      }
      return apiClient.get<ApiResponse<PaginatedResponse<any>>>(`/menus/search?${params}`);
    }),

  // Menu analytics
  getMenuAnalytics: (menuId: MenuID, dateFrom?: string, dateTo?: string): Promise<any> =>
    authenticatedRequest(() => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      return apiClient.get<ApiResponse<any>>(
        `/menus/${idToString(menuId)}/analytics?${params}`
      );
    }),

  // Menu validation
  validateMenu: (menuId: MenuID): Promise<{ isValid: boolean; errors: string[] }> =>
    authenticatedRequest(() => 
      apiClient.post<ApiResponse<{ isValid: boolean; errors: string[] }>>(
        `/menus/${idToString(menuId)}/validate`
      )
    ),
};

export default menuApi;