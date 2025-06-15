const mockReact = require('react');

// Mock shared UI components for Inventory MFE testing
const Button = ({ children, onClick, className, variant, size, ...props }) => {
  return mockReact.createElement('button', {
    onClick,
    className: `btn ${variant || 'primary'} ${size || 'medium'} ${className || ''}`,
    'data-testid': 'button',
    ...props
  }, children);
};

const Card = ({ children, className, ...props }) => {
  return mockReact.createElement('div', {
    className: `card ${className || ''}`,
    'data-testid': 'card',
    ...props
  }, children);
};

const Input = ({ onChange, value, placeholder, className, type, ...props }) => {
  return mockReact.createElement('input', {
    type: type || 'text',
    onChange,
    value,
    placeholder,
    className: `input ${className || ''}`,
    'data-testid': 'input',
    ...props
  });
};

const Select = ({ children, onChange, value, className, ...props }) => {
  return mockReact.createElement('select', {
    onChange,
    value,
    className: `select ${className || ''}`,
    'data-testid': 'select',
    ...props
  }, children);
};

const Table = ({ children, className, ...props }) => {
  return mockReact.createElement('table', {
    className: `table ${className || ''}`,
    'data-testid': 'table',
    ...props
  }, children);
};

const Modal = ({ children, isOpen, onClose, title, ...props }) => {
  if (!isOpen) return null;
  return mockReact.createElement('div', {
    className: 'modal',
    'data-testid': 'modal',
    ...props
  }, [
    mockReact.createElement('div', { key: 'backdrop', className: 'modal-backdrop', onClick: onClose }),
    mockReact.createElement('div', { key: 'content', className: 'modal-content' }, [
      title && mockReact.createElement('h2', { key: 'title', className: 'modal-title' }, title),
      mockReact.createElement('div', { key: 'body', className: 'modal-body' }, children),
      mockReact.createElement('button', { 
        key: 'close', 
        className: 'modal-close', 
        onClick: onClose,
        'data-testid': 'modal-close'
      }, '×')
    ])
  ]);
};

const Toast = ({ message, type, isVisible, onClose, ...props }) => {
  if (!isVisible) return null;
  return mockReact.createElement('div', {
    className: `toast toast-${type || 'info'}`,
    'data-testid': 'toast',
    ...props
  }, [
    mockReact.createElement('span', { key: 'message' }, message),
    mockReact.createElement('button', { 
      key: 'close', 
      onClick: onClose,
      'data-testid': 'toast-close'
    }, '×')
  ]);
};

const Spinner = ({ size, className, ...props }) => {
  return mockReact.createElement('div', {
    className: `spinner ${size || 'medium'} ${className || ''}`,
    'data-testid': 'spinner',
    ...props
  });
};

const Badge = ({ children, variant, className, ...props }) => {
  return mockReact.createElement('span', {
    className: `badge badge-${variant || 'default'} ${className || ''}`,
    'data-testid': 'badge',
    ...props
  }, children);
};

const Tabs = ({ children, activeTab, onTabChange, ...props }) => {
  return mockReact.createElement('div', {
    className: 'tabs',
    'data-testid': 'tabs',
    ...props
  }, children);
};

const Tab = ({ children, tabKey, label, ...props }) => {
  return mockReact.createElement('div', {
    className: 'tab',
    'data-testid': `tab-${tabKey}`,
    ...props
  }, children);
};

const Chart = ({ data, type, className, ...props }) => {
  return mockReact.createElement('div', {
    className: `chart chart-${type || 'line'} ${className || ''}`,
    'data-testid': 'chart',
    ...props
  }, `Chart: ${type || 'line'} with ${data?.length || 0} data points`);
};

const DataTable = ({ data, columns, onRowClick, className, ...props }) => {
  return mockReact.createElement('div', {
    className: `data-table ${className || ''}`,
    'data-testid': 'data-table',
    ...props
  }, [
    mockReact.createElement('div', { key: 'header', className: 'table-header' }, 
      columns?.map((col, i) => 
        mockReact.createElement('span', { key: i }, col.label || col.key)
      )
    ),
    mockReact.createElement('div', { key: 'body', className: 'table-body' }, 
      data?.map((row, i) => 
        mockReact.createElement('div', { 
          key: i, 
          className: 'table-row',
          onClick: () => onRowClick?.(row)
        }, `Row ${i + 1}`)
      )
    )
  ]);
};

const Pagination = ({ currentPage, totalPages, onPageChange, ...props }) => {
  return mockReact.createElement('div', {
    className: 'pagination',
    'data-testid': 'pagination',
    ...props
  }, [
    mockReact.createElement('button', { 
      key: 'prev', 
      onClick: () => onPageChange(currentPage - 1),
      disabled: currentPage <= 1
    }, 'Previous'),
    mockReact.createElement('span', { key: 'info' }, `Page ${currentPage} of ${totalPages}`),
    mockReact.createElement('button', { 
      key: 'next', 
      onClick: () => onPageChange(currentPage + 1),
      disabled: currentPage >= totalPages
    }, 'Next')
  ]);
};

const ErrorBoundary = ({ children, fallback }) => {
  // Simple mock that just renders children
  try {
    return children;
  } catch (error) {
    return fallback || mockReact.createElement('div', { 
      'data-testid': 'error-boundary' 
    }, 'Something went wrong');
  }
};

const LoadingSpinner = ({ size, text, ...props }) => {
  return mockReact.createElement('div', {
    className: `loading-spinner ${size || 'medium'}`,
    'data-testid': 'loading-spinner',
    ...props
  }, text || 'Loading...');
};

module.exports = {
  Button,
  Card,
  Input,
  Select,
  Table,
  Modal,
  Toast,
  Spinner,
  Badge,
  Tabs,
  Tab,
  Chart,
  DataTable,
  Pagination,
  ErrorBoundary,
  LoadingSpinner
};