/**
 * Deprecated service worker — clears legacy caches and stops intercepting requests.
 * Asset caching is handled via ?v= query params in _config.yml (asset_version).
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});
