// Mock service for menu operations
// This will be replaced with real API calls in the future

export interface Menu {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  order: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  allergens?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  imageUrl?: string;
}

// Mock data
const mockMenus: Menu[] = [
  {
    id: 'menu-1',
    name: 'Spring Menu 2024',
    description: 'Fresh seasonal offerings',
    active: true,
    version: '1.0',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    categories: []
  }
];

const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Grilled Salmon',
    description: 'Fresh Atlantic salmon with seasonal vegetables',
    price: 24.99,
    category: 'Main Course',
    available: true,
    allergens: ['fish'],
    nutritionalInfo: { calories: 450, protein: 35, carbs: 10, fat: 20 }
  },
  {
    id: '2',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce with house-made dressing',
    price: 12.99,
    category: 'Appetizers',
    available: true,
    allergens: ['dairy', 'gluten']
  },
  {
    id: '3',
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with vanilla ice cream',
    price: 8.99,
    category: 'Desserts',
    available: false,
    allergens: ['dairy', 'gluten', 'eggs']
  },
  {
    id: '4',
    name: 'Beef Tenderloin',
    description: 'Premium beef tenderloin with red wine reduction',
    price: 32.99,
    category: 'Main Course',
    available: true
  }
];

export class MenuService {
  private static delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Menu operations
  static async getMenus(): Promise<Menu[]> {
    await this.delay();
    return [...mockMenus];
  }

  static async getMenu(id: string): Promise<Menu | null> {
    await this.delay();
    return mockMenus.find(menu => menu.id === id) || null;
  }

  static async getActiveMenu(): Promise<Menu | null> {
    await this.delay();
    return mockMenus.find(menu => menu.active) || null;
  }

  static async createMenu(menu: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>): Promise<Menu> {
    await this.delay();
    const newMenu: Menu = {
      ...menu,
      id: `menu-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockMenus.push(newMenu);
    return newMenu;
  }

  static async updateMenu(id: string, updates: Partial<Menu>): Promise<Menu | null> {
    await this.delay();
    const index = mockMenus.findIndex(menu => menu.id === id);
    if (index === -1) return null;

    mockMenus[index] = {
      ...mockMenus[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return mockMenus[index];
  }

  static async deleteMenu(id: string): Promise<boolean> {
    await this.delay();
    const index = mockMenus.findIndex(menu => menu.id === id);
    if (index === -1) return false;

    mockMenus.splice(index, 1);
    return true;
  }

  static async activateMenu(id: string): Promise<Menu | null> {
    await this.delay();
    // Deactivate all menus
    mockMenus.forEach(menu => menu.active = false);
    
    // Activate the specified menu
    const menu = mockMenus.find(menu => menu.id === id);
    if (menu) {
      menu.active = true;
      menu.updatedAt = new Date().toISOString();
      return menu;
    }
    return null;
  }

  // Menu item operations
  static async getMenuItems(menuId?: string): Promise<MenuItem[]> {
    await this.delay();
    return [...mockMenuItems];
  }

  static async getMenuItem(id: string): Promise<MenuItem | null> {
    await this.delay();
    return mockMenuItems.find(item => item.id === id) || null;
  }

  static async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    await this.delay();
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}`
    };
    mockMenuItems.push(newItem);
    return newItem;
  }

  static async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
    await this.delay();
    const index = mockMenuItems.findIndex(item => item.id === id);
    if (index === -1) return null;

    mockMenuItems[index] = {
      ...mockMenuItems[index],
      ...updates
    };
    return mockMenuItems[index];
  }

  static async deleteMenuItem(id: string): Promise<boolean> {
    await this.delay();
    const index = mockMenuItems.findIndex(item => item.id === id);
    if (index === -1) return false;

    mockMenuItems.splice(index, 1);
    return true;
  }

  static async toggleMenuItemAvailability(id: string): Promise<MenuItem | null> {
    await this.delay();
    const item = mockMenuItems.find(item => item.id === id);
    if (item) {
      item.available = !item.available;
      return item;
    }
    return null;
  }

  // Category operations
  static async getCategories(): Promise<Category[]> {
    await this.delay();
    const categories = [...new Set(mockMenuItems.map(item => item.category))]
      .map((categoryName, index) => ({
        id: `category-${index}`,
        name: categoryName,
        order: index,
        items: mockMenuItems.filter(item => item.category === categoryName)
      }));
    return categories;
  }

  // Analytics operations
  static async getMenuAnalytics(menuId?: string): Promise<{
    totalItems: number;
    availableItems: number;
    categories: number;
    popularItems: MenuItem[];
    revenueByCategory: { category: string; revenue: number }[];
  }> {
    await this.delay();
    
    const availableItems = mockMenuItems.filter(item => item.available);
    const categories = [...new Set(mockMenuItems.map(item => item.category))];
    
    return {
      totalItems: mockMenuItems.length,
      availableItems: availableItems.length,
      categories: categories.length,
      popularItems: mockMenuItems.slice(0, 3), // Mock popular items
      revenueByCategory: categories.map(category => ({
        category,
        revenue: Math.random() * 1000 // Mock revenue data
      }))
    };
  }
}