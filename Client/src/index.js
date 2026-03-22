import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

window.process = { env: { NODE_ENV: 'development' }, browser: true };

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);