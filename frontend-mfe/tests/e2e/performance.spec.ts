import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('shell app should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Shell app should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check core web vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    console.log('Web Vitals:', webVitals);
  });

  test('MFE lazy loading should be efficient', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/dashboard');
    
    // Navigate to each MFE and measure load time
    const mfes = [
      { name: 'menu', path: '/menu' },
      { name: 'orders', path: '/orders' },
      { name: 'kitchen', path: '/kitchen' },
      { name: 'inventory', path: '/inventory' },
      { name: 'reservations', path: '/reservations' },
    ];
    
    for (const mfe of mfes) {
      const startTime = Date.now();
      
      await page.goto(mfe.path, { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      
      // Each MFE should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
      
      console.log(`${mfe.name} MFE load time: ${loadTime}ms`);
    }
  });

  test('cross-MFE communication should be fast', async ({ page }) => {
    await page.goto('/orders/new');
    
    // Monitor event bus performance
    await page.addInitScript(() => {
      (window as any).eventTimes = [];
      
      // Override event bus emit method to measure performance
      const originalEmit = (window as any).__RESTAURANT_EVENT_BUS__?.emit;
      if (originalEmit) {
        (window as any).__RESTAURANT_EVENT_BUS__.emit = function(...args: any[]) {
          const start = performance.now();
          const result = originalEmit.apply(this, args);
          const end = performance.now();
          (window as any).eventTimes.push(end - start);
          return result;
        };
      }
    });
    
    // Create an order to trigger events
    await page.fill('input[name="customerName"]', 'Performance Test');
    await page.click('button:has-text("Create Order")');
    
    // Navigate to kitchen to trigger more events
    await page.goto('/kitchen');
    
    // Check event performance
    const eventTimes = await page.evaluate(() => (window as any).eventTimes || []);
    
    if (eventTimes.length > 0) {
      const avgEventTime = eventTimes.reduce((a: number, b: number) => a + b, 0) / eventTimes.length;
      
      // Events should process within 10ms on average
      expect(avgEventTime).toBeLessThan(10);
      
      console.log(`Average event processing time: ${avgEventTime}ms`);
    }
  });

  test('concurrent users simulation', async ({ page, context }) => {
    // Simulate multiple users working simultaneously
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage(),
    ]);
    
    // Each page simulates different user roles
    const actions = [
      // User 1: Kitchen staff
      async () => {
        await pages[0].goto('/kitchen');
        await pages[0].click('.order-card:first-child');
        await pages[0].click('button:has-text("Start Preparing")');
      },
      
      // User 2: Waitstaff creating orders
      async () => {
        await pages[1].goto('/orders/new');
        await pages[1].fill('input[name="customerName"]', 'Concurrent User 2');
        await pages[1].click('button:has-text("Create Order")');
      },
      
      // User 3: Host managing reservations
      async () => {
        await pages[2].goto('/reservations');
        await pages[2].click('text=Today');
        await pages[2].click('.reservation-card:first-child');
      },
    ];
    
    const startTime = Date.now();
    
    // Execute all actions concurrently
    await Promise.all(actions.map(action => action()));
    
    const totalTime = Date.now() - startTime;
    
    // All concurrent operations should complete within 5 seconds
    expect(totalTime).toBeLessThan(5000);
    
    console.log(`Concurrent operations completed in: ${totalTime}ms`);
    
    // Clean up
    await Promise.all(pages.map(p => p.close()));
  });

  test('memory usage should stay within bounds', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
      } : null;
    });
    
    if (!initialMemory) {
      test.skip('Memory API not available');
      return;
    }
    
    // Perform memory-intensive operations
    for (let i = 0; i < 10; i++) {
      await page.goto('/orders/new');
      await page.goto('/kitchen');
      await page.goto('/inventory');
      await page.goto('/reservations');
      await page.goto('/dashboard');
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
      };
    });
    
    const memoryIncrease = finalMemory.used - initialMemory.used;
    const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100;
    
    // Memory increase should be less than 50% after navigation cycles
    expect(memoryIncreasePercent).toBeLessThan(50);
    
    console.log(`Memory increase: ${memoryIncreasePercent.toFixed(2)}%`);
  });
});