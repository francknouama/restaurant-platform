import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import MenuApp from './MenuApp';

// Standalone mode - for development
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <MenuApp />
  </React.StrictMode>
);