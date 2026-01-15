
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (container) {
  // Limpeza de logs de desenvolvimento para o deploy
  if (window.location.hostname !== 'localhost') {
    console.log = () => {};
  }
  
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
