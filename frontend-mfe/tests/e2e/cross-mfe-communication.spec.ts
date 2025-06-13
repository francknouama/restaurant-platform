import { test, expect } from '@playwright/test';

test.describe('Cross-MFE Communication', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and navigate to dashboard
    await page.goto('/');
    // Add authentication steps here based on your implementation
  });

  test('should communicate order creation from Orders to Kitchen MFE', async ({ page }) => {
    // Navigate to Orders MFE
    await page.goto('/orders/new');
    
    // Create a new order
    await page.fill('input[placeholder="Customer name"]', 'John Doe');
    await page.selectOption('select[name="orderType"]', 'DINE_IN');
    
    // Add menu items to order
    await page.click('text=Add Item');
    await page.selectOption('select[name="menuItem"]', 'burger');
    await page.fill('input[name="quantity"]', '2');
    await page.click('button:has-text("Add to Order")');
    
    // Submit the order
    await page.click('button:has-text("Create Order")');
    
    // Verify order was created
    await expect(page.locator('text=Order created successfully')).toBeVisible();
    
    // Navigate to Kitchen MFE
    await page.goto('/kitchen');
    
    // Verify the order appears in kitchen queue
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=burger')).toBeVisible();
    await expect(page.locator('text=DINE_IN')).toBeVisible();
  });

  test('should update order status from Kitchen to Orders MFE', async ({ page }) => {
    // Navigate to Kitchen MFE
    await page.goto('/kitchen');
    
    // Find an order in the queue and update its status
    const orderCard = page.locator('.order-card').first();
    await orderCard.click();
    
    // Change status to "Preparing"
    await page.click('button:has-text("Start Preparing")');
    
    // Verify status updated in Kitchen
    await expect(orderCard.locator('text=PREPARING')).toBeVisible();
    
    // Navigate to Orders MFE
    await page.goto('/orders');
    
    // Verify the same order shows updated status
    await expect(page.locator('text=PREPARING')).toBeVisible();
  });

  test('should trigger inventory alerts when stock is low', async ({ page }) => {
    // Navigate to Inventory MFE
    await page.goto('/inventory');
    
    // Simulate low stock scenario
    await page.click('text=Beef Tenderloin');
    await page.fill('input[name="currentStock"]', '2');
    await page.click('button:has-text("Update Stock")');
    
    // Navigate to Dashboard
    await page.goto('/dashboard');
    
    // Verify low stock alert appears
    await expect(page.locator('text=Low Stock Alert')).toBeVisible();
    await expect(page.locator('text=Beef Tenderloin')).toBeVisible();
  });

  test('should create reservation and show in dashboard', async ({ page }) => {
    // Navigate to Reservations MFE
    await page.goto('/reservations/new');
    
    // Fill reservation form
    await page.fill('input[name="customerName"]', 'Jane Smith');
    await page.fill('input[name="customerEmail"]', 'jane@example.com');
    await page.fill('input[name="customerPhone"]', '555-0123');
    await page.selectOption('select[name="partySize"]', '4');
    await page.fill('input[name="date"]', '2024-12-25');
    await page.fill('input[name="time"]', '19:00');
    
    // Submit reservation
    await page.click('button:has-text("Create Reservation")');
    
    // Navigate to Dashboard
    await page.goto('/dashboard');
    
    // Verify reservation notification appears
    await expect(page.locator('text=New Reservation')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
  });

  test('should handle menu updates across MFEs', async ({ page }) => {
    // Navigate to Menu MFE
    await page.goto('/menu');
    
    // Update a menu item availability
    await page.click('text=Burger Supreme');
    await page.uncheck('input[name="available"]');
    await page.click('button:has-text("Save Changes")');
    
    // Navigate to Orders MFE
    await page.goto('/orders/new');
    
    // Verify item is marked as unavailable
    await expect(page.locator('text=Burger Supreme')).toBeVisible();
    await expect(page.locator('text=Unavailable')).toBeVisible();
    
    // Item should not be selectable
    await expect(page.locator('option[value="burger-supreme"]')).toBeDisabled();
  });

  test('should maintain event history for debugging', async ({ page }) => {
    // Open browser console to check event history
    await page.goto('/dashboard');
    
    // Execute JavaScript to check event bus history
    const eventHistory = await page.evaluate(() => {
      // @ts-ignore - Access global event bus for testing
      return window.__RESTAURANT_EVENT_BUS__?.getHistory() || [];
    });
    
    // Verify event history is being maintained
    expect(Array.isArray(eventHistory)).toBe(true);
    
    // Perform an action that triggers events
    await page.goto('/orders/new');
    await page.fill('input[placeholder="Customer name"]', 'Test Customer');
    await page.click('button:has-text("Create Order")');
    
    // Check that new events were added to history
    const updatedHistory = await page.evaluate(() => {
      // @ts-ignore
      return window.__RESTAURANT_EVENT_BUS__?.getHistory() || [];
    });
    
    expect(updatedHistory.length).toBeGreaterThan(eventHistory.length);
  });
});