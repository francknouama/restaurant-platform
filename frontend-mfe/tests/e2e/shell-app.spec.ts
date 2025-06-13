import { test, expect } from '@playwright/test';

test.describe('Shell App', () => {
  test('should load the main shell application', async ({ page }) => {
    await page.goto('/');
    
    // Check that the shell app loads
    await expect(page).toHaveTitle(/Restaurant Platform/);
    
    // Check for navigation elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle authentication flow', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login if not authenticated
    await expect(page.url()).toContain('login');
    
    // Check login form is present
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate between MFEs after authentication', async ({ page }) => {
    // Mock authentication state
    await page.goto('/');
    
    // Simulate login (adjust based on your auth implementation)
    await page.fill('input[type="email"]', 'admin@restaurant.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page.url()).toContain('dashboard');
    
    // Test navigation to different MFEs
    await page.click('text=Menu');
    await expect(page.url()).toContain('menu');
    
    await page.click('text=Orders');
    await expect(page.url()).toContain('orders');
    
    await page.click('text=Kitchen');
    await expect(page.url()).toContain('kitchen');
  });

  test('should display role-based navigation items', async ({ page }) => {
    // Test with admin role
    await page.goto('/dashboard');
    
    // Admin should see all navigation items
    await expect(page.locator('text=Menu')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Kitchen')).toBeVisible();
    await expect(page.locator('text=Inventory')).toBeVisible();
    await expect(page.locator('text=Reservations')).toBeVisible();
  });
});