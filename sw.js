/**
 * Service Worker for Asset Caching
 * Caches static assets for offline support and faster loading
 */

/**
 * IMPORTANT: Update CACHE_VERSION on each deployment to invalidate old caches
 */
const CACHE_VERSION = '1.0.0'; // Update this on each deploy!
const CACHE_NAME = `strategyhub-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/dashboard/assets/css/main.css',
  '/dashboard/assets/js/config.js',
  '/dashboard/assets/js/api.js',
  '/dashboard/assets/js/auth.js',
  '/dashboard/assets/js/toast.js',
  '/dashboard/assets/js/protected-route.js',
  '/dashboard/assets/js/utils.js',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // If some assets fail to cache, continue anyway
        console.warn('Some assets failed to cache:', err);
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Cache static assets (CSS, JS, images)
  if (
    url.pathname.startsWith('/dashboard/assets/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version, but also fetch in background to update cache
          fetch(event.request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response.clone());
              });
            }
          }).catch(() => {
            // Ignore network errors when updating cache
          });
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request).then((response) => {
          // Don't cache non-OK responses
          if (!response.ok) {
            return response;
          }
          
          // Clone the response for caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
    );
  }
  
  // For API requests, always go to network (don't cache)
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // For HTML pages, try network first, fallback to cache
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful HTML responses
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // No cache, return offline page or error
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' },
            });
          });
        })
    );
  }
});

