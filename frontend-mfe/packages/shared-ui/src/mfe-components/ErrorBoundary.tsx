import { Component, ErrorInfo, ReactNode } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

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

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorBoundaryKey: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorBoundaryKey: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error caught by ErrorBoundary${this.props.mfeName ? ` in ${this.props.mfeName}` : ''}:`, error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }
    
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorBoundaryKey: prevState.errorBoundaryKey + 1,
    }));
  };

  render() {
    const { hasError, error } = this.state;
    const { fallback, children, isolate, mfeName } = this.props;

    if (hasError) {
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <Card className="max-w-2xl w-full">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900">
                {isolate ? 'Component Error' : 'Application Error'}
              </h2>
              
              {mfeName && (
                <p className="text-sm text-gray-600">
                  Error in: <span className="font-semibold">{mfeName}</span>
                </p>
              )}
              
              <p className="text-gray-600">
                {isolate 
                  ? 'This component encountered an error and cannot be displayed.'
                  : 'We encountered an unexpected error. Please try again.'}
              </p>
              
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
                    {error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="pt-4">
                <Button
                  onClick={this.resetErrorBoundary}
                  variant="primary"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return <div key={this.state.errorBoundaryKey}>{children}</div>;
  }
}

export default ErrorBoundary;