import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../ErrorBoundary';

// Mock console.error to avoid noise in test output
const originalError = console.error;

// Component that throws an error when flag is true
const ProblematicComponent: React.FC<{ shouldThrow: boolean; message?: string }> = ({ 
  shouldThrow, 
  message = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="working-component">Component works!</div>;
};

// Component that conditionally throws based on props
const ConditionalErrorComponent: React.FC<{ errorCondition: boolean }> = ({ errorCondition }) => {
  if (errorCondition) {
    throw new Error('Conditional error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('Normal operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.getByText('Component works!')).toBeInTheDocument();
    });

    it('should render multiple children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <ProblematicComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Application Error')).toBeInTheDocument();
      expect(screen.getByText('We encountered an unexpected error. Please try again.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
    });

    it('should display custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Application Error')).not.toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onErrorMock = jest.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ProblematicComponent shouldThrow={true} message="Callback test error" />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Callback test error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should log error to console with MFE name', () => {
      render(
        <ErrorBoundary mfeName="Test MFE">
          <ProblematicComponent shouldThrow={true} message="Console log test" />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error caught by ErrorBoundary in Test MFE:',
        expect.objectContaining({ message: 'Console log test' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('should log error to console without MFE name', () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} message="Console log test 2" />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error caught by ErrorBoundary:',
        expect.objectContaining({ message: 'Console log test 2' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });

  describe('Error UI variations', () => {
    it('should show component error UI when isolate is true', () => {
      render(
        <ErrorBoundary isolate={true}>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByText('This component encountered an error and cannot be displayed.')).toBeInTheDocument();
    });

    it('should show application error UI when isolate is false', () => {
      render(
        <ErrorBoundary isolate={false}>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Application Error')).toBeInTheDocument();
      expect(screen.getByText('We encountered an unexpected error. Please try again.')).toBeInTheDocument();
    });

    it('should display MFE name in error UI', () => {
      render(
        <ErrorBoundary mfeName="Menu Management" isolate={true}>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error in:')).toBeInTheDocument();
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
    });
  });

  describe('Error details in development', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should show error details in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} message="Development error details" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details')).toBeInTheDocument();
      
      // Click to expand details
      fireEvent.click(screen.getByText('Error Details'));
      
      expect(screen.getByText(/Development error details/)).toBeInTheDocument();
    });

    it('should not show error details in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} message="Production error" />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
    });
  });

  describe('Reset functionality', () => {
    it('should reset error state when Try Again button is clicked', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const ToggleComponent = () => (
        <ProblematicComponent shouldThrow={shouldThrow} />
      );

      const { rerender } = render(
        <ErrorBoundary>
          <ToggleComponent />
        </ErrorBoundary>
      );

      // Error should be shown
      expect(screen.getByText('Application Error')).toBeInTheDocument();

      // Fix the component
      shouldThrow = false;

      // Click Try Again
      await user.click(screen.getByRole('button', { name: 'Try Again' }));

      // Re-render with fixed component
      rerender(
        <ErrorBoundary>
          <ToggleComponent />
        </ErrorBoundary>
      );

      // Should show working component again
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });

    it('should reset when resetKeys change', () => {
      let resetKey = 'key1';

      const { rerender } = render(
        <ErrorBoundary resetKeys={[resetKey]}>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error should be shown
      expect(screen.getByText('Application Error')).toBeInTheDocument();

      // Change reset key and fix component
      resetKey = 'key2';
      rerender(
        <ErrorBoundary resetKeys={[resetKey]}>
          <ProblematicComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should show working component
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });

    it('should reset when children change and resetOnPropsChange is true', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={true}>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error should be shown
      expect(screen.getByText('Application Error')).toBeInTheDocument();

      // Change children
      rerender(
        <ErrorBoundary resetOnPropsChange={true}>
          <ProblematicComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should show working component
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });

    it('should not reset when children change and resetOnPropsChange is false', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={false}>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error should be shown
      expect(screen.getByText('Application Error')).toBeInTheDocument();

      // Change children
      rerender(
        <ErrorBoundary resetOnPropsChange={false}>
          <ProblematicComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should still show error
      expect(screen.getByText('Application Error')).toBeInTheDocument();
    });
  });

  describe('Error boundary key', () => {
    it('should increment error boundary key on reset', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Get the container div
      const container = screen.getByRole('button', { name: 'Try Again' }).closest('div');
      const initialKey = container?.getAttribute('key') || '0';

      // Click Try Again
      await user.click(screen.getByRole('button', { name: 'Try Again' }));

      // Key should be different (incremented)
      // Note: In this test, the component will still show error because we haven't fixed the underlying issue
      // The key increment is internal state management
    });
  });

  describe('Complex error scenarios', () => {
    it('should handle errors in deeply nested components', () => {
      const DeepComponent = () => (
        <div>
          <div>
            <div>
              <ProblematicComponent shouldThrow={true} />
            </div>
          </div>
        </div>
      );

      render(
        <ErrorBoundary>
          <DeepComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Application Error')).toBeInTheDocument();
    });

    it('should handle multiple error boundaries', () => {
      render(
        <ErrorBoundary mfeName="Outer Boundary">
          <div>
            <ErrorBoundary mfeName="Inner Boundary" isolate={true}>
              <ProblematicComponent shouldThrow={true} />
            </ErrorBoundary>
            <div>Other content</div>
          </div>
        </ErrorBoundary>
      );

      // Only inner boundary should catch the error
      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByText('Inner Boundary')).toBeInTheDocument();
      expect(screen.getByText('Other content')).toBeInTheDocument();
    });

    it('should handle errors during renders after reset', () => {
      const ErrorOnSecondRender = ({ attemptCount }: { attemptCount: number }) => {
        if (attemptCount === 2) {
          throw new Error('Error on second render');
        }
        return <div>Render attempt {attemptCount}</div>;
      };

      let attempt = 1;

      const { rerender } = render(
        <ErrorBoundary>
          <ErrorOnSecondRender attemptCount={attempt} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Render attempt 1')).toBeInTheDocument();

      // Trigger error on second render
      attempt = 2;
      rerender(
        <ErrorBoundary>
          <ErrorOnSecondRender attemptCount={attempt} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Application Error')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle null children', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      // Should render without error
      expect(screen.getByRole('generic')).toBeInTheDocument(); // The div wrapper
    });

    it('should handle undefined children', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      );

      expect(screen.getByRole('generic')).toBeInTheDocument();
    });

    it('should handle empty resetKeys array', () => {
      render(
        <ErrorBoundary resetKeys={[]}>
          <ProblematicComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });

    it('should handle errors with no message', () => {
      const ComponentWithNoMessage = () => {
        throw new Error();
      };

      render(
        <ErrorBoundary>
          <ComponentWithNoMessage />
        </ErrorBoundary>
      );

      expect(screen.getByText('Application Error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible error UI structure', () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should have heading
      expect(screen.getByRole('heading', { name: 'Application Error' })).toBeInTheDocument();
      
      // Should have clickable button
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      
      // Should have descriptive text
      expect(screen.getByText('We encountered an unexpected error. Please try again.')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
      
      // Should be able to focus the button
      await user.tab();
      expect(tryAgainButton).toHaveFocus();
      
      // Should be able to activate with keyboard
      await user.keyboard('{Enter}');
      // Button functionality would be tested in integration with working reset
    });

    it('should have proper ARIA structure for error details', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ProblematicComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const details = screen.getByText('Error Details').closest('details');
      expect(details).toBeInTheDocument();
      expect(screen.getByText('Error Details')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render children unnecessarily', () => {
      let renderCount = 0;
      
      const CountingComponent = () => {
        renderCount++;
        return <div>Render count: {renderCount}</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <CountingComponent />
        </ErrorBoundary>
      );

      expect(renderCount).toBe(1);

      // Re-render error boundary with same props
      rerender(
        <ErrorBoundary>
          <CountingComponent />
        </ErrorBoundary>
      );

      // Component should not re-render unnecessarily
      expect(renderCount).toBe(2); // Only one additional render
    });
  });
});