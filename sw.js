// ==========================================
// SERVICE WORKER - Smart Cache Strategy
// Version: 2 (Stale-While-Revalidate)
// ==========================================

const CACHE_VERSION = 'pdf-tools-v2';

// Core app shell - cached on install (Cache-First)
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './icon.svg',
  './manifest.json'
];

// CDN libraries - cached on first use (Stale-While-Revalidate)
const CDN_HOSTS = [
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// Install: Pre-cache the app shell
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_VERSION)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch: Apply smart strategies per request type
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategy 1: App Shell → Cache-First, then update in background
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Strategy 2: CDN resources → Stale-While-Revalidate
  if (CDN_HOSTS.some(host => url.hostname.includes(host))) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Strategy 3: Everything else (e.g., Tesseract WASM data) → Network-First with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful GET responses
        if (response.ok && event.request.method === 'GET') {
          const cloned = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

/**
 * Stale-While-Revalidate:
 * 1. Serve from cache immediately (fast!)
 * 2. Fetch fresh copy from network in background
 * 3. Update cache with fresh copy for next time
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cachedResponse = await cache.match(request);

  // Fire-and-forget: update cache in background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse); // If network fails, fall back to cache

  // Return cached version instantly, or wait for network
  return cachedResponse || fetchPromise;
}
