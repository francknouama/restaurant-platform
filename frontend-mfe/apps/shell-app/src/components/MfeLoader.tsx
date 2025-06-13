import React, { lazy, Suspense } from 'react';
import { MfeContainer, LoadingFallback } from '@restaurant/shared-ui';
import { PermissionResource, PermissionAction } from '@restaurant/shared-utils';
import ProtectedRoute from './ProtectedRoute';

interface MfeLoaderProps {
  mfeName: string;
  moduleName: string;
  componentPath: string;
  resource?: PermissionResource;
  action?: PermissionAction;
}

const MfeLoader: React.FC<MfeLoaderProps> = ({ 
  mfeName, 
  moduleName, 
  componentPath,
  resource,
  action 
}) => {
  // Dynamically import the MFE component
  const MfeComponent = lazy(async () => {
    try {
      // @ts-ignore - Module federation dynamic imports
      const module = await import(moduleName);
      return { default: module[componentPath] || module.default };
    } catch (error) {
      console.error(`Failed to load MFE ${mfeName}:`, error);
      throw error;
    }
  });

  const content = (
    <MfeContainer 
      name={mfeName}
      onError={(error, errorInfo) => {
        console.error(`Error in MFE ${mfeName}:`, error, errorInfo);
      }}
    >
      <Suspense fallback={<LoadingFallback name={mfeName} />}>
        <MfeComponent />
      </Suspense>
    </MfeContainer>
  );

  // Wrap with protected route if permissions are specified
  if (resource && action) {
    return (
      <ProtectedRoute resource={resource} action={action}>
        {content}
      </ProtectedRoute>
    );
  }

  return content;
};

export default MfeLoader;