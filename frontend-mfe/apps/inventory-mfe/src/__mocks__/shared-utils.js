// Mock shared utilities for Inventory MFE testing

// Mock date and time utilities
const formatDate = jest.fn((date, format = 'short') => {
  const mockDate = new Date(date);
  switch (format) {
    case 'short': return mockDate.toLocaleDateString();
    case 'long': return mockDate.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    case 'time': return mockDate.toLocaleTimeString();
    case 'datetime': return `${mockDate.toLocaleDateString()} ${mockDate.toLocaleTimeString()}`;
    default: return mockDate.toLocaleDateString();
  }
});

const formatCurrency = jest.fn((amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
});

const formatNumber = jest.fn((number, options = {}) => {
  return new Intl.NumberFormat('en-US', options).format(number);
});

// Mock validation utilities
const validateEmail = jest.fn((email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
});

const validatePhone = jest.fn((phone) => {
  const phoneRegex = /^\(?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
});

const validateRequired = jest.fn((value) => {
  return value !== null && value !== undefined && value !== '';
});

// Mock inventory-specific utilities
const calculateStockValue = jest.fn((items) => {
  return items.reduce((total, item) => {
    return total + (item.currentStock * item.costPerUnit);
  }, 0);
});

const getStockStatus = jest.fn((currentStock, minimumStock, maximumStock) => {
  if (currentStock === 0) return 'out_of_stock';
  if (currentStock <= minimumStock) return 'low_stock';
  if (currentStock >= maximumStock) return 'overstocked';
  return 'normal';
});

const calculateReorderPoint = jest.fn((dailyUsage, leadTimeDays, safetyStock = 0) => {
  return Math.ceil((dailyUsage * leadTimeDays) + safetyStock);
});

const formatStockUnit = jest.fn((quantity, unit) => {
  return `${quantity} ${unit}${quantity !== 1 ? 's' : ''}`;
});

// Mock search and filter utilities
const searchItems = jest.fn((items, searchTerm) => {
  if (!searchTerm) return items;
  const term = searchTerm.toLowerCase();
  return items.filter(item => 
    item.name.toLowerCase().includes(term) ||
    item.category.toLowerCase().includes(term) ||
    item.batchNumber?.toLowerCase().includes(term)
  );
});

const filterByCategory = jest.fn((items, category) => {
  if (!category || category === 'all') return items;
  return items.filter(item => item.category === category);
});

const filterByStockStatus = jest.fn((items, status) => {
  if (!status || status === 'all') return items;
  return items.filter(item => {
    const stockStatus = getStockStatus(item.currentStock, item.minimumStock, item.maximumStock);
    return stockStatus === status;
  });
});

const sortItems = jest.fn((items, sortBy, sortOrder = 'asc') => {
  return [...items].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'desc') {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });
});

// Mock analytics utilities
const calculateTurnoverRate = jest.fn((totalSold, averageInventory, timeInDays) => {
  if (averageInventory === 0) return 0;
  return (totalSold / averageInventory) * (365 / timeInDays);
});

const calculateDaysInStock = jest.fn((currentStock, dailyUsage) => {
  if (dailyUsage === 0) return Infinity;
  return Math.floor(currentStock / dailyUsage);
});

const generateInventoryReport = jest.fn((items, period = 'month') => {
  return {
    totalItems: items.length,
    totalValue: calculateStockValue(items),
    lowStockCount: items.filter(item => getStockStatus(item.currentStock, item.minimumStock, item.maximumStock) === 'low_stock').length,
    outOfStockCount: items.filter(item => item.currentStock === 0).length,
    categories: [...new Set(items.map(item => item.category))],
    period: period,
    generatedAt: new Date().toISOString()
  };
});

// Mock API utilities
const handleApiError = jest.fn((error) => {
  console.error('[Mock] API Error:', error);
  return {
    message: error.message || 'An unexpected error occurred',
    status: error.status || 500,
    timestamp: new Date().toISOString()
  };
});

const buildApiUrl = jest.fn((endpoint, params = {}) => {
  const url = new URL(endpoint, 'https://api.restaurant.com');
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
});

// Mock export utilities
const exportToCSV = jest.fn((data, filename) => {
  console.log(`[Mock] Exporting ${data.length} rows to CSV: ${filename}`);
  return Promise.resolve({ success: true, filename });
});

const exportToPDF = jest.fn((data, title, filename) => {
  console.log(`[Mock] Exporting to PDF: ${title} -> ${filename}`);
  return Promise.resolve({ success: true, filename });
});

// Mock notification utilities
const showSuccessToast = jest.fn((message) => {
  console.log('[Mock] Success toast:', message);
});

const showErrorToast = jest.fn((message) => {
  console.log('[Mock] Error toast:', message);
});

const showWarningToast = jest.fn((message) => {
  console.log('[Mock] Warning toast:', message);
});

const showInfoToast = jest.fn((message) => {
  console.log('[Mock] Info toast:', message);
});

// Mock local storage utilities
const saveToLocalStorage = jest.fn((key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
});

const loadFromLocalStorage = jest.fn((key, defaultValue = null) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
});

const removeFromLocalStorage = jest.fn((key) => {
  localStorage.removeItem(key);
});

module.exports = {
  // Date and formatting
  formatDate,
  formatCurrency,
  formatNumber,
  
  // Validation
  validateEmail,
  validatePhone,
  validateRequired,
  
  // Inventory specific
  calculateStockValue,
  getStockStatus,
  calculateReorderPoint,
  formatStockUnit,
  
  // Search and filter
  searchItems,
  filterByCategory,
  filterByStockStatus,
  sortItems,
  
  // Analytics
  calculateTurnoverRate,
  calculateDaysInStock,
  generateInventoryReport,
  
  // API utilities
  handleApiError,
  buildApiUrl,
  
  // Export utilities
  exportToCSV,
  exportToPDF,
  
  // Notifications
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  
  // Local storage
  saveToLocalStorage,
  loadFromLocalStorage,
  removeFromLocalStorage
};