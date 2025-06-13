import { User, UserWithRole, Permission, PermissionResource, PermissionAction, RestaurantRoles } from './types';

// Permission checking utilities
export const canUserAccess = (
  user: User | UserWithRole | null,
  resource: PermissionResource,
  action: PermissionAction
): boolean => {
  if (!user) return false;

  const permissions = 'permissions' in user ? user.permissions : user.role?.permissions || [];
  
  return permissions.some((permission: Permission) => {
    // Check exact match
    if (permission.resource === resource && permission.action === action) {
      return true;
    }
    // Check for manage permission which grants all actions
    if (permission.resource === resource && permission.action === 'manage') {
      return true;
    }
    return false;
  });
};

export const hasRole = (user: User | UserWithRole | null, roleName: string): boolean => {
  if (!user) return false;
  
  const role = 'role' in user && user.role ? user.role : user.role;
  return role?.name === roleName;
};

export const isAdmin = (user: User | UserWithRole | null): boolean => {
  return hasRole(user, RestaurantRoles.ADMIN);
};

export const isManager = (user: User | UserWithRole | null): boolean => {
  return hasRole(user, RestaurantRoles.MANAGER);
};

export const isKitchenStaff = (user: User | UserWithRole | null): boolean => {
  return hasRole(user, RestaurantRoles.KITCHEN_STAFF);
};

export const isWaitstaff = (user: User | UserWithRole | null): boolean => {
  return hasRole(user, RestaurantRoles.WAITSTAFF);
};

export const isHost = (user: User | UserWithRole | null): boolean => {
  return hasRole(user, RestaurantRoles.HOST);
};

export const isCashier = (user: User | UserWithRole | null): boolean => {
  return hasRole(user, RestaurantRoles.CASHIER);
};

// Role-based UI helpers
export const getRoleDisplayName = (roleName: string): string => {
  const roleNames: Record<string, string> = {
    [RestaurantRoles.ADMIN]: 'Administrator',
    [RestaurantRoles.MANAGER]: 'Manager',
    [RestaurantRoles.KITCHEN_STAFF]: 'Kitchen Staff',
    [RestaurantRoles.WAITSTAFF]: 'Wait Staff',
    [RestaurantRoles.HOST]: 'Host',
    [RestaurantRoles.CASHIER]: 'Cashier',
  };
  
  return roleNames[roleName] || roleName;
};

export const getRoleColor = (roleName: string): string => {
  const roleColors: Record<string, string> = {
    [RestaurantRoles.ADMIN]: 'text-purple-600 bg-purple-100',
    [RestaurantRoles.MANAGER]: 'text-blue-600 bg-blue-100',
    [RestaurantRoles.KITCHEN_STAFF]: 'text-orange-600 bg-orange-100',
    [RestaurantRoles.WAITSTAFF]: 'text-green-600 bg-green-100',
    [RestaurantRoles.HOST]: 'text-yellow-600 bg-yellow-100',
    [RestaurantRoles.CASHIER]: 'text-indigo-600 bg-indigo-100',
  };
  
  return roleColors[roleName] || 'text-gray-600 bg-gray-100';
};

// Session validation
export const isSessionExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt) < new Date();
};

export const getTimeUntilExpiry = (expiresAt: string): number => {
  return new Date(expiresAt).getTime() - new Date().getTime();
};