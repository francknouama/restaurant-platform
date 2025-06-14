import { act, renderHook } from '@testing-library/react';
import { useGlobalStore } from '../store';
import { Notification } from '../types';

describe('Global Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useGlobalStore());
    act(() => {
      result.current.clearUser();
      result.current.clearNotifications();
    });
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should have correct initial user state', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      expect(result.current.user).toEqual({
        id: null,
        email: null,
        role: null,
        isAuthenticated: false
      });
    });

    it('should have empty notifications array initially', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      expect(result.current.notifications).toEqual([]);
    });
  });

  describe('User Management', () => {
    it('should set user data correctly', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'test@example.com',
          role: 'admin'
        });
      });

      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        isAuthenticated: true
      });
    });

    it('should update isAuthenticated based on user id', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.setUser({ id: 'user-123' });
      });
      expect(result.current.user.isAuthenticated).toBe(true);

      act(() => {
        result.current.setUser({ id: null });
      });
      expect(result.current.user.isAuthenticated).toBe(false);
    });

    it('should merge user data with existing state', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'test@example.com',
          role: 'admin'
        });
      });

      act(() => {
        result.current.setUser({ role: 'manager' });
      });

      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        isAuthenticated: true
      });
    });

    it('should clear user data completely', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'test@example.com',
          role: 'admin'
        });
      });

      act(() => {
        result.current.clearUser();
      });

      expect(result.current.user).toEqual({
        id: null,
        email: null,
        role: null,
        isAuthenticated: false
      });
    });

    it('should handle partial user updates', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.setUser({ email: 'test@example.com' });
      });

      expect(result.current.user).toEqual({
        id: null,
        email: 'test@example.com',
        role: null,
        isAuthenticated: false
      });
    });

    it('should set isAuthenticated to true when user has valid id', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.setUser({ id: '123', email: 'test@example.com' });
      });

      expect(result.current.user.isAuthenticated).toBe(true);
    });

    it('should set isAuthenticated to false when user id is falsy', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      const falsyValues = ['', 0, false, null, undefined];
      
      falsyValues.forEach(falsyValue => {
        act(() => {
          result.current.setUser({ id: falsyValue as any });
        });
        expect(result.current.user.isAuthenticated).toBe(false);
      });
    });
  });

  describe('Notification Management', () => {
    it('should add notification with auto-generated id and timestamp', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      const notificationData = {
        type: 'success' as const,
        title: 'Success',
        message: 'Operation completed'
      };

      act(() => {
        result.current.addNotification(notificationData);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject(notificationData);
      expect(result.current.notifications[0].id).toMatch(/^notification_\d+$/);
      expect(result.current.notifications[0].timestamp).toBe(1640995200000);
    });

    it('should add notification with custom duration', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Info',
          duration: 3000
        });
      });

      expect(result.current.notifications[0].duration).toBe(3000);
    });

    it('should auto-remove notification after default duration (5 seconds)', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Auto Remove Test'
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should auto-remove notification after custom duration', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.addNotification({
          type: 'warning',
          title: 'Custom Duration',
          duration: 2000
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(1999);
      });
      expect(result.current.notifications).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current.notifications).toHaveLength(0);
    });

    it('should remove specific notification by id', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'First Notification'
        });
        result.current.addNotification({
          type: 'success',
          title: 'Second Notification'
        });
      });

      expect(result.current.notifications).toHaveLength(2);
      const firstNotificationId = result.current.notifications[0].id;

      act(() => {
        result.current.removeNotification(firstNotificationId);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].title).toBe('Second Notification');
    });

    it('should not remove notification if id does not exist', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test Notification'
        });
      });

      const originalLength = result.current.notifications.length;

      act(() => {
        result.current.removeNotification('non-existent-id');
      });

      expect(result.current.notifications).toHaveLength(originalLength);
    });

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.addNotification({ type: 'info', title: 'Notification 1' });
        result.current.addNotification({ type: 'success', title: 'Notification 2' });
        result.current.addNotification({ type: 'error', title: 'Notification 3' });
      });

      expect(result.current.notifications).toHaveLength(3);

      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should handle multiple notifications with different auto-removal times', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Quick notification',
          duration: 1000
        });
        result.current.addNotification({
          type: 'warning',
          title: 'Slow notification',
          duration: 3000
        });
      });

      expect(result.current.notifications).toHaveLength(2);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].title).toBe('Slow notification');

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.notifications).toHaveLength(0);
    });

    it('should handle all notification types', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      const notificationTypes: Array<Notification['type']> = ['info', 'success', 'warning', 'error'];
      
      notificationTypes.forEach((type, index) => {
        act(() => {
          result.current.addNotification({
            type,
            title: `${type} notification`,
            message: `Message for ${type}`
          });
        });
      });

      expect(result.current.notifications).toHaveLength(4);
      notificationTypes.forEach((type, index) => {
        expect(result.current.notifications[index].type).toBe(type);
        expect(result.current.notifications[index].title).toBe(`${type} notification`);
      });
    });

    it('should preserve notification order', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      const titles = ['First', 'Second', 'Third'];
      
      titles.forEach(title => {
        act(() => {
          result.current.addNotification({
            type: 'info',
            title
          });
        });
      });

      titles.forEach((title, index) => {
        expect(result.current.notifications[index].title).toBe(title);
      });
    });
  });

  describe('Store Persistence and State Management', () => {
    it('should maintain state across multiple renders', () => {
      const { result, rerender } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.setUser({ id: 'user-123', email: 'test@example.com' });
        result.current.addNotification({ type: 'info', title: 'Test' });
      });

      rerender();

      expect(result.current.user.id).toBe('user-123');
      expect(result.current.notifications).toHaveLength(1);
    });

    it('should allow independent access to store from different hooks', () => {
      const { result: result1 } = renderHook(() => useGlobalStore());
      const { result: result2 } = renderHook(() => useGlobalStore());
      
      act(() => {
        result1.current.setUser({ id: 'user-123' });
      });

      expect(result2.current.user.id).toBe('user-123');
      expect(result2.current.user.isAuthenticated).toBe(true);
    });

    it('should handle rapid state updates correctly', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.setUser({ id: 'user-1' });
        result.current.setUser({ email: 'test1@example.com' });
        result.current.setUser({ role: 'admin' });
        result.current.setUser({ id: 'user-2' });
      });

      expect(result.current.user).toEqual({
        id: 'user-2',
        email: 'test1@example.com',
        role: 'admin',
        isAuthenticated: true
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined notification data gracefully', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: undefined,
          duration: undefined
        });
      });

      expect(result.current.notifications[0].message).toBeUndefined();
      expect(result.current.notifications[0].duration).toBeUndefined();
    });

    it('should handle empty string values in user data', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.setUser({
          id: '',
          email: '',
          role: ''
        });
      });

      expect(result.current.user.isAuthenticated).toBe(false);
      expect(result.current.user.email).toBe('');
      expect(result.current.user.role).toBe('');
    });

    it('should not interfere with auto-removal when manually removing notifications', () => {
      const { result } = renderHook(() => useGlobalStore());
      
      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Auto Remove',
          duration: 2000
        });
      });

      const notificationId = result.current.notifications[0].id;

      act(() => {
        result.current.removeNotification(notificationId);
      });

      expect(result.current.notifications).toHaveLength(0);

      // Advance timer beyond original duration
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Should still be empty, no error should occur
      expect(result.current.notifications).toHaveLength(0);
    });
  });
});