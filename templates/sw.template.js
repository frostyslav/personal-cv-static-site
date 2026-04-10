// Service Worker — offline caching for static resume site
// Generated at build time by scripts/fingerprint.js
const CACHE_NAME = '{{CACHE_NAME}}';
const ASSETS = [
  '/',
  '/index.html',
  '{{CSS_BUNDLE}}',
  '{{JS_BUNDLE}}',
  '/vendor/fontawesome/css/all.min.css',
  '/favicon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Network-first for navigation, cache-first for assets
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(
            () =>
              new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' },
              })
          );
      })
    );
  }
});
