const mockReact = require('react');

// Mock shared UI components for Reservations MFE testing
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

const Calendar = ({ value, onChange, onDateClick, events, className, ...props }) => {
  return mockReact.createElement('div', {
    className: `calendar ${className || ''}`,
    'data-testid': 'calendar',
    ...props
  }, [
    mockReact.createElement('div', { key: 'header', className: 'calendar-header' }, 'Calendar Header'),
    mockReact.createElement('div', { key: 'grid', className: 'calendar-grid' }, 
      'Calendar Grid with events: ' + (events?.length || 0)
    ),
    mockReact.createElement('button', { 
      key: 'date-button', 
      onClick: () => onDateClick?.(new Date()),
      'data-testid': 'calendar-date-button'
    }, 'Select Date')
  ]);
};

const DatePicker = ({ value, onChange, placeholder, className, ...props }) => {
  return mockReact.createElement('input', {
    type: 'date',
    value: value ? value.toISOString().split('T')[0] : '',
    onChange: (e) => onChange?.(new Date(e.target.value)),
    placeholder,
    className: `date-picker ${className || ''}`,
    'data-testid': 'date-picker',
    ...props
  });
};

const TimePicker = ({ value, onChange, placeholder, className, ...props }) => {
  return mockReact.createElement('input', {
    type: 'time',
    value: value || '',
    onChange: (e) => onChange?.(e.target.value),
    placeholder,
    className: `time-picker ${className || ''}`,
    'data-testid': 'time-picker',
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

const Form = ({ children, onSubmit, className, ...props }) => {
  return mockReact.createElement('form', {
    onSubmit,
    className: `form ${className || ''}`,
    'data-testid': 'form',
    ...props
  }, children);
};

const FormField = ({ children, label, error, className, ...props }) => {
  return mockReact.createElement('div', {
    className: `form-field ${className || ''}`,
    'data-testid': 'form-field',
    ...props
  }, [
    label && mockReact.createElement('label', { key: 'label', className: 'form-label' }, label),
    mockReact.createElement('div', { key: 'input', className: 'form-input' }, children),
    error && mockReact.createElement('div', { key: 'error', className: 'form-error' }, error)
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

const ErrorBoundary = ({ children, fallback, mfeName }) => {
  // Simple mock that just renders children
  try {
    return children;
  } catch (error) {
    return fallback || mockReact.createElement('div', { 
      'data-testid': 'error-boundary' 
    }, `${mfeName || 'MFE'} Error: Something went wrong`);
  }
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

module.exports = {
  Button,
  Card,
  Input,
  Select,
  Table,
  Modal,
  Calendar,
  DatePicker,
  TimePicker,
  Badge,
  Form,
  FormField,
  Toast,
  Spinner,
  Tabs,
  Tab,
  ErrorBoundary,
  Pagination
};