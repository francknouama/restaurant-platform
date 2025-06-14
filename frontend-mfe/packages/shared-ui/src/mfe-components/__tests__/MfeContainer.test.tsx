import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MfeContainer, { MfeContainerProps } from '../MfeContainer';

// Mock the dependencies
jest.mock('../ErrorBoundary', () => {
  return function MockErrorBoundary({ 
    children, 
    mfeName, 
    fallback, 
    onError, 
    isolate 
  }: {
    children: React.ReactNode;
    mfeName?: string;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    isolate?: boolean;
  }) {
    return (
      <div 
        data-testid="error-boundary"
        data-mfe-name={mfeName}
        data-isolate={isolate}
        data-has-fallback={!!fallback}
        data-has-error-handler={!!onError}
      >
        {children}
      </div>
    );
  };
});

jest.mock('../LoadingFallback', () => {
  return function MockLoadingFallback({ name }: { name: string }) {
    return <div data-testid="loading-fallback">Loading {name}...</div>;
  };
});

// Mock Suspense behavior for testing
const SuspenseTestComponent: React.FC<{ shouldSuspend: boolean; children: React.ReactNode }> = ({ 
  shouldSuspend, 
  children 
}) => {
  if (shouldSuspend) {
    // Simulate suspense by throwing a promise
    throw new Promise(resolve => setTimeout(resolve, 100));
  }
  return <>{children}</>;
};

// Component that can be configured to throw errors
const TestMfeComponent: React.FC<{ shouldThrow?: boolean; content?: string }> = ({ 
  shouldThrow = false, 
  content = 'MFE Content' 
}) => {
  if (shouldThrow) {
    throw new Error('Test MFE error');
  }
  return <div data-testid="mfe-content">{content}</div>;
};

describe('MfeContainer', () => {
  const defaultProps: MfeContainerProps = {
    name: 'Test MFE',
    children: <TestMfeComponent />,
  };

  const renderMfeContainer = (props: Partial<MfeContainerProps> = {}) => {
    return render(<MfeContainer {...defaultProps} {...props} />);
  };

  describe('Basic rendering', () => {
    it('should render children successfully', async () => {
      renderMfeContainer();

      await waitFor(() => {
        expect(screen.getByTestId('mfe-content')).toBeInTheDocument();
      });

      expect(screen.getByText('MFE Content')).toBeInTheDocument();
    });

    it('should wrap children with ErrorBoundary', () => {
      renderMfeContainer();

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toBeInTheDocument();
      expect(errorBoundary).toHaveAttribute('data-mfe-name', 'Test MFE');
      expect(errorBoundary).toHaveAttribute('data-isolate', 'true');
    });

    it('should have data-mfe attribute on container div', async () => {
      renderMfeContainer();

      await waitFor(() => {
        const container = screen.getByTestId('mfe-content').closest('div[data-mfe]');
        expect(container).toHaveAttribute('data-mfe', 'Test MFE');
      });
    });

    it('should apply custom className to container', async () => {
      renderMfeContainer({ className: 'custom-mfe-class' });

      await waitFor(() => {
        const container = screen.getByTestId('mfe-content').closest('div[data-mfe]');
        expect(container).toHaveClass('custom-mfe-class');
      });
    });
  });

  describe('Error handling', () => {
    it('should pass MFE name to ErrorBoundary', () => {
      renderMfeContainer({ name: 'Menu Management MFE' });

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-mfe-name', 'Menu Management MFE');
    });

    it('should pass custom error fallback to ErrorBoundary', () => {
      const customErrorFallback = <div data-testid="custom-error">Custom Error UI</div>;
      renderMfeContainer({ errorFallback: customErrorFallback });

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-has-fallback', 'true');
    });

    it('should pass onError handler to ErrorBoundary', () => {
      const onErrorMock = jest.fn();
      renderMfeContainer({ onError: onErrorMock });

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-has-error-handler', 'true');
    });

    it('should set isolate prop to true on ErrorBoundary', () => {
      renderMfeContainer();

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-isolate', 'true');
    });

    it('should handle undefined onError gracefully', () => {
      renderMfeContainer({ onError: undefined });

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-has-error-handler', 'false');
    });
  });

  describe('Loading states', () => {
    it('should show default loading fallback when no custom fallback provided', () => {
      renderMfeContainer({
        children: (
          <Suspense fallback={null}>
            <SuspenseTestComponent shouldSuspend={true}>
              <TestMfeComponent />
            </SuspenseTestComponent>
          </Suspense>
        ),
      });

      expect(screen.getByTestId('loading-fallback')).toBeInTheDocument();
      expect(screen.getByText('Loading Test MFE...')).toBeInTheDocument();
    });

    it('should show custom loading fallback when provided', () => {
      const customLoadingFallback = <div data-testid="custom-loading">Custom Loading...</div>;
      
      renderMfeContainer({
        loadingFallback: customLoadingFallback,
        children: (
          <Suspense fallback={null}>
            <SuspenseTestComponent shouldSuspend={true}>
              <TestMfeComponent />
            </SuspenseTestComponent>
          </Suspense>
        ),
      });

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-fallback')).not.toBeInTheDocument();
    });

    it('should handle null loading fallback', () => {
      renderMfeContainer({
        loadingFallback: null,
        children: (
          <Suspense fallback={null}>
            <SuspenseTestComponent shouldSuspend={true}>
              <TestMfeComponent />
            </SuspenseTestComponent>
          </Suspense>
        ),
      });

      // Should fallback to default LoadingFallback
      expect(screen.getByTestId('loading-fallback')).toBeInTheDocument();
    });

    it('should handle undefined loading fallback', () => {
      renderMfeContainer({
        loadingFallback: undefined,
        children: (
          <Suspense fallback={null}>
            <SuspenseTestComponent shouldSuspend={true}>
              <TestMfeComponent />
            </SuspenseTestComponent>
          </Suspense>
        ),
      });

      // Should fallback to default LoadingFallback
      expect(screen.getByTestId('loading-fallback')).toBeInTheDocument();
    });
  });

  describe('Children handling', () => {
    it('should render simple React element children', async () => {
      renderMfeContainer({
        children: <div data-testid="simple-child">Simple Child</div>,
      });

      await waitFor(() => {
        expect(screen.getByTestId('simple-child')).toBeInTheDocument();
      });
    });

    it('should render multiple children', async () => {
      renderMfeContainer({
        children: [
          <div key="1" data-testid="child-1">Child 1</div>,
          <div key="2" data-testid="child-2">Child 2</div>,
        ],
      });

      await waitFor(() => {
        expect(screen.getByTestId('child-1')).toBeInTheDocument();
        expect(screen.getByTestId('child-2')).toBeInTheDocument();
      });
    });

    it('should render complex nested children', async () => {
      renderMfeContainer({
        children: (
          <div data-testid="complex-parent">
            <header>Header</header>
            <main>
              <TestMfeComponent content="Nested content" />
            </main>
            <footer>Footer</footer>
          </div>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('complex-parent')).toBeInTheDocument();
        expect(screen.getByText('Header')).toBeInTheDocument();
        expect(screen.getByText('Nested content')).toBeInTheDocument();
        expect(screen.getByText('Footer')).toBeInTheDocument();
      });
    });

    it('should handle null children', () => {
      renderMfeContainer({ children: null });

      const container = screen.getByTestId('error-boundary');
      expect(container).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      renderMfeContainer({ children: undefined });

      const container = screen.getByTestId('error-boundary');
      expect(container).toBeInTheDocument();
    });

    it('should handle empty string children', async () => {
      renderMfeContainer({ children: '' });

      await waitFor(() => {
        const container = screen.getByTestId('error-boundary');
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('MFE name handling', () => {
    it('should handle names with spaces', async () => {
      renderMfeContainer({ name: 'Menu Management System' });

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-mfe-name', 'Menu Management System');

      await waitFor(() => {
        const container = screen.getByTestId('mfe-content').closest('div[data-mfe]');
        expect(container).toHaveAttribute('data-mfe', 'Menu Management System');
      });
    });

    it('should handle names with special characters', async () => {
      renderMfeContainer({ name: 'Order-Processing_v2.0' });

      await waitFor(() => {
        const container = screen.getByTestId('mfe-content').closest('div[data-mfe]');
        expect(container).toHaveAttribute('data-mfe', 'Order-Processing_v2.0');
      });
    });

    it('should handle empty name', () => {
      renderMfeContainer({ name: '' });

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-mfe-name', '');
    });

    it('should handle long names', async () => {
      const longName = 'Very Long MFE Name That Might Be Used In Some Complex Enterprise Applications';
      renderMfeContainer({ name: longName });

      await waitFor(() => {
        const container = screen.getByTestId('mfe-content').closest('div[data-mfe]');
        expect(container).toHaveAttribute('data-mfe', longName);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle MFE that loads asynchronously', async () => {
      const AsyncMfeComponent = () => {
        const [loaded, setLoaded] = React.useState(false);

        React.useEffect(() => {
          const timer = setTimeout(() => setLoaded(true), 50);
          return () => clearTimeout(timer);
        }, []);

        if (!loaded) {
          throw new Promise(resolve => setTimeout(resolve, 50));
        }

        return <div data-testid="async-mfe">Async MFE Loaded</div>;
      };

      renderMfeContainer({
        name: 'Async MFE',
        children: (
          <Suspense fallback={null}>
            <AsyncMfeComponent />
          </Suspense>
        ),
      });

      // Should show loading initially
      expect(screen.getByTestId('loading-fallback')).toBeInTheDocument();

      // Should show loaded content after suspense resolves
      await waitFor(() => {
        expect(screen.getByTestId('async-mfe')).toBeInTheDocument();
      });

      expect(screen.getByText('Async MFE Loaded')).toBeInTheDocument();
    });

    it('should handle MFE with dynamic imports', async () => {
      const DynamicMfe = React.lazy(async () => {
        // Simulate dynamic import
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          default: () => <div data-testid="dynamic-mfe">Dynamic MFE</div>
        };
      });

      renderMfeContainer({
        name: 'Dynamic MFE',
        children: (
          <Suspense fallback={null}>
            <DynamicMfe />
          </Suspense>
        ),
      });

      // Should show loading initially
      expect(screen.getByTestId('loading-fallback')).toBeInTheDocument();

      // Should show loaded content
      await waitFor(() => {
        expect(screen.getByTestId('dynamic-mfe')).toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid re-renders', async () => {
      let renderCount = 0;
      
      const CountingMfe = () => {
        renderCount++;
        return <div data-testid="counting-mfe">Render #{renderCount}</div>;
      };

      const { rerender } = renderMfeContainer({
        children: <CountingMfe />,
      });

      await waitFor(() => {
        expect(screen.getByText('Render #1')).toBeInTheDocument();
      });

      // Re-render multiple times quickly
      for (let i = 0; i < 5; i++) {
        rerender(
          <MfeContainer {...defaultProps}>
            <CountingMfe />
          </MfeContainer>
        );
      }

      await waitFor(() => {
        expect(screen.getByTestId('counting-mfe')).toBeInTheDocument();
      });
    });

    it('should handle className edge cases', async () => {
      renderMfeContainer({ className: '  whitespace-class  ' });

      await waitFor(() => {
        const container = screen.getByTestId('mfe-content').closest('div[data-mfe]');
        expect(container).toHaveClass('whitespace-class');
      });
    });

    it('should handle empty className', async () => {
      renderMfeContainer({ className: '' });

      await waitFor(() => {
        const container = screen.getByTestId('mfe-content').closest('div[data-mfe]');
        expect(container).toBeInTheDocument();
      });
    });

    it('should handle undefined className', async () => {
      renderMfeContainer({ className: undefined });

      await waitFor(() => {
        const container = screen.getByTestId('mfe-content').closest('div[data-mfe]');
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Performance considerations', () => {
    it('should not re-render children unnecessarily', async () => {
      let renderCount = 0;
      
      const MemoizedMfe = React.memo(() => {
        renderCount++;
        return <div data-testid="memoized-mfe">Render count: {renderCount}</div>;
      });

      const { rerender } = renderMfeContainer({
        children: <MemoizedMfe />,
      });

      await waitFor(() => {
        expect(screen.getByText('Render count: 1')).toBeInTheDocument();
      });

      // Re-render with same props
      rerender(
        <MfeContainer {...defaultProps}>
          <MemoizedMfe />
        </MfeContainer>
      );

      await waitFor(() => {
        // Should not cause additional render due to memoization
        expect(screen.getByText('Render count: 1')).toBeInTheDocument();
      });
    });

    it('should have minimal DOM overhead', async () => {
      renderMfeContainer();

      await waitFor(() => {
        const errorBoundary = screen.getByTestId('error-boundary');
        const containerDiv = errorBoundary.querySelector('div[data-mfe]');
        const mfeContent = screen.getByTestId('mfe-content');

        // Should have clean structure: ErrorBoundary > Suspense > div[data-mfe] > MFE content
        expect(containerDiv).toBeInTheDocument();
        expect(containerDiv).toContain(mfeContent);
      });
    });
  });

  describe('Real-world MFE scenarios', () => {
    it('should handle Menu MFE container', async () => {
      renderMfeContainer({
        name: 'Menu Management',
        className: 'menu-mfe-container',
        children: <div data-testid="menu-app">Menu App Content</div>,
      });

      await waitFor(() => {
        const container = screen.getByTestId('menu-app').closest('div[data-mfe]');
        expect(container).toHaveAttribute('data-mfe', 'Menu Management');
        expect(container).toHaveClass('menu-mfe-container');
      });
    });

    it('should handle Orders MFE with custom error handler', () => {
      const orderErrorHandler = jest.fn();
      
      renderMfeContainer({
        name: 'Order Processing',
        onError: orderErrorHandler,
        children: <div data-testid="orders-app">Orders App</div>,
      });

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-mfe-name', 'Order Processing');
      expect(errorBoundary).toHaveAttribute('data-has-error-handler', 'true');
    });

    it('should handle Kitchen MFE with custom loading', () => {
      const customKitchenLoading = (
        <div data-testid="kitchen-loading">
          <div>Loading Kitchen Operations...</div>
          <div>Please wait while we prepare your view</div>
        </div>
      );

      renderMfeContainer({
        name: 'Kitchen Operations',
        loadingFallback: customKitchenLoading,
        children: (
          <Suspense fallback={null}>
            <SuspenseTestComponent shouldSuspend={true}>
              <div>Kitchen App</div>
            </SuspenseTestComponent>
          </Suspense>
        ),
      });

      expect(screen.getByTestId('kitchen-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading Kitchen Operations...')).toBeInTheDocument();
    });
  });
});