const CACHE_NAME = 'belote-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png'
];

// Installation du Service Worker et mise en cache des assets de base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Stratégie de cache : Network First (Priorité au réseau, repli sur le cache si hors-ligne)
// Très important pour un jeu en ligne pour toujours avoir la version à jour
self.addEventListener('fetch', (event) => {
  // On ne met pas en cache les requêtes vers ton API PHP
  if (event.request.url.includes('/back/')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});