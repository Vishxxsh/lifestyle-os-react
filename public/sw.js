
const CACHE_NAME = 'lifestyle-os-v6-offline';

// Core assets to pre-cache
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
          // CRITICAL: Catch errors here so SW installs even if a file fails to load
          return cache.addAll(PRECACHE_URLS).catch(err => {
              console.warn('SW Precache warning (non-fatal):', err);
          });
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
          return networkResponse;
        }

        const url = new URL(event.request.url);
        const shouldCache = 
            url.origin === self.location.origin ||
            url.hostname.includes('esm.sh') ||
            url.hostname.includes('tailwindcss.com') ||
            url.hostname.includes('iconify.design');

        if (shouldCache) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch((err) => {
         // Fallback for Navigation (HTML)
         if (event.request.mode === 'navigate') {
             return caches.match('./index.html');
         }
      });
    })
  );
});

// Handle Notification Clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    if (event.action === 'dismiss') {
       clientList.forEach(client => {
          client.postMessage({ type: 'DISMISS_ALARM' });
       });
    } else if (event.action === 'complete') {
       const habitId = event.notification.data.habitId;
       clientList.forEach(client => {
          client.postMessage({ type: 'COMPLETE_HABIT', habitId: habitId });
       });
    } else {
       for (const client of clientList) {
         if (client.url && 'focus' in client) {
           return client.focus();
         }
       }
       if (clients.openWindow) {
         return clients.openWindow('/');
       }
    }
  });

  event.waitUntil(promiseChain);
});
