import { Page } from '@playwright/test';

export interface AuthUser {
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'kitchen_staff' | 'waitstaff' | 'host' | 'cashier';
}

export const defaultUsers: Record<string, AuthUser> = {
  admin: {
    email: 'admin@restaurant.com',
    password: 'admin123',
    role: 'admin',
  },
  manager: {
    email: 'manager@restaurant.com',
    password: 'manager123',
    role: 'manager',
  },
  kitchen: {
    email: 'kitchen@restaurant.com',
    password: 'kitchen123',
    role: 'kitchen_staff',
  },
  waitstaff: {
    email: 'waitstaff@restaurant.com',
    password: 'waitstaff123',
    role: 'waitstaff',
  },
  host: {
    email: 'host@restaurant.com',
    password: 'host123',
    role: 'host',
  },
  cashier: {
    email: 'cashier@restaurant.com',
    password: 'cashier123',
    role: 'cashier',
  },
};

export async function loginAs(page: Page, userType: keyof typeof defaultUsers = 'admin') {
  const user = defaultUsers[userType];
  
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard');
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Logout');
  await page.waitForURL('**/login');
}

export async function mockAuthState(page: Page, user: AuthUser) {
  // Mock authentication state in localStorage/sessionStorage
  await page.addInitScript((userData) => {
    localStorage.setItem('auth_token', 'mock_jwt_token');
    localStorage.setItem('user_data', JSON.stringify({
      email: userData.email,
      role: userData.role,
      isAuthenticated: true,
    }));
  }, user);
}