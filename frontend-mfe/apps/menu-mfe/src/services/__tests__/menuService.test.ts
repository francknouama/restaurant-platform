import { MenuService, Menu, MenuItem, Category } from '../menuService';

describe('MenuService', () => {
  beforeEach(() => {
    // Reset any mocked timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Menu Operations', () => {
    describe('getMenus', () => {
      it('should return array of menus', async () => {
        const promise = MenuService.getMenus();
        jest.advanceTimersByTime(500);
        const menus = await promise;

        expect(Array.isArray(menus)).toBe(true);
        expect(menus.length).toBeGreaterThan(0);
        expect(menus[0]).toHaveProperty('id');
        expect(menus[0]).toHaveProperty('name');
        expect(menus[0]).toHaveProperty('active');
      });

      it('should include required menu properties', async () => {
        const promise = MenuService.getMenus();
        jest.advanceTimersByTime(500);
        const menus = await promise;

        menus.forEach(menu => {
          expect(menu).toHaveProperty('id');
          expect(menu).toHaveProperty('name');
          expect(menu).toHaveProperty('active');
          expect(menu).toHaveProperty('version');
          expect(menu).toHaveProperty('createdAt');
          expect(menu).toHaveProperty('updatedAt');
          expect(menu).toHaveProperty('categories');
        });
      });
    });

    describe('getMenu', () => {
      it('should return specific menu by id', async () => {
        const promise = MenuService.getMenu('menu-1');
        jest.advanceTimersByTime(500);
        const menu = await promise;

        expect(menu).not.toBeNull();
        expect(menu?.id).toBe('menu-1');
        expect(menu?.name).toBe('Spring Menu 2024');
      });

      it('should return null for non-existent menu', async () => {
        const promise = MenuService.getMenu('non-existent');
        jest.advanceTimersByTime(500);
        const menu = await promise;

        expect(menu).toBeNull();
      });
    });

    describe('getActiveMenu', () => {
      it('should return active menu', async () => {
        const promise = MenuService.getActiveMenu();
        jest.advanceTimersByTime(500);
        const menu = await promise;

        expect(menu).not.toBeNull();
        expect(menu?.active).toBe(true);
      });
    });

    describe('createMenu', () => {
      it('should create new menu with generated id', async () => {
        const newMenuData = {
          name: 'Test Menu',
          description: 'Test description',
          active: false,
          version: '1.0',
          categories: []
        };

        const promise = MenuService.createMenu(newMenuData);
        jest.advanceTimersByTime(500);
        const createdMenu = await promise;

        expect(createdMenu).toHaveProperty('id');
        expect(createdMenu.id).toMatch(/^menu-\d+$/);
        expect(createdMenu.name).toBe(newMenuData.name);
        expect(createdMenu.description).toBe(newMenuData.description);
        expect(createdMenu).toHaveProperty('createdAt');
        expect(createdMenu).toHaveProperty('updatedAt');
      });

      it('should generate valid timestamps', async () => {
        const newMenuData = {
          name: 'Test Menu',
          active: false,
          version: '1.0',
          categories: []
        };

        const promise = MenuService.createMenu(newMenuData);
        jest.advanceTimersByTime(500);
        const createdMenu = await promise;

        expect(new Date(createdMenu.createdAt)).toBeInstanceOf(Date);
        expect(new Date(createdMenu.updatedAt)).toBeInstanceOf(Date);
      });
    });

    describe('updateMenu', () => {
      it('should update existing menu', async () => {
        const updates = { name: 'Updated Menu Name' };
        
        const promise = MenuService.updateMenu('menu-1', updates);
        jest.advanceTimersByTime(500);
        const updatedMenu = await promise;

        expect(updatedMenu).not.toBeNull();
        expect(updatedMenu?.name).toBe('Updated Menu Name');
        expect(updatedMenu?.id).toBe('menu-1');
      });

      it('should update timestamp on menu update', async () => {
        const promise = MenuService.updateMenu('menu-1', { name: 'Updated' });
        jest.advanceTimersByTime(500);
        const updatedMenu = await promise;

        expect(updatedMenu?.updatedAt).toBeTruthy();
        expect(new Date(updatedMenu!.updatedAt)).toBeInstanceOf(Date);
      });

      it('should return null for non-existent menu', async () => {
        const promise = MenuService.updateMenu('non-existent', { name: 'Updated' });
        jest.advanceTimersByTime(500);
        const result = await promise;

        expect(result).toBeNull();
      });
    });

    describe('deleteMenu', () => {
      it('should delete existing menu', async () => {
        // First create a menu to delete
        const createPromise = MenuService.createMenu({
          name: 'To Delete',
          active: false,
          version: '1.0',
          categories: []
        });
        jest.advanceTimersByTime(500);
        const createdMenu = await createPromise;

        // Then delete it
        const deletePromise = MenuService.deleteMenu(createdMenu.id);
        jest.advanceTimersByTime(500);
        const result = await deletePromise;

        expect(result).toBe(true);
      });

      it('should return false for non-existent menu', async () => {
        const promise = MenuService.deleteMenu('non-existent');
        jest.advanceTimersByTime(500);
        const result = await promise;

        expect(result).toBe(false);
      });
    });

    describe('activateMenu', () => {
      it('should activate menu and deactivate others', async () => {
        // Create a second menu
        const createPromise = MenuService.createMenu({
          name: 'Second Menu',
          active: false,
          version: '1.0',
          categories: []
        });
        jest.advanceTimersByTime(500);
        const newMenu = await createPromise;

        // Activate the new menu
        const activatePromise = MenuService.activateMenu(newMenu.id);
        jest.advanceTimersByTime(500);
        const activatedMenu = await activatePromise;

        expect(activatedMenu).not.toBeNull();
        expect(activatedMenu?.active).toBe(true);
        expect(activatedMenu?.id).toBe(newMenu.id);
      });

      it('should return null for non-existent menu', async () => {
        const promise = MenuService.activateMenu('non-existent');
        jest.advanceTimersByTime(500);
        const result = await promise;

        expect(result).toBeNull();
      });
    });
  });

  describe('Menu Item Operations', () => {
    describe('getMenuItems', () => {
      it('should return array of menu items', async () => {
        const promise = MenuService.getMenuItems();
        jest.advanceTimersByTime(500);
        const items = await promise;

        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThan(0);
        expect(items[0]).toHaveProperty('id');
        expect(items[0]).toHaveProperty('name');
        expect(items[0]).toHaveProperty('price');
      });

      it('should include required item properties', async () => {
        const promise = MenuService.getMenuItems();
        jest.advanceTimersByTime(500);
        const items = await promise;

        items.forEach(item => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('name');
          expect(item).toHaveProperty('price');
          expect(item).toHaveProperty('category');
          expect(item).toHaveProperty('available');
          expect(typeof item.price).toBe('number');
          expect(typeof item.available).toBe('boolean');
        });
      });
    });

    describe('getMenuItem', () => {
      it('should return specific menu item by id', async () => {
        const promise = MenuService.getMenuItem('1');
        jest.advanceTimersByTime(500);
        const item = await promise;

        expect(item).not.toBeNull();
        expect(item?.id).toBe('1');
        expect(item?.name).toBe('Grilled Salmon');
      });

      it('should return null for non-existent item', async () => {
        const promise = MenuService.getMenuItem('non-existent');
        jest.advanceTimersByTime(500);
        const item = await promise;

        expect(item).toBeNull();
      });
    });

    describe('createMenuItem', () => {
      it('should create new menu item with generated id', async () => {
        const newItemData = {
          name: 'Test Dish',
          description: 'Test description',
          price: 15.99,
          category: 'Test Category',
          available: true
        };

        const promise = MenuService.createMenuItem(newItemData);
        jest.advanceTimersByTime(500);
        const createdItem = await promise;

        expect(createdItem).toHaveProperty('id');
        expect(createdItem.id).toMatch(/^item-\d+$/);
        expect(createdItem.name).toBe(newItemData.name);
        expect(createdItem.price).toBe(newItemData.price);
        expect(createdItem.category).toBe(newItemData.category);
      });
    });

    describe('updateMenuItem', () => {
      it('should update existing menu item', async () => {
        const updates = { name: 'Updated Salmon', price: 26.99 };
        
        const promise = MenuService.updateMenuItem('1', updates);
        jest.advanceTimersByTime(500);
        const updatedItem = await promise;

        expect(updatedItem).not.toBeNull();
        expect(updatedItem?.name).toBe('Updated Salmon');
        expect(updatedItem?.price).toBe(26.99);
        expect(updatedItem?.id).toBe('1');
      });

      it('should return null for non-existent item', async () => {
        const promise = MenuService.updateMenuItem('non-existent', { name: 'Updated' });
        jest.advanceTimersByTime(500);
        const result = await promise;

        expect(result).toBeNull();
      });
    });

    describe('deleteMenuItem', () => {
      it('should delete existing menu item', async () => {
        // First create an item to delete
        const createPromise = MenuService.createMenuItem({
          name: 'To Delete',
          price: 10.99,
          category: 'Test',
          available: true
        });
        jest.advanceTimersByTime(500);
        const createdItem = await createPromise;

        // Then delete it
        const deletePromise = MenuService.deleteMenuItem(createdItem.id);
        jest.advanceTimersByTime(500);
        const result = await deletePromise;

        expect(result).toBe(true);
      });

      it('should return false for non-existent item', async () => {
        const promise = MenuService.deleteMenuItem('non-existent');
        jest.advanceTimersByTime(500);
        const result = await promise;

        expect(result).toBe(false);
      });
    });

    describe('toggleMenuItemAvailability', () => {
      it('should toggle item availability', async () => {
        // Get current state
        const getPromise = MenuService.getMenuItem('1');
        jest.advanceTimersByTime(500);
        const originalItem = await getPromise;
        const originalAvailability = originalItem?.available;

        // Toggle availability
        const togglePromise = MenuService.toggleMenuItemAvailability('1');
        jest.advanceTimersByTime(500);
        const toggledItem = await togglePromise;

        expect(toggledItem).not.toBeNull();
        expect(toggledItem?.available).toBe(!originalAvailability);
        expect(toggledItem?.id).toBe('1');
      });

      it('should return null for non-existent item', async () => {
        const promise = MenuService.toggleMenuItemAvailability('non-existent');
        jest.advanceTimersByTime(500);
        const result = await promise;

        expect(result).toBeNull();
      });
    });
  });

  describe('Category Operations', () => {
    describe('getCategories', () => {
      it('should return array of categories', async () => {
        const promise = MenuService.getCategories();
        jest.advanceTimersByTime(500);
        const categories = await promise;

        expect(Array.isArray(categories)).toBe(true);
        expect(categories.length).toBeGreaterThan(0);
      });

      it('should include category properties', async () => {
        const promise = MenuService.getCategories();
        jest.advanceTimersByTime(500);
        const categories = await promise;

        categories.forEach(category => {
          expect(category).toHaveProperty('id');
          expect(category).toHaveProperty('name');
          expect(category).toHaveProperty('order');
          expect(category).toHaveProperty('items');
          expect(Array.isArray(category.items)).toBe(true);
        });
      });

      it('should group items by category', async () => {
        const promise = MenuService.getCategories();
        jest.advanceTimersByTime(500);
        const categories = await promise;

        const mainCourseCategory = categories.find(cat => cat.name === 'Main Course');
        expect(mainCourseCategory).toBeTruthy();
        expect(mainCourseCategory?.items.length).toBeGreaterThan(0);
        
        // All items in this category should have the same category name
        mainCourseCategory?.items.forEach(item => {
          expect(item.category).toBe('Main Course');
        });
      });
    });
  });

  describe('Analytics Operations', () => {
    describe('getMenuAnalytics', () => {
      it('should return analytics data', async () => {
        const promise = MenuService.getMenuAnalytics();
        jest.advanceTimersByTime(500);
        const analytics = await promise;

        expect(analytics).toHaveProperty('totalItems');
        expect(analytics).toHaveProperty('availableItems');
        expect(analytics).toHaveProperty('categories');
        expect(analytics).toHaveProperty('popularItems');
        expect(analytics).toHaveProperty('revenueByCategory');
      });

      it('should return correct data types', async () => {
        const promise = MenuService.getMenuAnalytics();
        jest.advanceTimersByTime(500);
        const analytics = await promise;

        expect(typeof analytics.totalItems).toBe('number');
        expect(typeof analytics.availableItems).toBe('number');
        expect(typeof analytics.categories).toBe('number');
        expect(Array.isArray(analytics.popularItems)).toBe(true);
        expect(Array.isArray(analytics.revenueByCategory)).toBe(true);
      });

      it('should return valid revenue data', async () => {
        const promise = MenuService.getMenuAnalytics();
        jest.advanceTimersByTime(500);
        const analytics = await promise;

        analytics.revenueByCategory.forEach(revenue => {
          expect(revenue).toHaveProperty('category');
          expect(revenue).toHaveProperty('revenue');
          expect(typeof revenue.category).toBe('string');
          expect(typeof revenue.revenue).toBe('number');
        });
      });
    });
  });

  describe('Service Response Times', () => {
    it('should respect delay timing', async () => {
      const startTime = Date.now();
      const promise = MenuService.getMenus();
      
      // Advance timers by less than the delay
      jest.advanceTimersByTime(300);
      
      // Promise should not be resolved yet
      let resolved = false;
      promise.then(() => { resolved = true; });
      await Promise.resolve(); // Let any immediate promises resolve
      expect(resolved).toBe(false);
      
      // Advance timers to complete the delay
      jest.advanceTimersByTime(200);
      await promise;
      expect(resolved).toBe(false); // Still checking async behavior
    });
  });

  describe('Error Handling', () => {
    it('should handle async operations without throwing', async () => {
      const operations = [
        MenuService.getMenus(),
        MenuService.getMenu('test'),
        MenuService.getMenuItems(),
        MenuService.getCategories(),
        MenuService.getMenuAnalytics()
      ];

      // Advance time for all operations
      jest.advanceTimersByTime(500);

      await expect(Promise.all(operations)).resolves.toBeTruthy();
    });
  });
});