import React from 'react';
import { clsx } from 'clsx';

export interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  children: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'default',
  size = 'md',
  icon,
  children,
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-600',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };
  
  // Auto-detect variant based on common status patterns
  const getVariantFromStatus = (status: string): keyof typeof variantClasses => {
    const lowerStatus = status.toLowerCase();
    
    if (['active', 'completed', 'ready', 'confirmed', 'paid', 'in_stock'].includes(lowerStatus)) {
      return 'success';
    }
    if (['preparing', 'pending', 'low_stock', 'reorder_needed'].includes(lowerStatus)) {
      return 'warning';
    }
    if (['cancelled', 'failed', 'expired', 'out_of_stock', 'no_show'].includes(lowerStatus)) {
      return 'danger';
    }
    if (['created', 'new', 'info'].includes(lowerStatus)) {
      return 'info';
    }
    if (['inactive', 'disabled'].includes(lowerStatus)) {
      return 'neutral';
    }
    
    return variant;
  };
  
  const finalVariant = variant === 'default' ? getVariantFromStatus(status) : variant;
  
  return (
    <span
      className={clsx(
        baseClasses,
        variantClasses[finalVariant],
        sizeClasses[size]
      )}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

export default StatusBadge;