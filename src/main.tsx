import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// In dev, a service worker left over from a previous production build keeps
// serving stale, broken precached chunks on localhost (cache-first) — which
// shows up as a blank white screen on certain routes and survives normal
// refreshes. Tear any worker + caches down so the dev server is the single
// source of truth, then do one guarded reload for a clean, uncached load.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    const hadSW = regs.length > 0;
    regs.forEach((r) => r.unregister());
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => { /* ignore */ });
    }
    if (hadSW && navigator.serviceWorker.controller && !sessionStorage.getItem('sw-dev-cleaned')) {
      sessionStorage.setItem('sw-dev-cleaned', '1');
      window.location.reload();
    }
  }).catch(() => { /* ignore */ });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
