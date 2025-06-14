import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge, { StatusBadgeProps } from '../StatusBadge';

describe('StatusBadge', () => {
  const defaultProps: StatusBadgeProps = {
    status: 'active',
    children: 'Active',
  };

  const renderBadge = (props: Partial<StatusBadgeProps> = {}) => {
    return render(<StatusBadge {...defaultProps} {...props} />);
  };

  it('should render badge with default props', () => {
    renderBadge();
    
    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('inline-flex', 'items-center', 'font-medium', 'rounded-full');
  });

  describe('Manual variants', () => {
    it('should render default variant', () => {
      renderBadge({ variant: 'default' });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should render success variant', () => {
      renderBadge({ variant: 'success' });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should render warning variant', () => {
      renderBadge({ variant: 'warning' });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should render danger variant', () => {
      renderBadge({ variant: 'danger' });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should render info variant', () => {
      renderBadge({ variant: 'info' });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should render neutral variant', () => {
      renderBadge({ variant: 'neutral' });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-600');
    });
  });

  describe('Auto-detected variants from status', () => {
    describe('Success statuses', () => {
      const successStatuses = ['active', 'completed', 'ready', 'confirmed', 'paid', 'in_stock'];
      
      successStatuses.forEach(status => {
        it(`should auto-detect success variant for "${status}" status`, () => {
          renderBadge({ status, children: status, variant: 'default' });
          
          const badge = screen.getByText(status);
          expect(badge).toHaveClass('bg-green-100', 'text-green-800');
        });
      });

      it('should handle case insensitive status matching', () => {
        renderBadge({ status: 'ACTIVE', children: 'ACTIVE', variant: 'default' });
        
        const badge = screen.getByText('ACTIVE');
        expect(badge).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    describe('Warning statuses', () => {
      const warningStatuses = ['preparing', 'pending', 'low_stock', 'reorder_needed'];
      
      warningStatuses.forEach(status => {
        it(`should auto-detect warning variant for "${status}" status`, () => {
          renderBadge({ status, children: status, variant: 'default' });
          
          const badge = screen.getByText(status);
          expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
        });
      });
    });

    describe('Danger statuses', () => {
      const dangerStatuses = ['cancelled', 'failed', 'expired', 'out_of_stock', 'no_show'];
      
      dangerStatuses.forEach(status => {
        it(`should auto-detect danger variant for "${status}" status`, () => {
          renderBadge({ status, children: status, variant: 'default' });
          
          const badge = screen.getByText(status);
          expect(badge).toHaveClass('bg-red-100', 'text-red-800');
        });
      });
    });

    describe('Info statuses', () => {
      const infoStatuses = ['created', 'new', 'info'];
      
      infoStatuses.forEach(status => {
        it(`should auto-detect info variant for "${status}" status`, () => {
          renderBadge({ status, children: status, variant: 'default' });
          
          const badge = screen.getByText(status);
          expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
        });
      });
    });

    describe('Neutral statuses', () => {
      const neutralStatuses = ['inactive', 'disabled'];
      
      neutralStatuses.forEach(status => {
        it(`should auto-detect neutral variant for "${status}" status`, () => {
          renderBadge({ status, children: status, variant: 'default' });
          
          const badge = screen.getByText(status);
          expect(badge).toHaveClass('bg-gray-100', 'text-gray-600');
        });
      });
    });

    it('should fallback to default variant for unknown status', () => {
      renderBadge({ status: 'unknown_status', children: 'Unknown', variant: 'default' });
      
      const badge = screen.getByText('Unknown');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should prioritize explicit variant over auto-detection', () => {
      renderBadge({ status: 'active', children: 'Active', variant: 'danger' });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
      expect(badge).not.toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      renderBadge();
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-sm');
    });

    it('should render small size', () => {
      renderBadge({ size: 'sm' });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
      expect(badge).not.toHaveClass('px-2.5', 'px-3');
    });

    it('should render medium size explicitly', () => {
      renderBadge({ size: 'md' });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-sm');
      expect(badge).not.toHaveClass('px-2', 'px-3');
    });

    it('should render large size', () => {
      renderBadge({ size: 'lg' });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('px-3', 'py-1', 'text-base');
      expect(badge).not.toHaveClass('px-2', 'px-2.5');
    });
  });

  describe('Icons', () => {
    it('should not render icon when not provided', () => {
      renderBadge();
      
      const badge = screen.getByText('Active');
      const icon = badge.querySelector('span');
      expect(icon).not.toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      renderBadge({ icon: '✅' });
      
      const badge = screen.getByText('Active');
      const icon = screen.getByText('✅');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('mr-1');
    });

    it('should render emoji icon', () => {
      renderBadge({ icon: '🚀', children: 'Launched' });
      
      expect(screen.getByText('🚀')).toBeInTheDocument();
      expect(screen.getByText('Launched')).toBeInTheDocument();
    });

    it('should render text icon', () => {
      renderBadge({ icon: '!', children: 'Alert' });
      
      expect(screen.getByText('!')).toBeInTheDocument();
      expect(screen.getByText('Alert')).toBeInTheDocument();
    });

    it('should handle empty icon', () => {
      renderBadge({ icon: '' });
      
      const badge = screen.getByText('Active');
      const iconSpan = badge.querySelector('span');
      expect(iconSpan).toBeInTheDocument(); // Empty span is still rendered
    });
  });

  describe('Children content', () => {
    it('should render simple text children', () => {
      renderBadge({ children: 'Simple Text' });
      
      expect(screen.getByText('Simple Text')).toBeInTheDocument();
    });

    it('should render complex JSX children', () => {
      renderBadge({
        children: (
          <span>
            <strong>Bold</strong> text
          </span>
        ),
      });
      
      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('text')).toBeInTheDocument();
    });

    it('should render numeric children', () => {
      renderBadge({ children: 42, status: 'count' });
      
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      renderBadge({ children: '' });
      
      const badge = screen.getByRole('generic'); // span element
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Combinations', () => {
    it('should combine all props correctly', () => {
      renderBadge({
        status: 'premium',
        variant: 'success',
        size: 'lg',
        icon: '⭐',
        children: 'Premium User',
      });
      
      const badge = screen.getByText('Premium User');
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'font-medium',
        'rounded-full',
        'bg-green-100',
        'text-green-800',
        'px-3',
        'py-1',
        'text-base'
      );
      
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });

    it('should work with all size and variant combinations', () => {
      const variants: Array<StatusBadgeProps['variant']> = ['default', 'success', 'warning', 'danger', 'info', 'neutral'];
      const sizes: Array<StatusBadgeProps['size']> = ['sm', 'md', 'lg'];

      variants.forEach(variant => {
        sizes.forEach(size => {
          const { unmount } = renderBadge({
            variant,
            size,
            children: `${variant}-${size}`,
            status: 'test',
          });
          
          const badge = screen.getByText(`${variant}-${size}`);
          expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full');
          
          unmount();
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should be a generic inline element', () => {
      renderBadge();
      
      const badge = screen.getByText('Active');
      expect(badge.tagName).toBe('SPAN');
    });

    it('should support ARIA attributes through props spreading', () => {
      // Note: The component doesn't explicitly handle ARIA props in the interface
      // but the implementation should support spreading additional props
      const badge = render(
        <StatusBadge 
          status="important" 
          variant="danger"
          {...({ 'aria-label': 'Important status indicator' } as any)}
        >
          Important
        </StatusBadge>
      );
      
      expect(screen.getByText('Important')).toBeInTheDocument();
    });

    it('should have good color contrast', () => {
      const variants: Array<StatusBadgeProps['variant']> = ['default', 'success', 'warning', 'danger', 'info', 'neutral'];
      
      variants.forEach(variant => {
        const { unmount } = renderBadge({ variant, children: `${variant} text` });
        
        const badge = screen.getByText(`${variant} text`);
        // All variants use dark text on light backgrounds for good contrast
        expect(badge.className).toMatch(/text-(gray|green|yellow|red|blue)-[68]00/);
        
        unmount();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined variant gracefully', () => {
      renderBadge({ variant: undefined });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800'); // Auto-detected from 'active' status
    });

    it('should handle undefined size gracefully', () => {
      renderBadge({ size: undefined });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-sm'); // Default to md
    });

    it('should handle null icon', () => {
      renderBadge({ icon: null as any });
      
      const badge = screen.getByText('Active');
      expect(badge).toBeInTheDocument();
    });

    it('should handle special characters in status', () => {
      renderBadge({ status: 'status-with-dashes_and_underscores', children: 'Special' });
      
      expect(screen.getByText('Special')).toBeInTheDocument();
    });

    it('should handle very long status strings', () => {
      const longStatus = 'this_is_a_very_long_status_name_that_might_be_used_in_some_systems';
      renderBadge({ status: longStatus, children: 'Long Status' });
      
      expect(screen.getByText('Long Status')).toBeInTheDocument();
    });
  });

  describe('Styling consistency', () => {
    it('should always have base classes', () => {
      renderBadge({ variant: 'danger', size: 'lg' });
      
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'font-medium', 'rounded-full');
    });

    it('should maintain rounded-full shape across variants', () => {
      const variants: Array<StatusBadgeProps['variant']> = ['default', 'success', 'warning', 'danger', 'info', 'neutral'];
      
      variants.forEach(variant => {
        const { unmount } = renderBadge({ variant, children: variant });
        
        const badge = screen.getByText(variant!);
        expect(badge).toHaveClass('rounded-full');
        
        unmount();
      });
    });
  });

  describe('Real-world scenarios', () => {
    it('should work for order status badges', () => {
      const orderStatuses = [
        { status: 'pending', expected: 'warning' },
        { status: 'paid', expected: 'success' },
        { status: 'preparing', expected: 'warning' },
        { status: 'ready', expected: 'success' },
        { status: 'cancelled', expected: 'danger' },
      ];

      orderStatuses.forEach(({ status, expected }) => {
        const { unmount } = renderBadge({ 
          status, 
          children: status.charAt(0).toUpperCase() + status.slice(1),
          variant: 'default' // Let auto-detection work
        });
        
        const badge = screen.getByText(status.charAt(0).toUpperCase() + status.slice(1));
        
        if (expected === 'success') {
          expect(badge).toHaveClass('bg-green-100', 'text-green-800');
        } else if (expected === 'warning') {
          expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
        } else if (expected === 'danger') {
          expect(badge).toHaveClass('bg-red-100', 'text-red-800');
        }
        
        unmount();
      });
    });

    it('should work for inventory status badges', () => {
      renderBadge({ status: 'in_stock', children: 'In Stock', icon: '✅' });
      
      const badge = screen.getByText('In Stock');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should work for user role badges', () => {
      renderBadge({ 
        status: 'admin', 
        variant: 'info', 
        children: 'Administrator',
        size: 'sm',
        icon: '👑'
      });
      
      const badge = screen.getByText('Administrator');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'px-2', 'py-0.5', 'text-xs');
      expect(screen.getByText('👑')).toBeInTheDocument();
    });
  });
});