import { MenuID, MenuCategoryID, MenuItemID, Timestamps } from '../common';

// Menu domain types matching Go backend exactly

export interface Menu extends Timestamps {
  id: MenuID;
  name: string;
  version: number;
  categories: MenuCategory[];
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

export interface MenuCategory {
  id: MenuCategoryID;
  name: string;
  description?: string;
  items: MenuItem[];
  displayOrder: number;
}

export interface MenuItem {
  id: MenuItemID;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  category: string;
  allergens?: string[];
  nutritionalInfo?: NutritionalInfo;
  imageUrl?: string;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

// Request/Response types for API
export interface CreateMenuRequest {
  name: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateMenuRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
}

export interface MenuCategoryRequest {
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface MenuItemRequest {
  name: string;
  description?: string;
  price: number;
  allergens?: string[];
  nutritionalInfo?: NutritionalInfo;
  imageUrl?: string;
}

export interface UpdateMenuItemRequest extends Partial<MenuItemRequest> {
  isAvailable?: boolean;
}

// Business rule validation types
export interface MenuValidationError {
  field: string;
  message: string;
  code: string;
}

// Menu business logic constants
export const MENU_CONSTANTS = {
  MAX_CATEGORIES: 20,
  MAX_ITEMS_PER_CATEGORY: 50,
  MIN_PRICE: 0.01,
  MAX_PRICE: 9999.99,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500
} as const;