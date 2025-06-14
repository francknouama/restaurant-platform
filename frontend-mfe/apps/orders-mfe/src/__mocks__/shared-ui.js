// Mock for @restaurant/shared-ui
export const Card = ({ children }) => <div data-testid="card">{children}</div>;
export const Button = ({ children, variant, size, className, disabled, onClick, ...props }) => (
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
);
export const Input = ({ label, placeholder, value, onChange, icon, type, size, ...props }) => (
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
);
export const StatusBadge = ({ status, color, size, children }) => (
  <span data-testid="status-badge" data-status={status} data-color={color} data-size={size}>
    {children || status}
  </span>
);
export const ErrorBoundary = ({ children, mfeName }) => (
  <div data-testid="error-boundary" data-mfe-name={mfeName}>
    {children}
  </div>
);