// Service Worker — Mantenimiento Royalty PWA
// ROHEM © 2025

const CACHE_NAME = 'royalty-mant-v1';
const ASSETS = [
  '/royalty-mant/',
  '/royalty-mant/index.html',
  '/royalty-mant/panel_administrador.html',
  '/royalty-mant/manifest.json',
  '/royalty-mant/icon-192.png',
  '/royalty-mant/icon-512.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instalación — guarda assets en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Cache parcial:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación — limpia cachés viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — Network first, caché como respaldo
self.addEventListener('fetch', event => {
  // Firebase y APIs externas: siempre red
  if (
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('firebase') ||
    event.request.url.includes('graph.facebook.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guarda copia fresca en caché
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red — usa caché
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback a index.html para rutas internas
          if (event.request.mode === 'navigate') {
            return caches.match('/royalty-mant/index.html');
          }
        });
      })
  );
});
