
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
            // Check if we received a valid response.
            // We allow caching of opaque responses (type 'opaque') which happens with no-cors requests,
            // and CORS responses (type 'cors') from CDNs like esm.sh.
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Cache the dynamic asset (JS modules, icons, etc.)
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch((err) => {
            // Network failure (Offline)
            // If it's a navigation request (page load), return index.html
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
            // Propagate error for other requests (e.g. API calls that can't be cached)
            throw err;
        });
      })
  );
});
