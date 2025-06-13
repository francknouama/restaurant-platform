import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { RestaurantEventProvider } from '@restaurant/shared-state';
import ReservationsApp from './ReservationsApp';
import './styles/index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <RestaurantEventProvider>
      <BrowserRouter>
        <ReservationsApp />
      </BrowserRouter>
    </RestaurantEventProvider>
  </React.StrictMode>
);

// Enable hot module replacement for development
if (module.hot) {
  module.hot.accept();
}