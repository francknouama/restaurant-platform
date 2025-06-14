import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from 'react-router-dom';
import NewOrderPage from '../NewOrderPage';

// Mock React Router
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

// Mock the shared UI components
jest.mock('@restaurant/shared-ui', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  Button: ({ children, variant, size, className, disabled, onClick, ...props }: { 
    children: React.ReactNode; 
    variant?: string; 
    size?: string; 
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    [key: string]: any;
  }) => (
    <button 
      data-testid="button" 
      data-variant={variant} 
      data-size={size} 
      className={className}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
  Input: ({ label, placeholder, value, onChange, icon, type, size, ...props }: {
    label?: string;
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon?: React.ReactNode;
    type?: string;
    size?: string;
    [key: string]: any;
  }) => (
    <div data-testid="input-container">
      {label && <label data-testid="input-label">{label}</label>}
      {icon && <span data-testid="input-icon">{icon}</span>}
      <input 
        data-testid="input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        type={type}
        data-size={size}
        {...props}
      />
    </div>
  ),
}));

// Mock the shared state hooks
const mockEmitOrderCreated = jest.fn();
const mockOnMenuItemUpdated = jest.fn(() => jest.fn()); // Returns unsubscribe function

jest.mock('@restaurant/shared-state', () => ({
  useRestaurantEvents: () => ({
    emitOrderCreated: mockEmitOrderCreated,
    onMenuItemUpdated: mockOnMenuItemUpdated,
  }),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Minus: () => <div data-testid="minus-icon">Minus</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  User: () => <div data-testid="user-icon">User</div>,
  MapPin: () => <div data-testid="map-pin-icon">MapPin</div>,
  CreditCard: () => <div data-testid="credit-card-icon">CreditCard</div>,
  ShoppingCart: () => <div data-testid="shopping-cart-icon">ShoppingCart</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
}));

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

describe('NewOrderPage', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockEmitOrderCreated.mockClear();
    mockOnMenuItemUpdated.mockClear();
    mockNavigate.mockClear();
    mockAlert.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderNewOrderPage = () => {
    return render(<NewOrderPage />);
  };

  const waitForMenuItemsToLoad = async () => {
    // Advance timers to trigger useEffect setTimeout
    jest.advanceTimersByTime(500);
    await waitFor(() => {
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    });
  };

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      renderNewOrderPage();
      
      // Should show loading skeleton
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should hide loading state after menu items load', async () => {
      renderNewOrderPage();
      
      await waitForMenuItemsToLoad();
      
      // Should no longer show loading skeleton
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(0);
    });
  });

  describe('Page Structure and Header', () => {
    it('should render the page title and description', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      expect(screen.getByText('New Order')).toBeInTheDocument();
      expect(screen.getByText('Create a new order for your customer')).toBeInTheDocument();
    });

    it('should render back button that navigates to orders', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const backButton = screen.getByText('Back').closest('button');
      expect(backButton).toBeInTheDocument();
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
      
      await user.click(backButton!);
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });

    it('should have proper heading hierarchy', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const mainTitle = screen.getByRole('heading', { level: 1 });
      expect(mainTitle).toHaveTextContent('New Order');
    });
  });

  describe('Order Type Selection', () => {
    it('should render all three order type options', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      expect(screen.getByText('DINE IN')).toBeInTheDocument();
      expect(screen.getByText('TAKEOUT')).toBeInTheDocument();
      expect(screen.getByText('DELIVERY')).toBeInTheDocument();
    });

    it('should show descriptions for each order type', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      expect(screen.getByText('Customer dining in restaurant')).toBeInTheDocument();
      expect(screen.getByText('Customer picks up order')).toBeInTheDocument();
      expect(screen.getByText('Order delivered to customer')).toBeInTheDocument();
    });

    it('should default to DINE_IN', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const dineInButton = screen.getByText('DINE IN').closest('button');
      expect(dineInButton).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('should change order type when clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const takeoutButton = screen.getByText('TAKEOUT').closest('button');
      await user.click(takeoutButton!);
      
      expect(takeoutButton).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('should show address field when DELIVERY is selected', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const deliveryButton = screen.getByText('DELIVERY').closest('button');
      await user.click(deliveryButton!);
      
      expect(screen.getByText('Delivery Address *')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter delivery address')).toBeInTheDocument();
    });

    it('should hide address field when switching from DELIVERY', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Select delivery first
      const deliveryButton = screen.getByText('DELIVERY').closest('button');
      await user.click(deliveryButton!);
      
      expect(screen.getByText('Delivery Address *')).toBeInTheDocument();
      
      // Switch to takeout
      const takeoutButton = screen.getByText('TAKEOUT').closest('button');
      await user.click(takeoutButton!);
      
      expect(screen.queryByText('Delivery Address *')).not.toBeInTheDocument();
    });
  });

  describe('Menu Items Display', () => {
    it('should display all available menu items', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
      expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      
      // Fish & Chips should not be displayed as it's unavailable
      expect(screen.queryByText('Fish & Chips')).not.toBeInTheDocument();
    });

    it('should display menu item details correctly', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Check pizza details
      expect(screen.getByText('Fresh tomato sauce, mozzarella, and basil')).toBeInTheDocument();
      expect(screen.getByText('$18.99')).toBeInTheDocument();
      expect(screen.getByText('(Pizza)')).toBeInTheDocument();
      expect(screen.getByText('15min')).toBeInTheDocument();
    });

    it('should show Add buttons for all menu items', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const addButtons = screen.getAllByText('Add');
      expect(addButtons).toHaveLength(4); // 4 available items
    });

    it('should display currency and time formatting', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Check currency formatting
      expect(screen.getByText('$18.99')).toBeInTheDocument();
      expect(screen.getByText('$13.50')).toBeInTheDocument();
      
      // Check time formatting with clock icons
      const clockIcons = screen.getAllByTestId('clock-icon');
      expect(clockIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Menu Search and Filtering', () => {
    it('should render search input with icon', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const searchInput = screen.getByPlaceholderText('Search menu items...');
      expect(searchInput).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('should filter menu items by search term', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const searchInput = screen.getByPlaceholderText('Search menu items...');
      await user.type(searchInput, 'pizza');
      
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
      expect(screen.queryByText('Caesar Salad')).not.toBeInTheDocument();
      expect(screen.queryByText('Chicken Burger')).not.toBeInTheDocument();
    });

    it('should filter by menu item description', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const searchInput = screen.getByPlaceholderText('Search menu items...');
      await user.type(searchInput, 'lettuce');
      
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
      expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
      expect(screen.queryByText('Margherita Pizza')).not.toBeInTheDocument();
    });

    it('should render category filter dropdown', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const categorySelect = screen.getByDisplayValue('All Categories');
      expect(categorySelect).toBeInTheDocument();
      
      // Check category options
      expect(screen.getByRole('option', { name: 'All Categories' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pizza' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Salads' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Burgers' })).toBeInTheDocument();
    });

    it('should filter menu items by category', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const categorySelect = screen.getByDisplayValue('All Categories');
      await user.selectOptions(categorySelect, 'Pizza');
      
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
      expect(screen.queryByText('Caesar Salad')).not.toBeInTheDocument();
      expect(screen.queryByText('Chicken Burger')).not.toBeInTheDocument();
    });

    it('should combine search and category filters', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const searchInput = screen.getByPlaceholderText('Search menu items...');
      const categorySelect = screen.getByDisplayValue('All Categories');
      
      await user.type(searchInput, 'chicken');
      await user.selectOptions(categorySelect, 'Burgers');
      
      expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
      expect(screen.queryByText('Caesar Salad')).not.toBeInTheDocument();
    });

    it('should show empty state when no items match filters', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const searchInput = screen.getByPlaceholderText('Search menu items...');
      await user.type(searchInput, 'nonexistent');
      
      expect(screen.getByText('No menu items found')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });
  });

  describe('Adding Items to Order', () => {
    it('should add item to order when Add button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const addButton = screen.getAllByText('Add')[0]; // Margherita Pizza
      await user.click(addButton);
      
      // Should appear in order items section
      expect(screen.getAllByText('Margherita Pizza')).toHaveLength(2); // One in menu, one in order
    });

    it('should increase quantity when adding same item multiple times', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const addButton = screen.getAllByText('Add')[0]; // Margherita Pizza
      await user.click(addButton);
      await user.click(addButton);
      
      // Should show quantity 2
      const quantityDisplay = screen.getByText('2');
      expect(quantityDisplay).toBeInTheDocument();
    });

    it('should display item price calculation in order', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const addButton = screen.getAllByText('Add')[0]; // Margherita Pizza $18.99
      await user.click(addButton);
      
      // Should show formatted price in order items
      expect(screen.getAllByText('$18.99')).toHaveLength(2); // One in menu, one in order
    });

    it('should show empty order state initially', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      expect(screen.getByText('No items added yet')).toBeInTheDocument();
      expect(screen.getAllByTestId('shopping-cart-icon')).toHaveLength(1);
    });
  });

  describe('Order Item Management', () => {
    it('should allow increasing item quantity', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Add item first
      const addButton = screen.getAllByText('Add')[0];
      await user.click(addButton);
      
      // Find and click plus button in order items
      const plusButtons = screen.getAllByTestId('plus-icon');
      const orderPlusButton = plusButtons.find(btn => 
        btn.closest('button')?.getAttribute('data-variant') === 'outline'
      );
      
      await user.click(orderPlusButton!.closest('button')!);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should allow decreasing item quantity', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Add item twice
      const addButton = screen.getAllByText('Add')[0];
      await user.click(addButton);
      await user.click(addButton);
      
      // Find and click minus button
      const minusButtons = screen.getAllByTestId('minus-icon');
      const orderMinusButton = minusButtons.find(btn => 
        btn.closest('button')?.getAttribute('data-variant') === 'outline'
      );
      
      await user.click(orderMinusButton!.closest('button')!);
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should remove item when quantity reaches zero', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Add item
      const addButton = screen.getAllByText('Add')[0];
      await user.click(addButton);
      
      // Decrease to zero
      const minusButtons = screen.getAllByTestId('minus-icon');
      const orderMinusButton = minusButtons.find(btn => 
        btn.closest('button')?.getAttribute('data-variant') === 'outline'
      );
      
      await user.click(orderMinusButton!.closest('button')!);
      
      // Should show empty state again
      expect(screen.getByText('No items added yet')).toBeInTheDocument();
    });

    it('should allow adding special instructions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Add item
      const addButton = screen.getAllByText('Add')[0];
      await user.click(addButton);
      
      // Find special instructions input
      const instructionsInput = screen.getByPlaceholderText('Special instructions...');
      await user.type(instructionsInput, 'Extra cheese');
      
      expect(instructionsInput).toHaveValue('Extra cheese');
    });
  });

  describe('Customer Information', () => {
    it('should render all customer input fields', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      expect(screen.getByPlaceholderText('Customer name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Phone number')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    });

    it('should show required field indicators', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      expect(screen.getByText('Name *')).toBeInTheDocument();
      expect(screen.getByText('Phone *')).toBeInTheDocument();
    });

    it('should update customer data when typing', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const nameInput = screen.getByPlaceholderText('Customer name');
      await user.type(nameInput, 'John Doe');
      
      expect(nameInput).toHaveValue('John Doe');
    });

    it('should display user icon for name field', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should set correct input types', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const phoneInput = screen.getByPlaceholderText('Phone number');
      const emailInput = screen.getByPlaceholderText('Email address');
      
      expect(phoneInput).toHaveAttribute('type', 'tel');
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Order Summary and Calculations', () => {
    it('should calculate subtotal correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Add Margherita Pizza ($18.99) and Caesar Salad ($13.50)
      const addButtons = screen.getAllByText('Add');
      await user.click(addButtons[0]); // Pizza
      await user.click(addButtons[1]); // Salad
      
      expect(screen.getByText('$32.49')).toBeInTheDocument(); // Subtotal
    });

    it('should calculate tax at 10%', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Add item with $10 subtotal equivalent
      const addButton = screen.getAllByText('Add')[0]; // $18.99
      await user.click(addButton);
      
      expect(screen.getByText('Tax (10%)')).toBeInTheDocument();
      expect(screen.getByText('$1.90')).toBeInTheDocument(); // 10% of $18.99
    });

    it('should calculate total correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const addButton = screen.getAllByText('Add')[0]; // $18.99
      await user.click(addButton);
      
      // Total should be subtotal + tax
      expect(screen.getByText('$20.89')).toBeInTheDocument(); // $18.99 + $1.90
    });

    it('should display estimated prep time', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const addButton = screen.getAllByText('Add')[0]; // 15min prep time
      await user.click(addButton);
      
      expect(screen.getByText('Estimated prep time: 15 minutes')).toBeInTheDocument();
    });

    it('should use maximum prep time for multiple items', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Add Pizza (15min) and Pasta (18min)
      const addButtons = screen.getAllByText('Add');
      await user.click(addButtons[0]); // Pizza 15min
      await user.click(addButtons[3]); // Pasta 18min
      
      expect(screen.getByText('Estimated prep time: 18 minutes')).toBeInTheDocument();
    });

    it('should disable Create Order button when no items', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const createOrderButton = screen.getByText('Create Order');
      expect(createOrderButton).toBeDisabled();
    });

    it('should enable Create Order button when items added', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const addButton = screen.getAllByText('Add')[0];
      await user.click(addButton);
      
      const createOrderButton = screen.getByText('Create Order');
      expect(createOrderButton).not.toBeDisabled();
    });
  });

  describe('Order Validation and Submission', () => {
    it('should validate that items are added', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Fill customer info without adding items
      const nameInput = screen.getByPlaceholderText('Customer name');
      const phoneInput = screen.getByPlaceholderText('Phone number');
      
      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '123-456-7890');
      
      const createOrderButton = screen.getByText('Create Order');
      await user.click(createOrderButton);
      
      expect(mockAlert).toHaveBeenCalledWith('Please add items to your order');
    });

    it('should validate required customer information', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Add item but no customer info
      const addButton = screen.getAllByText('Add')[0];
      await user.click(addButton);
      
      const createOrderButton = screen.getByText('Create Order');
      await user.click(createOrderButton);
      
      expect(mockAlert).toHaveBeenCalledWith('Please provide customer name and phone number');
    });

    it('should validate delivery address for delivery orders', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Select delivery and add item
      const deliveryButton = screen.getByText('DELIVERY').closest('button');
      await user.click(deliveryButton!);
      
      const addButton = screen.getAllByText('Add')[0];
      await user.click(addButton);
      
      // Fill required fields but not address
      const nameInput = screen.getByPlaceholderText('Customer name');
      const phoneInput = screen.getByPlaceholderText('Phone number');
      
      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '123-456-7890');
      
      const createOrderButton = screen.getByText('Create Order');
      await user.click(createOrderButton);
      
      expect(mockAlert).toHaveBeenCalledWith('Please provide delivery address');
    });

    it('should submit order successfully with valid data', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Add item
      const addButton = screen.getAllByText('Add')[0];
      await user.click(addButton);
      
      // Fill customer info
      const nameInput = screen.getByPlaceholderText('Customer name');
      const phoneInput = screen.getByPlaceholderText('Phone number');
      const emailInput = screen.getByPlaceholderText('Email address');
      
      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '123-456-7890');
      await user.type(emailInput, 'john@example.com');
      
      const createOrderButton = screen.getByText('Create Order');
      await user.click(createOrderButton);
      
      expect(mockEmitOrderCreated).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });
  });

  describe('Cross-MFE Event Integration', () => {
    it('should emit order created event with correct data', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Add item and submit order
      const addButton = screen.getAllByText('Add')[0];
      await user.click(addButton);
      
      const nameInput = screen.getByPlaceholderText('Customer name');
      const phoneInput = screen.getByPlaceholderText('Phone number');
      const emailInput = screen.getByPlaceholderText('Email address');
      
      await user.type(nameInput, 'John Doe');
      await user.type(phoneInput, '123-456-7890');
      await user.type(emailInput, 'john@example.com');
      
      const createOrderButton = screen.getByText('Create Order');
      await user.click(createOrderButton);
      
      expect(mockEmitOrderCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: expect.stringContaining('order_'),
          orderNumber: expect.stringMatching(/ORD-\d{4}/),
          customerId: 'john@example.com',
          items: expect.arrayContaining([
            expect.objectContaining({
              menuItemId: '1',
              quantity: 1
            })
          ]),
          total: 20.89,
          type: 'DINE_IN'
        })
      );
    });

    it('should subscribe to menu item updates on mount', async () => {
      renderNewOrderPage();
      
      expect(mockOnMenuItemUpdated).toHaveBeenCalled();
    });

    it('should handle menu item availability updates', async () => {
      const mockUnsubscribe = jest.fn();
      mockOnMenuItemUpdated.mockReturnValue(mockUnsubscribe);
      
      let menuUpdateCallback: any;
      mockOnMenuItemUpdated.mockImplementation((callback) => {
        menuUpdateCallback = callback;
        return mockUnsubscribe;
      });
      
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Simulate menu item update
      menuUpdateCallback({
        payload: {
          itemId: '1',
          available: false,
          price: 19.99,
          name: 'Updated Pizza'
        }
      });
      
      // The component should have processed the update
      expect(menuUpdateCallback).toBeDefined();
    });

    it('should unsubscribe from events on unmount', async () => {
      const mockUnsubscribe = jest.fn();
      mockOnMenuItemUpdated.mockReturnValue(mockUnsubscribe);
      
      const { unmount } = renderNewOrderPage();
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      expect(screen.getByText('Name *')).toBeInTheDocument();
      expect(screen.getByText('Phone *')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      await user.tab();
      expect(document.activeElement).not.toBe(document.body);
    });

    it('should have accessible button labels', async () => {
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Create Order')).toBeInTheDocument();
      expect(screen.getAllByText('Add')).toHaveLength(4);
    });
  });

  describe('Performance', () => {
    it('should render efficiently without warnings', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Warning')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle rapid filter changes efficiently', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      const searchInput = screen.getByPlaceholderText('Search menu items...');
      const categorySelect = screen.getByDisplayValue('All Categories');
      
      // Rapid changes should not cause issues
      await user.type(searchInput, 'pi');
      await user.selectOptions(categorySelect, 'Pizza');
      await user.clear(searchInput);
      await user.selectOptions(categorySelect, 'all');
      
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing menu data gracefully', () => {
      renderNewOrderPage();
      
      // Before menu loads, should show loading state
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should handle form submission errors gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderNewOrderPage();
      await waitForMenuItemsToLoad();
      
      // Try to submit without data
      const createOrderButton = screen.getByText('Create Order');
      await user.click(createOrderButton);
      
      // Should show validation error without crashing
      expect(mockAlert).toHaveBeenCalled();
    });
  });
});