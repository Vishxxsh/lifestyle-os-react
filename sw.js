
const CACHE_NAME = 'lifestyle-os-v4';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache Hit - return response
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch((err) => {
            // Network failure (Offline)
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
            throw err;
        });
      })
  );
});

// Handle Notification Clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Handle Action Buttons (Dismiss / Complete)
  if (event.action === 'dismiss') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        clientList.forEach(client => {
          client.postMessage({ type: 'DISMISS_ALARM' });
        });
      })
    );
  } else if (event.action === 'complete') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        const habitId = event.notification.data.habitId;
        clientList.forEach(client => {
          client.postMessage({ type: 'COMPLETE_HABIT', habitId: habitId });
        });
      })
    );
  } else {
    // Standard Click - Focus Window or Open
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // If a window is already open, focus it
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});
