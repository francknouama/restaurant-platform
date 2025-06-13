import React from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

export interface LoadingFallbackProps {
  name?: string;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  name,
  message,
  fullScreen = false,
  className = '',
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'
    : 'flex items-center justify-center min-h-[200px] p-8';

  const displayMessage = message || (name ? `Loading ${name}...` : 'Loading...');

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 font-medium">{displayMessage}</p>
      </div>
    </div>
  );
};

export default LoadingFallback;