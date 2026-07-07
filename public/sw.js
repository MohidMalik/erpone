// sw.js - Service Worker for ERPOne Progressive Web App
const CACHE_NAME = 'erpone-v1';

// We do not strictly need to cache all dynamic API payloads, just fallback to network for non-static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle standard API or Firestore requests directly through the network
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // Cache hit
      }
      return fetch(event.request).then((networkResponse) => {
        // Don't cache invalid or non-GET responses
        if (!networkResponse || networkResponse.status !== 200 || event.request.method !== 'GET') {
          return networkResponse;
        }
        
        // Cache static app assets dynamically to support offline loading
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Offline fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
