// ============================================================
// index.jsx — Bootstrap React
// ============================================================

import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker enregistré avec succès !', reg.scope))
      .catch((err) => console.log('Échec de l\'enregistrement du Service Worker :', err));
  });
}
