import { default as React } from 'react';

export interface StatusBadgeProps {
    status: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    children: React.ReactNode;
}
declare const StatusBadge: React.FC<StatusBadgeProps>;
export default StatusBadge;
//# sourceMappingURL=StatusBadge.d.ts.map