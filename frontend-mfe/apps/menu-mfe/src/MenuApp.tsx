import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@restaurant/shared-ui';
import MenuRoutes from './routes';

interface MenuAppProps {
  basePath?: string;
}

const MenuApp: React.FC<MenuAppProps> = ({ basePath = '/menu' }) => {
  return (
    <ErrorBoundary mfeName="Menu MFE">
      <div className="menu-mfe" data-testid="menu-mfe">
        {/* In standalone mode, use BrowserRouter */}
        {/* In shell mode, routing is handled by shell */}
        {typeof window !== 'undefined' && window.location.pathname.startsWith('/menu') ? (
          <BrowserRouter basename={basePath}>
            <MenuRoutes />
          </BrowserRouter>
        ) : (
          <MenuRoutes />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default MenuApp;