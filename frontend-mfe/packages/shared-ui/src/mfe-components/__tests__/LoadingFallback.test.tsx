import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingFallback, { LoadingFallbackProps } from '../LoadingFallback';

// Mock the LoadingSpinner component
jest.mock('../../components/LoadingSpinner', () => {
  return function MockLoadingSpinner({ size }: { size?: string }) {
    return <div data-testid="loading-spinner" data-size={size}>Spinner ({size})</div>;
  };
});

describe('LoadingFallback', () => {
  const renderLoadingFallback = (props: Partial<LoadingFallbackProps> = {}) => {
    return render(<LoadingFallback {...props} />);
  };

  describe('Basic rendering', () => {
    it('should render with default props', () => {
      renderLoadingFallback();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have default container classes for normal mode', () => {
      renderLoadingFallback();

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-[200px]', 'p-8');
      expect(container).not.toHaveClass('fixed', 'inset-0', 'z-50');
    });

    it('should render with large spinner by default', () => {
      renderLoadingFallback();

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveAttribute('data-size', 'lg');
    });

    it('should have centered text layout', () => {
      renderLoadingFallback({ message: 'Test message' });

      const textContainer = screen.getByText('Test message').closest('.text-center');
      expect(textContainer).toBeInTheDocument();
      expect(textContainer).toHaveClass('space-y-4');
    });
  });

  describe('Name prop', () => {
    it('should generate loading message from name', () => {
      renderLoadingFallback({ name: 'Menu Management' });

      expect(screen.getByText('Loading Menu Management...')).toBeInTheDocument();
    });

    it('should handle name with special characters', () => {
      renderLoadingFallback({ name: 'Order-Processing_v2' });

      expect(screen.getByText('Loading Order-Processing_v2...')).toBeInTheDocument();
    });

    it('should handle empty name', () => {
      renderLoadingFallback({ name: '' });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle undefined name', () => {
      renderLoadingFallback({ name: undefined });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle long names', () => {
      const longName = 'Very Long MFE Component Name That Might Be Used In Enterprise Applications';
      renderLoadingFallback({ name: longName });

      expect(screen.getByText(`Loading ${longName}...`)).toBeInTheDocument();
    });
  });

  describe('Message prop', () => {
    it('should display custom message when provided', () => {
      renderLoadingFallback({ message: 'Please wait while we load your data' });

      expect(screen.getByText('Please wait while we load your data')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should prioritize message over name', () => {
      renderLoadingFallback({ 
        name: 'Menu Management',
        message: 'Custom loading message'
      });

      expect(screen.getByText('Custom loading message')).toBeInTheDocument();
      expect(screen.queryByText('Loading Menu Management...')).not.toBeInTheDocument();
    });

    it('should handle empty message', () => {
      renderLoadingFallback({ message: '' });

      expect(screen.getByText('')).toBeInTheDocument();
    });

    it('should handle message with HTML entities', () => {
      renderLoadingFallback({ message: 'Loading... Please wait & be patient' });

      expect(screen.getByText('Loading... Please wait & be patient')).toBeInTheDocument();
    });

    it('should handle very long messages', () => {
      const longMessage = 'This is a very long loading message that might wrap to multiple lines and should still be displayed correctly in the loading fallback component';
      renderLoadingFallback({ message: longMessage });

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('Full screen mode', () => {
    it('should use fullscreen layout when fullScreen is true', () => {
      renderLoadingFallback({ fullScreen: true });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('fixed', 'inset-0', 'bg-white', 'bg-opacity-90', 'flex', 'items-center', 'justify-center', 'z-50');
      expect(container).not.toHaveClass('min-h-[200px]', 'p-8');
    });

    it('should use normal layout when fullScreen is false', () => {
      renderLoadingFallback({ fullScreen: false });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-[200px]', 'p-8');
      expect(container).not.toHaveClass('fixed', 'inset-0', 'z-50');
    });

    it('should work with fullscreen and custom message', () => {
      renderLoadingFallback({ 
        fullScreen: true, 
        message: 'Loading application...' 
      });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('fixed', 'inset-0', 'z-50');
      expect(screen.getByText('Loading application...')).toBeInTheDocument();
    });

    it('should have proper z-index in fullscreen mode', () => {
      renderLoadingFallback({ fullScreen: true });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('z-50');
    });

    it('should have semi-transparent background in fullscreen mode', () => {
      renderLoadingFallback({ fullScreen: true });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('bg-white', 'bg-opacity-90');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to container', () => {
      renderLoadingFallback({ className: 'custom-loading-class' });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('custom-loading-class');
    });

    it('should merge custom className with default classes', () => {
      renderLoadingFallback({ className: 'bg-gray-100 border-2' });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('bg-gray-100', 'border-2', 'flex', 'items-center', 'justify-center');
    });

    it('should work with fullscreen and custom className', () => {
      renderLoadingFallback({ 
        fullScreen: true, 
        className: 'custom-fullscreen-class' 
      });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('custom-fullscreen-class', 'fixed', 'inset-0', 'z-50');
    });

    it('should handle empty className', () => {
      renderLoadingFallback({ className: '' });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should handle undefined className', () => {
      renderLoadingFallback({ className: undefined });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should handle whitespace-only className', () => {
      renderLoadingFallback({ className: '   ' });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Text styling', () => {
    it('should have proper text styling', () => {
      renderLoadingFallback({ message: 'Loading...' });

      const text = screen.getByText('Loading...');
      expect(text).toHaveClass('text-gray-600', 'font-medium');
    });

    it('should maintain text styling with different messages', () => {
      renderLoadingFallback({ message: 'Custom loading text' });

      const text = screen.getByText('Custom loading text');
      expect(text).toHaveClass('text-gray-600', 'font-medium');
    });

    it('should maintain text styling with name-generated message', () => {
      renderLoadingFallback({ name: 'Test Component' });

      const text = screen.getByText('Loading Test Component...');
      expect(text).toHaveClass('text-gray-600', 'font-medium');
    });
  });

  describe('Component integration', () => {
    it('should pass correct size to LoadingSpinner', () => {
      renderLoadingFallback();

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveAttribute('data-size', 'lg');
    });

    it('should render LoadingSpinner and text in correct order', () => {
      renderLoadingFallback({ message: 'Test order' });

      const container = screen.getByText('Test order').closest('.text-center');
      const spinner = screen.getByTestId('loading-spinner');
      const text = screen.getByText('Test order');

      expect(container).toContainElement(spinner);
      expect(container).toContainElement(text);
      
      // Spinner should come before text in DOM order
      const children = Array.from(container!.children);
      const spinnerIndex = children.findIndex(child => child.contains(spinner));
      const textIndex = children.findIndex(child => child === text);
      expect(spinnerIndex).toBeLessThan(textIndex);
    });
  });

  describe('Edge cases', () => {
    it('should handle all props as undefined', () => {
      renderLoadingFallback({
        name: undefined,
        message: undefined,
        fullScreen: undefined,
        className: undefined,
      });

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-[200px]', 'p-8');
    });

    it('should handle boolean false values correctly', () => {
      renderLoadingFallback({ fullScreen: false });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).not.toHaveClass('fixed', 'inset-0');
      expect(container).toHaveClass('min-h-[200px]');
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'Loading... 🔄 ♪ ♫ & <script> "quotes" \'single\'';
      renderLoadingFallback({ message: specialMessage });

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle numeric-like names', () => {
      renderLoadingFallback({ name: '123-Component' });

      expect(screen.getByText('Loading 123-Component...')).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('should support responsive classes in className', () => {
      renderLoadingFallback({ className: 'p-2 md:p-4 lg:p-8' });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('p-2', 'md:p-4', 'lg:p-8');
    });

    it('should maintain responsive layout in fullscreen mode', () => {
      renderLoadingFallback({ 
        fullScreen: true, 
        className: 'text-sm md:text-base lg:text-lg' 
      });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('fixed', 'inset-0', 'text-sm', 'md:text-base', 'lg:text-lg');
    });
  });

  describe('Accessibility', () => {
    it('should have proper container structure for screen readers', () => {
      renderLoadingFallback({ message: 'Loading content...' });

      const container = screen.getByTestId('loading-spinner').closest('div');
      const textCenter = container?.querySelector('.text-center');
      
      expect(textCenter).toBeInTheDocument();
      expect(textCenter).toHaveClass('space-y-4');
    });

    it('should have descriptive text for screen readers', () => {
      renderLoadingFallback({ name: 'User Dashboard' });

      // The text "Loading User Dashboard..." provides context for screen readers
      expect(screen.getByText('Loading User Dashboard...')).toBeInTheDocument();
    });

    it('should work with ARIA attributes through className', () => {
      renderLoadingFallback({ 
        className: 'aria-loading-region',
        message: 'Loading...'
      });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('aria-loading-region');
    });

    it('should have proper visual hierarchy', () => {
      renderLoadingFallback({ message: 'Loading data...' });

      const container = screen.getByText('Loading data...').closest('.text-center');
      expect(container).toHaveClass('space-y-4'); // Proper spacing between elements
    });
  });

  describe('Real-world scenarios', () => {
    it('should work as MFE loading fallback', () => {
      renderLoadingFallback({ 
        name: 'Menu Management',
        className: 'mfe-loading-container'
      });

      expect(screen.getByText('Loading Menu Management...')).toBeInTheDocument();
      
      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('mfe-loading-container');
    });

    it('should work as page-level loading', () => {
      renderLoadingFallback({ 
        fullScreen: true,
        message: 'Loading Restaurant Platform...',
        className: 'app-loading'
      });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('fixed', 'inset-0', 'z-50', 'app-loading');
      expect(screen.getByText('Loading Restaurant Platform...')).toBeInTheDocument();
    });

    it('should work as component-level loading', () => {
      renderLoadingFallback({ 
        message: 'Loading orders...',
        className: 'component-loading min-h-[100px]'
      });

      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('component-loading', 'min-h-[100px]');
      expect(container).not.toHaveClass('fixed', 'inset-0');
    });

    it('should work for lazy-loaded components', () => {
      renderLoadingFallback({ 
        name: 'Orders Module',
        className: 'lazy-component-loading'
      });

      expect(screen.getByText('Loading Orders Module...')).toBeInTheDocument();
      
      const container = screen.getByTestId('loading-spinner').closest('div');
      expect(container).toHaveClass('lazy-component-loading');
    });
  });

  describe('Performance considerations', () => {
    it('should render efficiently with minimal DOM elements', () => {
      renderLoadingFallback({ message: 'Loading...' });

      const container = screen.getByTestId('loading-spinner').closest('div');
      const textCenter = container?.querySelector('.text-center');
      
      // Should have clean, minimal structure
      expect(container?.children).toHaveLength(1); // Only one child (.text-center)
      expect(textCenter?.children).toHaveLength(2); // Spinner and text
    });

    it('should not cause unnecessary re-renders', () => {
      const { rerender } = renderLoadingFallback({ message: 'Loading...' });

      const initialContainer = screen.getByTestId('loading-spinner').closest('div');
      
      // Re-render with same props
      rerender(<LoadingFallback message="Loading..." />);
      
      const newContainer = screen.getByTestId('loading-spinner').closest('div');
      expect(newContainer).toBeInTheDocument();
    });
  });
});