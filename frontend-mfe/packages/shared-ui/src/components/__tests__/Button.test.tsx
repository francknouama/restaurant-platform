import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button, { ButtonProps } from '../Button';

describe('Button', () => {
  const defaultProps: ButtonProps = {
    children: 'Test Button',
  };

  const renderButton = (props: Partial<ButtonProps> = {}) => {
    return render(<Button {...defaultProps} {...props} />);
  };

  it('should render button with default props', () => {
    renderButton();
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Test Button');
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      renderButton();
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-orange-600', 'text-white', 'hover:bg-orange-700');
    });

    it('should render secondary variant', () => {
      renderButton({ variant: 'secondary' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-600', 'text-white', 'hover:bg-gray-700');
    });

    it('should render outline variant', () => {
      renderButton({ variant: 'outline' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-gray-300', 'text-gray-700', 'bg-white');
    });

    it('should render danger variant', () => {
      renderButton({ variant: 'danger' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600', 'text-white', 'hover:bg-red-700');
    });

    it('should render success variant', () => {
      renderButton({ variant: 'success' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-600', 'text-white', 'hover:bg-green-700');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      renderButton();
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
    });

    it('should render extra small size', () => {
      renderButton({ size: 'xs' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('should render small size', () => {
      renderButton({ size: 'sm' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should render large size', () => {
      renderButton({ size: 'lg' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-base');
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner when loading is true', () => {
      renderButton({ loading: true });
      
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-4', 'h-4', 'mr-2', 'animate-spin');
      expect(button).toBeDisabled();
    });

    it('should not show loading spinner when loading is false', () => {
      renderButton({ loading: false });
      
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      
      expect(spinner).not.toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should disable button when loading', () => {
      renderButton({ loading: true });
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });
  });

  describe('Disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      renderButton({ disabled: true });
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('should be disabled when both disabled and loading are true', () => {
      renderButton({ disabled: true, loading: true });
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be enabled when disabled is false and not loading', () => {
      renderButton({ disabled: false, loading: false });
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      renderButton({ className: 'custom-class' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      renderButton({ className: 'custom-class' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class', 'inline-flex', 'items-center');
    });
  });

  describe('Event handling', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      renderButton({ onClick: handleClick });
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      renderButton({ onClick: handleClick, disabled: true });
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      renderButton({ onClick: handleClick, loading: true });
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle onMouseEnter event', async () => {
      const user = userEvent.setup();
      const handleMouseEnter = jest.fn();
      renderButton({ onMouseEnter: handleMouseEnter });
      
      const button = screen.getByRole('button');
      await user.hover(button);
      
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('should handle onFocus event', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();
      renderButton({ onFocus: handleFocus });
      
      const button = screen.getByRole('button');
      await user.tab(); // Focus the button
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper focus styles', () => {
      renderButton();
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2');
    });

    it('should support aria-label', () => {
      renderButton({ 'aria-label': 'Custom label' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should support aria-describedby', () => {
      renderButton({ 'aria-describedby': 'description' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      renderButton({ onClick: handleClick });
      
      const button = screen.getByRole('button');
      await user.tab();
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should support space key activation', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      renderButton({ onClick: handleClick });
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button types', () => {
    it('should default to button type', () => {
      renderButton();
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should support submit type', () => {
      renderButton({ type: 'submit' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should support reset type', () => {
      renderButton({ type: 'reset' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });
  });

  describe('Complex content', () => {
    it('should render with complex children', () => {
      renderButton({
        children: (
          <span>
            <strong>Bold</strong> and <em>italic</em> text
          </span>
        ),
      });
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Bold and italic text');
      expect(button.querySelector('strong')).toBeInTheDocument();
      expect(button.querySelector('em')).toBeInTheDocument();
    });

    it('should render with icon and text', () => {
      renderButton({
        children: (
          <>
            <span className="icon">🚀</span>
            <span>Launch</span>
          </>
        ),
      });
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('🚀Launch');
    });
  });

  describe('Focus ring colors', () => {
    it('should have orange focus ring for primary variant', () => {
      renderButton({ variant: 'primary' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-orange-500');
    });

    it('should have gray focus ring for secondary variant', () => {
      renderButton({ variant: 'secondary' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-gray-500');
    });

    it('should have red focus ring for danger variant', () => {
      renderButton({ variant: 'danger' });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-red-500');
    });
  });

  describe('Loading spinner accessibility', () => {
    it('should have proper SVG attributes for screen readers', () => {
      renderButton({ loading: true });
      
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(spinner).toHaveAttribute('fill', 'none');
      expect(spinner).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty children', () => {
      renderButton({ children: '' });
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle null children', () => {
      renderButton({ children: null });
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle undefined variant gracefully', () => {
      renderButton({ variant: undefined });
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-orange-600'); // Should default to primary
    });
  });
});