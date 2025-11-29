import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { processQueue } from './offline/offlineQueue';
import installFetchProxy from './offline/installFetchProxy';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Register service worker for offline support (if supported)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = '/sw.js';
    navigator.serviceWorker.register(swUrl).then(reg => {
      console.log('Service worker registered:', reg.scope);
      if (reg.waiting) {
        // optionally prompt user to refresh
        console.log('SW waiting');
      }
      reg.addEventListener && reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              console.log('New content available; please refresh.');
            }
          });
        }
      });
    }).catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

// Install fetch proxy to enqueue non-GET requests while offline.
try {
  // Only queue requests to our supabase base URL to avoid queuing unrelated requests.
  installFetchProxy({ queueOnlyFor: ['supabase.co'] });
} catch (e) {
  console.warn('Failed to install fetch proxy', e);
}

// Try to flush any queued requests when back online
window.addEventListener('online', () => {
  try { processQueue(); } catch (e) { console.warn('processQueue failed', e); }
});

// Attempt to process queue on load if online
if (navigator.onLine) {
  processQueue().catch(e => console.warn('processQueue init failed', e));
}
