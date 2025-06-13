import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '@restaurant/shared-ui';
import { PermissionResource, PermissionAction } from '@restaurant/shared-utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  resource?: PermissionResource;
  action?: PermissionAction;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  resource, 
  action,
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading, canAccess } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check permissions if specified
  if (resource && action && !canAccess(resource, action)) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <span className="text-4xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h2>
          <p className="text-neutral-600">
            You don't have permission to access this resource.
          </p>
          <p className="mt-4 text-sm text-neutral-500">
            Required permission: {resource}:{action}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;