import { default as React, ReactNode } from 'react';

export interface MfeContainerProps {
    children: ReactNode;
    name: string;
    loadingFallback?: ReactNode;
    errorFallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    className?: string;
}
declare const MfeContainer: React.FC<MfeContainerProps>;
export default MfeContainer;
//# sourceMappingURL=MfeContainer.d.ts.map