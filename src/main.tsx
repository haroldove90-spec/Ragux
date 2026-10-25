import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA & offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('ROGUX PWA ServiceWorker registrado:', reg.scope))
      .catch((err) => console.warn('ROGUX PWA ServiceWorker error:', err));
  });
}

createRoot(document.getElementById('root')!).render(<App />);

