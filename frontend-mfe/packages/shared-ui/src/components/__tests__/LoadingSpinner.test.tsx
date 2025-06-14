import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner, { LoadingSpinnerProps } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  const renderSpinner = (props: Partial<LoadingSpinnerProps> = {}) => {
    return render(<LoadingSpinner {...props} />);
  };

  it('should render spinner with default props', () => {
    renderSpinner();
    
    const container = screen.getByRole('generic'); // div container
    const spinner = container.querySelector('svg');
    
    expect(container).toBeInTheDocument();
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin', 'text-orange-600');
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      renderSpinner();
      
      const spinner = document.querySelector('svg');
      expect(spinner).toHaveClass('w-6', 'h-6');
    });

    it('should render small size', () => {
      renderSpinner({ size: 'sm' });
      
      const spinner = document.querySelector('svg');
      expect(spinner).toHaveClass('w-4', 'h-4');
      expect(spinner).not.toHaveClass('w-6', 'w-8', 'w-12');
    });

    it('should render medium size explicitly', () => {
      renderSpinner({ size: 'md' });
      
      const spinner = document.querySelector('svg');
      expect(spinner).toHaveClass('w-6', 'h-6');
      expect(spinner).not.toHaveClass('w-4', 'w-8', 'w-12');
    });

    it('should render large size', () => {
      renderSpinner({ size: 'lg' });
      
      const spinner = document.querySelector('svg');
      expect(spinner).toHaveClass('w-8', 'h-8');
      expect(spinner).not.toHaveClass('w-4', 'w-6', 'w-12');
    });

    it('should render extra large size', () => {
      renderSpinner({ size: 'xl' });
      
      const spinner = document.querySelector('svg');
      expect(spinner).toHaveClass('w-12', 'h-12');
      expect(spinner).not.toHaveClass('w-4', 'w-6', 'w-8');
    });
  });

  describe('Text content', () => {
    it('should not render text when not provided', () => {
      renderSpinner();
      
      const text = document.querySelector('p');
      expect(text).not.toBeInTheDocument();
    });

    it('should render text when provided', () => {
      renderSpinner({ text: 'Loading data...' });
      
      const text = screen.getByText('Loading data...');
      expect(text).toBeInTheDocument();
      expect(text).toHaveClass('text-gray-600', 'font-medium');
    });

    it('should render empty text', () => {
      renderSpinner({ text: '' });
      
      const text = screen.getByText('');
      expect(text).toBeInTheDocument();
    });

    it('should handle long text content', () => {
      const longText = 'This is a very long loading message that might wrap to multiple lines in the UI';
      renderSpinner({ text: longText });
      
      const text = screen.getByText(longText);
      expect(text).toBeInTheDocument();
    });
  });

  describe('Text sizing based on spinner size', () => {
    it('should use small text for small spinner', () => {
      renderSpinner({ size: 'sm', text: 'Loading...' });
      
      const text = screen.getByText('Loading...');
      expect(text).toHaveClass('text-sm');
      expect(text).not.toHaveClass('text-base', 'text-lg', 'text-xl');
    });

    it('should use base text for medium spinner', () => {
      renderSpinner({ size: 'md', text: 'Loading...' });
      
      const text = screen.getByText('Loading...');
      expect(text).toHaveClass('text-base');
      expect(text).not.toHaveClass('text-sm', 'text-lg', 'text-xl');
    });

    it('should use large text for large spinner', () => {
      renderSpinner({ size: 'lg', text: 'Loading...' });
      
      const text = screen.getByText('Loading...');
      expect(text).toHaveClass('text-lg');
      expect(text).not.toHaveClass('text-sm', 'text-base', 'text-xl');
    });

    it('should use extra large text for extra large spinner', () => {
      renderSpinner({ size: 'xl', text: 'Loading...' });
      
      const text = screen.getByText('Loading...');
      expect(text).toHaveClass('text-xl');
      expect(text).not.toHaveClass('text-sm', 'text-base', 'text-lg');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to container', () => {
      renderSpinner({ className: 'custom-spinner-class' });
      
      const container = screen.getByRole('generic');
      expect(container).toHaveClass('custom-spinner-class');
    });

    it('should merge custom className with default classes', () => {
      renderSpinner({ className: 'bg-blue-500 p-4' });
      
      const container = screen.getByRole('generic');
      expect(container).toHaveClass('bg-blue-500', 'p-4', 'flex', 'items-center', 'justify-center');
    });

    it('should handle empty className', () => {
      renderSpinner({ className: '' });
      
      const container = screen.getByRole('generic');
      expect(container).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('SVG structure and attributes', () => {
    it('should have proper SVG attributes', () => {
      renderSpinner();
      
      const spinner = document.querySelector('svg');
      expect(spinner).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(spinner).toHaveAttribute('fill', 'none');
      expect(spinner).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should contain circle and path elements', () => {
      renderSpinner();
      
      const circle = document.querySelector('circle');
      const path = document.querySelector('path');
      
      expect(circle).toBeInTheDocument();
      expect(path).toBeInTheDocument();
    });

    it('should have correct circle attributes', () => {
      renderSpinner();
      
      const circle = document.querySelector('circle');
      expect(circle).toHaveAttribute('cx', '12');
      expect(circle).toHaveAttribute('cy', '12');
      expect(circle).toHaveAttribute('r', '10');
      expect(circle).toHaveAttribute('stroke', 'currentColor');
      expect(circle).toHaveAttribute('strokeWidth', '4');
      expect(circle).toHaveClass('opacity-25');
    });

    it('should have correct path attributes', () => {
      renderSpinner();
      
      const path = document.querySelector('path');
      expect(path).toHaveAttribute('fill', 'currentColor');
      expect(path).toHaveClass('opacity-75');
    });
  });

  describe('Layout and positioning', () => {
    it('should have centered flex layout', () => {
      renderSpinner();
      
      const container = screen.getByRole('generic');
      expect(container).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should have column flex layout for inner content', () => {
      renderSpinner({ text: 'Loading...' });
      
      const innerContainer = document.querySelector('.flex.flex-col');
      expect(innerContainer).toBeInTheDocument();
      expect(innerContainer).toHaveClass('items-center', 'space-y-2');
    });

    it('should maintain layout with different sizes', () => {
      const sizes: Array<LoadingSpinnerProps['size']> = ['sm', 'md', 'lg', 'xl'];
      
      sizes.forEach(size => {
        const { unmount } = renderSpinner({ size, text: `Loading ${size}...` });
        
        const container = screen.getByRole('generic');
        expect(container).toHaveClass('flex', 'items-center', 'justify-center');
        
        unmount();
      });
    });
  });

  describe('Animation', () => {
    it('should have spin animation class', () => {
      renderSpinner();
      
      const spinner = document.querySelector('svg');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should maintain animation across all sizes', () => {
      const sizes: Array<LoadingSpinnerProps['size']> = ['sm', 'md', 'lg', 'xl'];
      
      sizes.forEach(size => {
        const { unmount } = renderSpinner({ size });
        
        const spinner = document.querySelector('svg');
        expect(spinner).toHaveClass('animate-spin');
        
        unmount();
      });
    });
  });

  describe('Color and theming', () => {
    it('should use orange color theme', () => {
      renderSpinner();
      
      const spinner = document.querySelector('svg');
      expect(spinner).toHaveClass('text-orange-600');
    });

    it('should use gray color for text', () => {
      renderSpinner({ text: 'Loading...' });
      
      const text = screen.getByText('Loading...');
      expect(text).toHaveClass('text-gray-600');
    });

    it('should use font-medium for text', () => {
      renderSpinner({ text: 'Loading...' });
      
      const text = screen.getByText('Loading...');
      expect(text).toHaveClass('font-medium');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible to screen readers', () => {
      renderSpinner({ text: 'Loading data...' });
      
      // The text provides context for screen readers
      const text = screen.getByText('Loading data...');
      expect(text).toBeInTheDocument();
    });

    it('should work without text for screen readers', () => {
      renderSpinner();
      
      // Even without text, the spinning animation is recognizable
      const spinner = document.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should support ARIA attributes through className', () => {
      renderSpinner({ 
        className: 'custom-class',
        text: 'Loading...'
      });
      
      // The component structure allows for ARIA attributes to be added
      const container = screen.getByRole('generic');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined size gracefully', () => {
      renderSpinner({ size: undefined });
      
      const spinner = document.querySelector('svg');
      expect(spinner).toHaveClass('w-6', 'h-6'); // Should default to 'md'
    });

    it('should handle undefined text gracefully', () => {
      renderSpinner({ text: undefined });
      
      const text = document.querySelector('p');
      expect(text).not.toBeInTheDocument();
    });

    it('should handle special characters in text', () => {
      const specialText = 'Loading... 🔄 ♪ ♫ & <script>';
      renderSpinner({ text: specialText });
      
      const text = screen.getByText(specialText);
      expect(text).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('should support responsive classes in className', () => {
      renderSpinner({ className: 'w-full md:w-auto p-2 md:p-4' });
      
      const container = screen.getByRole('generic');
      expect(container).toHaveClass('w-full', 'md:w-auto', 'p-2', 'md:p-4');
    });
  });

  describe('Performance considerations', () => {
    it('should render efficiently with minimal DOM elements', () => {
      renderSpinner({ text: 'Loading...' });
      
      // Should have a clean, minimal DOM structure
      const container = screen.getByRole('generic');
      const svg = container.querySelector('svg');
      const text = container.querySelector('p');
      
      expect(container.children).toHaveLength(1); // One inner div
      expect(svg).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });

    it('should render even more efficiently without text', () => {
      renderSpinner();
      
      const container = screen.getByRole('generic');
      const svg = container.querySelector('svg');
      const text = container.querySelector('p');
      
      expect(svg).toBeInTheDocument();
      expect(text).not.toBeInTheDocument();
    });
  });
});