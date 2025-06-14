import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the shared-ui components
jest.mock('@restaurant/shared-ui', () => ({
  LoadingSpinner: ({ text }: { text?: string }) => (
    <div data-testid="loading-spinner">{text}</div>
  ),
}));

const TestChild: React.FC = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute', () => {
  const mockAuthContext = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    canAccess: jest.fn(),
    hasRole: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthContext);
  });

  it('should show loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isLoading: true,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toHaveTextContent('Loading...');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to custom path when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute redirectTo="/custom-login">
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/custom-login');
  });

  it('should render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('should check permissions when resource and action are provided', () => {
    const mockCanAccess = jest.fn().mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
      canAccess: mockCanAccess,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute resource="menu" action="read">
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(mockCanAccess).toHaveBeenCalledWith('menu', 'read');
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should show access denied when user lacks permissions', () => {
    const mockCanAccess = jest.fn().mockReturnValue(false);
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
      canAccess: mockCanAccess,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute resource="menu" action="delete">
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(mockCanAccess).toHaveBeenCalledWith('menu', 'delete');
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to access this resource.")).toBeInTheDocument();
    expect(screen.getByText('Required permission: menu:delete')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should skip permission check when only resource is provided', () => {
    const mockCanAccess = jest.fn();
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
      canAccess: mockCanAccess,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute resource="menu">
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(mockCanAccess).not.toHaveBeenCalled();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should skip permission check when only action is provided', () => {
    const mockCanAccess = jest.fn();
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
      canAccess: mockCanAccess,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute action="read">
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(mockCanAccess).not.toHaveBeenCalled();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should handle multiple children', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('should preserve location state for redirect', () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: false,
      isLoading: false,
    });

    // This would be more comprehensively tested in an integration test
    // where we can verify the actual Navigate component props
    render(
      <MemoryRouter initialEntries={['/protected-page']}>
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
  });

  describe('Edge cases', () => {
    it('should handle canAccess throwing an error', () => {
      const mockCanAccess = jest.fn().mockImplementation(() => {
        throw new Error('Permission check failed');
      });
      
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        isAuthenticated: true,
        isLoading: false,
        canAccess: mockCanAccess,
      });

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(
          <MemoryRouter>
            <ProtectedRoute resource="menu" action="read">
              <TestChild />
            </ProtectedRoute>
          </MemoryRouter>
        );
      }).toThrow('Permission check failed');

      console.error = originalError;
    });

    it('should handle undefined resource and action gracefully', () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        isAuthenticated: true,
        isLoading: false,
        canAccess: jest.fn(),
      });

      render(
        <MemoryRouter>
          <ProtectedRoute resource={undefined} action={undefined}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});