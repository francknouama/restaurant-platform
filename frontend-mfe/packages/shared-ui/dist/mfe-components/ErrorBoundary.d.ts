import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: Array<string | number>;
    resetOnPropsChange?: boolean;
    isolate?: boolean;
    mfeName?: string;
}
interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
    errorBoundaryKey: number;
}
declare class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    componentDidUpdate(prevProps: Props): void;
    resetErrorBoundary: () => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default ErrorBoundary;
//# sourceMappingURL=ErrorBoundary.d.ts.map