import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import OrdersApp from './OrdersApp';

// Mount function for standalone development
const mount = (element: HTMLElement) => {
  const root = createRoot(element);
  root.render(
    <React.StrictMode>
      <BrowserRouter basename="/orders">
        <OrdersApp />
      </BrowserRouter>
    </React.StrictMode>
  );
  return root;
};

// Mount to root if running standalone
if (process.env.NODE_ENV === 'development') {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    mount(rootElement);
  }
}

// Export for Module Federation
export { mount };
export default OrdersApp;