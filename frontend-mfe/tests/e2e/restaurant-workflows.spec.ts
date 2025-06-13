import { test, expect } from '@playwright/test';

test.describe('Restaurant Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication as admin
    await page.goto('/');
    // Add authentication steps here
  });

  test('complete order workflow: creation to completion', async ({ page }) => {
    // 1. Create new order in Orders MFE
    await page.goto('/orders/new');
    
    await page.fill('input[name="customerName"]', 'John Doe');
    await page.selectOption('select[name="orderType"]', 'DINE_IN');
    await page.selectOption('select[name="tableNumber"]', '5');
    
    // Add menu items
    await page.click('button:has-text("Add Item")');
    await page.selectOption('select[name="menuItem"]', 'burger');
    await page.fill('input[name="quantity"]', '2');
    await page.click('button:has-text("Add to Order")');
    
    await page.click('button:has-text("Add Item")');
    await page.selectOption('select[name="menuItem"]', 'fries');
    await page.fill('input[name="quantity"]', '2');
    await page.click('button:has-text("Add to Order")');
    
    // Submit order
    await page.click('button:has-text("Create Order")');
    await expect(page.locator('text=Order created successfully')).toBeVisible();
    
    // 2. Verify order appears in Kitchen MFE
    await page.goto('/kitchen');
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Table 5')).toBeVisible();
    
    // 3. Start preparing order in kitchen
    const orderCard = page.locator('.order-card:has-text("John Doe")');
    await orderCard.click();
    await page.click('button:has-text("Start Preparing")');
    await expect(orderCard.locator('text=PREPARING')).toBeVisible();
    
    // 4. Mark items as ready
    await page.click('button:has-text("Mark Burger Ready")');
    await page.click('button:has-text("Mark Fries Ready")');
    
    // 5. Complete the order
    await page.click('button:has-text("Order Ready")');
    await expect(orderCard.locator('text=READY')).toBeVisible();
    
    // 6. Verify order status in Orders MFE
    await page.goto('/orders');
    await expect(page.locator('text=John Doe').locator('..').locator('text=READY')).toBeVisible();
    
    // 7. Mark order as completed
    await page.locator('text=John Doe').locator('..').click();
    await page.click('button:has-text("Mark Completed")');
    await expect(page.locator('text=COMPLETED')).toBeVisible();
  });

  test('reservation to table assignment workflow', async ({ page }) => {
    // 1. Create reservation
    await page.goto('/reservations/new');
    
    await page.fill('input[name="customerName"]', 'Jane Smith');
    await page.fill('input[name="customerEmail"]', 'jane@example.com');
    await page.fill('input[name="customerPhone"]', '555-0123');
    await page.selectOption('select[name="partySize"]', '4');
    
    // Set reservation for today
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="date"]', today);
    await page.fill('input[name="time"]', '19:00');
    
    await page.click('button:has-text("Create Reservation")');
    
    // 2. Check reservation in calendar view
    await page.goto('/reservations/calendar');
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    await expect(page.locator('text=19:00')).toBeVisible();
    
    // 3. Assign table when customer arrives
    await page.click('text=Jane Smith');
    await page.selectOption('select[name="tableNumber"]', '8');
    await page.click('button:has-text("Assign Table")');
    
    // 4. Verify table assignment
    await expect(page.locator('text=Table 8')).toBeVisible();
    
    // 5. Create order for the table
    await page.click('button:has-text("Create Order")');
    await expect(page.url()).toContain('/orders/new');
    await expect(page.locator('input[name="customerName"]')).toHaveValue('Jane Smith');
    await expect(page.locator('select[name="tableNumber"]')).toHaveValue('8');
  });

  test('inventory low stock to purchase order workflow', async ({ page }) => {
    // 1. Check inventory status
    await page.goto('/inventory');
    
    // 2. Find low stock item
    await page.click('text=Beef Tenderloin');
    await page.fill('input[name="currentStock"]', '2');
    await page.click('button:has-text("Update Stock")');
    
    // 3. Verify alert appears
    await expect(page.locator('.alert-urgent')).toBeVisible();
    await expect(page.locator('text=Low Stock Alert')).toBeVisible();
    
    // 4. Create purchase order
    await page.click('button:has-text("Create Purchase Order")');
    
    // 5. Fill purchase order form
    await page.selectOption('select[name="supplier"]', 'Premium Foods Co.');
    await page.fill('input[name="quantity"]', '50');
    await page.fill('textarea[name="notes"]', 'Urgent restock needed');
    
    await page.click('button:has-text("Submit Order")');
    
    // 6. Verify purchase order created
    await expect(page.locator('text=Purchase order created')).toBeVisible();
    
    // 7. Check purchase orders list
    await page.goto('/inventory/purchase-orders');
    await expect(page.locator('text=Premium Foods Co.')).toBeVisible();
    await expect(page.locator('text=Beef Tenderloin')).toBeVisible();
    await expect(page.locator('text=PENDING')).toBeVisible();
  });

  test('kitchen queue management during peak hours', async ({ page }) => {
    // 1. Create multiple orders
    const orders = [
      { customer: 'Order 1', table: '1', items: ['burger', 'fries'] },
      { customer: 'Order 2', table: '2', items: ['pizza', 'salad'] },
      { customer: 'Order 3', table: '3', items: ['pasta', 'bread'] },
    ];

    for (const order of orders) {
      await page.goto('/orders/new');
      await page.fill('input[name="customerName"]', order.customer);
      await page.selectOption('select[name="tableNumber"]', order.table);
      
      for (const item of order.items) {
        await page.click('button:has-text("Add Item")');
        await page.selectOption('select[name="menuItem"]', item);
        await page.fill('input[name="quantity"]', '1');
        await page.click('button:has-text("Add to Order")');
      }
      
      await page.click('button:has-text("Create Order")');
    }

    // 2. Navigate to kitchen and verify queue
    await page.goto('/kitchen');
    
    // All orders should be visible
    await expect(page.locator('text=Order 1')).toBeVisible();
    await expect(page.locator('text=Order 2')).toBeVisible();
    await expect(page.locator('text=Order 3')).toBeVisible();
    
    // 3. Test priority reordering
    await page.click('text=Order 3');
    await page.click('button:has-text("Mark High Priority")');
    
    // Order 3 should move to top of queue
    const firstOrder = page.locator('.order-card').first();
    await expect(firstOrder.locator('text=Order 3')).toBeVisible();
    
    // 4. Assign orders to stations
    await page.click('text=Order 1');
    await page.selectOption('select[name="station"]', 'grill');
    await page.click('button:has-text("Assign Station")');
    
    await page.click('text=Order 2');
    await page.selectOption('select[name="station"]', 'pizza');
    await page.click('button:has-text("Assign Station")');
    
    // 5. Verify station assignments
    await expect(page.locator('text=Grill Station')).toBeVisible();
    await expect(page.locator('text=Pizza Station')).toBeVisible();
  });

  test('end-to-end analytics and reporting', async ({ page }) => {
    // 1. Generate some activity across MFEs
    
    // Create orders
    await page.goto('/orders/new');
    await page.fill('input[name="customerName"]', 'Analytics Test');
    await page.click('button:has-text("Create Order")');
    
    // Process in kitchen
    await page.goto('/kitchen');
    await page.click('text=Analytics Test');
    await page.click('button:has-text("Start Preparing")');
    await page.click('button:has-text("Order Ready")');
    
    // Update inventory
    await page.goto('/inventory');
    await page.click('text=Burger Patties');
    await page.fill('input[name="consumed"]', '5');
    await page.click('button:has-text("Update Usage")');
    
    // 2. Check analytics in each MFE
    
    // Orders analytics
    await page.goto('/orders/analytics');
    await expect(page.locator('text=Orders Today')).toBeVisible();
    await expect(page.locator('text=Average Preparation Time')).toBeVisible();
    
    // Kitchen analytics
    await page.goto('/kitchen/analytics');
    await expect(page.locator('text=Orders Completed')).toBeVisible();
    await expect(page.locator('text=Station Efficiency')).toBeVisible();
    
    // Inventory analytics
    await page.goto('/inventory/analytics');
    await expect(page.locator('text=Stock Turnover')).toBeVisible();
    await expect(page.locator('text=Low Stock Items')).toBeVisible();
    
    // Reservations analytics
    await page.goto('/reservations/analytics');
    await expect(page.locator('text=Occupancy Rate')).toBeVisible();
    await expect(page.locator('text=Peak Hours')).toBeVisible();
    
    // 3. Dashboard summary
    await page.goto('/dashboard');
    await expect(page.locator('text=Today\'s Revenue')).toBeVisible();
    await expect(page.locator('text=Active Tables')).toBeVisible();
    await expect(page.locator('text=Kitchen Queue')).toBeVisible();
  });
});