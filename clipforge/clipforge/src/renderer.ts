/**
 * ClipForge - Renderer Process Entry Point
 * This file is required by the index.html file and will
 * be executed in the renderer process for that window.
 */

import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './renderer/App';

console.log('👋 ClipForge renderer process started');

// Mount React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
  console.log('✅ React app mounted');
} else {
  console.error('❌ Root element not found');
}
