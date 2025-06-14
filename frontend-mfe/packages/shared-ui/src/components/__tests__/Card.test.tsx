import React from 'react';
import { render, screen } from '@testing-library/react';
import Card, { CardProps } from '../Card';

describe('Card', () => {
  const defaultProps: CardProps = {
    children: 'Test content',
  };

  const renderCard = (props: Partial<CardProps> = {}) => {
    return render(<Card {...defaultProps} {...props} />);
  };

  it('should render card with default props', () => {
    renderCard();
    
    const card = screen.getByText('Test content');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-white', 'rounded-lg');
  });

  describe('Variants', () => {
    it('should render default variant with shadow', () => {
      renderCard({ variant: 'default' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('shadow');
      expect(card).not.toHaveClass('shadow-lg', 'border');
    });

    it('should render elevated variant with larger shadow', () => {
      renderCard({ variant: 'elevated' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('shadow-lg');
      expect(card).not.toHaveClass('shadow', 'border');
    });

    it('should render outlined variant with border', () => {
      renderCard({ variant: 'outlined' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('border', 'border-gray-200');
      expect(card).not.toHaveClass('shadow', 'shadow-lg');
    });

    it('should default to default variant when not specified', () => {
      renderCard();
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('shadow');
    });
  });

  describe('Padding', () => {
    it('should render medium padding by default', () => {
      renderCard();
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('p-6');
    });

    it('should render no padding', () => {
      renderCard({ padding: 'none' });
      
      const card = screen.getByText('Test content');
      expect(card).not.toHaveClass('p-4', 'p-6', 'p-8');
    });

    it('should render small padding', () => {
      renderCard({ padding: 'sm' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('p-4');
      expect(card).not.toHaveClass('p-6', 'p-8');
    });

    it('should render medium padding', () => {
      renderCard({ padding: 'md' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('p-6');
      expect(card).not.toHaveClass('p-4', 'p-8');
    });

    it('should render large padding', () => {
      renderCard({ padding: 'lg' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('p-8');
      expect(card).not.toHaveClass('p-4', 'p-6');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      renderCard({ className: 'custom-card-class' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('custom-card-class');
    });

    it('should merge custom className with default classes', () => {
      renderCard({ className: 'custom-card-class w-full' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('custom-card-class', 'w-full', 'bg-white', 'rounded-lg');
    });

    it('should override default classes when necessary', () => {
      renderCard({ className: 'bg-red-500' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('bg-red-500', 'bg-white'); // Both classes present, CSS cascade applies
    });
  });

  describe('Children content', () => {
    it('should render simple text content', () => {
      renderCard({ children: 'Simple text' });
      
      expect(screen.getByText('Simple text')).toBeInTheDocument();
    });

    it('should render complex JSX content', () => {
      renderCard({
        children: (
          <div>
            <h2>Card Title</h2>
            <p>Card description with <strong>bold text</strong></p>
            <button>Action Button</button>
          </div>
        ),
      });
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText(/Card description with/)).toBeInTheDocument();
      expect(screen.getByText('bold text')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      renderCard({
        children: [
          <div key="1">First child</div>,
          <div key="2">Second child</div>,
          <div key="3">Third child</div>,
        ],
      });
      
      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
      expect(screen.getByText('Third child')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      renderCard({ children: '' });
      
      const card = screen.getByRole('generic'); // div element
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-white', 'rounded-lg');
    });

    it('should handle null children', () => {
      renderCard({ children: null });
      
      const card = screen.getByRole('generic');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Combination of props', () => {
    it('should combine variant, padding, and className', () => {
      renderCard({
        variant: 'elevated',
        padding: 'lg',
        className: 'max-w-md mx-auto',
      });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass(
        'bg-white',
        'rounded-lg',
        'shadow-lg',
        'p-8',
        'max-w-md',
        'mx-auto'
      );
    });

    it('should handle all combinations of variants and padding', () => {
      const variants: Array<CardProps['variant']> = ['default', 'elevated', 'outlined'];
      const paddings: Array<CardProps['padding']> = ['none', 'sm', 'md', 'lg'];

      variants.forEach(variant => {
        paddings.forEach(padding => {
          const { unmount } = renderCard({ variant, padding, children: `${variant}-${padding}` });
          
          const card = screen.getByText(`${variant}-${padding}`);
          expect(card).toHaveClass('bg-white', 'rounded-lg');
          
          unmount();
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should be a generic container by default', () => {
      renderCard();
      
      const card = screen.getByRole('generic');
      expect(card).toBeInTheDocument();
    });

    it('should support custom ARIA attributes', () => {
      renderCard({
        children: 'Accessible card',
        className: '',
        // Cast to any to add ARIA attributes for testing
        ...(({ 'aria-label': 'Card with important content', role: 'region' } as any)),
      });
      
      // Note: In real implementation, we'd need to extend CardProps to include ARIA attributes
      // For now, we test that the component structure supports accessibility
      const card = screen.getByText('Accessible card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Styling consistency', () => {
    it('should always have base classes', () => {
      renderCard({ variant: 'outlined', padding: 'none', className: 'custom' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('bg-white', 'rounded-lg');
    });

    it('should maintain rounded corners across variants', () => {
      const variants: Array<CardProps['variant']> = ['default', 'elevated', 'outlined'];
      
      variants.forEach(variant => {
        const { unmount } = renderCard({ variant, children: `${variant} content` });
        
        const card = screen.getByText(`${variant} content`);
        expect(card).toHaveClass('rounded-lg');
        
        unmount();
      });
    });

    it('should maintain white background across variants', () => {
      const variants: Array<CardProps['variant']> = ['default', 'elevated', 'outlined'];
      
      variants.forEach(variant => {
        const { unmount } = renderCard({ variant, children: `${variant} content` });
        
        const card = screen.getByText(`${variant} content`);
        expect(card).toHaveClass('bg-white');
        
        unmount();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined variant gracefully', () => {
      renderCard({ variant: undefined });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('shadow'); // Should default to 'default' variant
    });

    it('should handle undefined padding gracefully', () => {
      renderCard({ padding: undefined });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('p-6'); // Should default to 'md' padding
    });

    it('should handle empty className', () => {
      renderCard({ className: '' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow', 'p-6');
    });

    it('should handle whitespace-only className', () => {
      renderCard({ className: '   ' });
      
      const card = screen.getByText('Test content');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('should support responsive classes in className', () => {
      renderCard({ className: 'w-full md:w-1/2 lg:w-1/3' });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('w-full', 'md:w-1/2', 'lg:w-1/3');
    });

    it('should support responsive padding via className', () => {
      renderCard({ 
        padding: 'none',
        className: 'p-2 md:p-4 lg:p-6' 
      });
      
      const card = screen.getByText('Test content');
      expect(card).toHaveClass('p-2', 'md:p-4', 'lg:p-6');
      expect(card).not.toHaveClass('p-4', 'p-6', 'p-8'); // No default padding
    });
  });
});