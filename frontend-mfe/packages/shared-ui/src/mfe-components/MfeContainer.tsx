import React, { Suspense, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';
import LoadingFallback from './LoadingFallback';

export interface MfeContainerProps {
  children: ReactNode;
  name: string;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

const MfeContainer: React.FC<MfeContainerProps> = ({
  children,
  name,
  loadingFallback,
  errorFallback,
  onError,
  className,
}) => {
  return (
    <ErrorBoundary
      mfeName={name}
      fallback={errorFallback}
      onError={onError}
      isolate
    >
      <Suspense fallback={loadingFallback || <LoadingFallback name={name} />}>
        <div className={className} data-mfe={name}>
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default MfeContainer;