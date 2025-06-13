import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { menuApi } from '../services/api';
import {
  MenuID,
  CreateMenuRequest,
  UpdateMenuRequest,
  MenuCategoryRequest,
  MenuItemRequest,
  UpdateMenuItemRequest
} from '../types';

// Query Keys
export const MENU_QUERY_KEYS = {
  all: ['menus'] as const,
  lists: () => [...MENU_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: any) => [...MENU_QUERY_KEYS.lists(), filters] as const,
  details: () => [...MENU_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...MENU_QUERY_KEYS.details(), id] as const,
  active: () => [...MENU_QUERY_KEYS.all, 'active'] as const,
  analytics: (id: string) => [...MENU_QUERY_KEYS.all, 'analytics', id] as const,
};

// Menu Queries
export const useMenus = () => {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.lists(),
    queryFn: menuApi.getMenus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      toast.error(`Failed to load menus: ${error.message}`);
    },
  });
};

export const useMenu = (id: MenuID) => {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.detail(id.value),
    queryFn: () => menuApi.getMenu(id),
    enabled: !!id.value,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      toast.error(`Failed to load menu: ${error.message}`);
    },
  });
};

export const useActiveMenu = () => {
  return useQuery({
    queryKey: MENU_QUERY_KEYS.active(),
    queryFn: menuApi.getActiveMenu,
    staleTime: 1 * 60 * 1000, // 1 minute - active menu changes less frequently
    onError: (error: any) => {
      if (error.statusCode !== 404) {
        toast.error(`Failed to load active menu: ${error.message}`);
      }
    },
  });
};

// Menu Mutations
export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMenuRequest) => menuApi.createMenu(data),
    onSuccess: (newMenu) => {
      // Invalidate and refetch menu lists
      queryClient.invalidateQueries(MENU_QUERY_KEYS.lists());
      
      // Add the new menu to the cache
      queryClient.setQueryData(MENU_QUERY_KEYS.detail(newMenu.id.value), newMenu);
      
      toast.success(`Menu "${newMenu.name}" created successfully!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to create menu: ${error.message}`);
    },
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: MenuID; data: UpdateMenuRequest }) => 
      menuApi.updateMenu(id, data),
    onSuccess: (updatedMenu) => {
      // Update the specific menu in cache
      queryClient.setQueryData(MENU_QUERY_KEYS.detail(updatedMenu.id.value), updatedMenu);
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries(MENU_QUERY_KEYS.lists());
      
      toast.success(`Menu "${updatedMenu.name}" updated successfully!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to update menu: ${error.message}`);
    },
  });
};

export const useActivateMenu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: MenuID) => menuApi.activateMenu(id),
    onSuccess: () => {
      // Invalidate all menu-related queries since activation affects multiple menus
      queryClient.invalidateQueries(MENU_QUERY_KEYS.all);
      
      toast.success('Menu activated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to activate menu: ${error.message}`);
    },
  });
};

export const useCloneMenu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, name }: { id: MenuID; name?: string }) => 
      menuApi.cloneMenu(id, name),
    onSuccess: (clonedMenu) => {
      // Invalidate and refetch menu lists
      queryClient.invalidateQueries(MENU_QUERY_KEYS.lists());
      
      // Add the cloned menu to cache
      queryClient.setQueryData(MENU_QUERY_KEYS.detail(clonedMenu.id.value), clonedMenu);
      
      toast.success(`Menu cloned as "${clonedMenu.name}"!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to clone menu: ${error.message}`);
    },
  });
};

// Category Management
export const useAddCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ menuId, category }: { menuId: MenuID; category: MenuCategoryRequest }) =>
      menuApi.addCategory(menuId, category),
    onSuccess: (updatedMenu) => {
      // Update the menu in cache
      queryClient.setQueryData(MENU_QUERY_KEYS.detail(updatedMenu.id.value), updatedMenu);
      
      toast.success(`Category "${updatedMenu.categories[updatedMenu.categories.length - 1]?.name}" added!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to add category: ${error.message}`);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      menuId, 
      categoryId, 
      category 
    }: { 
      menuId: MenuID; 
      categoryId: string; 
      category: Partial<MenuCategoryRequest> 
    }) => menuApi.updateCategory(menuId, categoryId, category),
    onSuccess: (updatedMenu) => {
      queryClient.setQueryData(MENU_QUERY_KEYS.detail(updatedMenu.id.value), updatedMenu);
      toast.success('Category updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
};

export const useRemoveCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ menuId, categoryId }: { menuId: MenuID; categoryId: string }) =>
      menuApi.removeCategory(menuId, categoryId),
    onSuccess: (updatedMenu) => {
      queryClient.setQueryData(MENU_QUERY_KEYS.detail(updatedMenu.id.value), updatedMenu);
      toast.success('Category removed successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove category: ${error.message}`);
    },
  });
};

// Menu Item Management
export const useAddMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      menuId, 
      categoryId, 
      item 
    }: { 
      menuId: MenuID; 
      categoryId: string; 
      item: MenuItemRequest 
    }) => menuApi.addMenuItem(menuId, categoryId, item),
    onSuccess: (updatedMenu) => {
      queryClient.setQueryData(MENU_QUERY_KEYS.detail(updatedMenu.id.value), updatedMenu);
      toast.success('Menu item added successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to add menu item: ${error.message}`);
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      menuId, 
      categoryId, 
      itemId, 
      item 
    }: { 
      menuId: MenuID; 
      categoryId: string; 
      itemId: string; 
      item: UpdateMenuItemRequest 
    }) => menuApi.updateMenuItem(menuId, categoryId, itemId, item),
    onSuccess: (updatedMenu) => {
      queryClient.setQueryData(MENU_QUERY_KEYS.detail(updatedMenu.id.value), updatedMenu);
      toast.success('Menu item updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update menu item: ${error.message}`);
    },
  });
};

export const useRemoveMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      menuId, 
      categoryId, 
      itemId 
    }: { 
      menuId: MenuID; 
      categoryId: string; 
      itemId: string 
    }) => menuApi.removeMenuItem(menuId, categoryId, itemId),
    onSuccess: (updatedMenu) => {
      queryClient.setQueryData(MENU_QUERY_KEYS.detail(updatedMenu.id.value), updatedMenu);
      toast.success('Menu item removed successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove menu item: ${error.message}`);
    },
  });
};

// Item Availability
export const useSetItemAvailability = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      menuId, 
      categoryId, 
      itemId, 
      available 
    }: { 
      menuId: MenuID; 
      categoryId: string; 
      itemId: string; 
      available: boolean 
    }) => menuApi.setItemAvailability(menuId, categoryId, itemId, available),
    onSuccess: (_, { available }) => {
      // Optimistically update the active menu query if it exists
      queryClient.invalidateQueries(MENU_QUERY_KEYS.active());
      
      toast.success(`Item ${available ? 'enabled' : 'disabled'} successfully!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to update item availability: ${error.message}`);
    },
  });
};