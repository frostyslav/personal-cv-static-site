// Service Worker — offline caching for static resume site
// Generated at build time by scripts/fingerprint.js
const CACHE_NAME = '{{CACHE_NAME}}';

// Fingerprinted assets are immutable — safe to cache forever
const IMMUTABLE_ASSETS = ['{{CSS_BUNDLE}}', '{{JS_BUNDLE}}'];

// Non-fingerprinted assets use stale-while-revalidate
const MUTABLE_ASSETS = [
  '/',
  '/vendor/fontawesome/css/all.min.css',
  '/favicon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll([...IMMUTABLE_ASSETS, ...MUTABLE_ASSETS]))
  );
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
  const url = new URL(event.request.url);

  // Network-first for navigation requests
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
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first for fingerprinted (immutable) assets
  const isImmutable = IMMUTABLE_ASSETS.some(a =>
    url.pathname.endsWith(a.replace(/^\//, ''))
  );
  if (isImmutable) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for mutable assets (fonts, favicon, etc.)
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      return cached || fetchPromise;
    })
  );
});
