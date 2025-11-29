/* Service Worker for TermoPhysics - basic offline caching and runtime caching
   - caches navigation fallback to /offline.html
   - runtime caches GET responses (static assets, images, API GETs)
   - serves cached content when network unavailable
*/

const CACHE_NAME = 'termo-cache-v1';
const OFFLINE_URL = '/offline.html';
const MAX_RUNTIME_ENTRIES = 150;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache offline page
      return cache.addAll([OFFLINE_URL]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches if any
      const keys = await caches.keys();
      await Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
        return null;
      }));
      self.clients.claim();
    })()
  );
});

// Helper to trim cache size
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  if (requests.length > maxItems) {
    for (let i = 0; i < requests.length - maxItems; i++) {
      await cache.delete(requests[i]);
    }
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Always handle navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        // On successful navigation fetch, cache the response for offline (optional)
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      }).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req) || await cache.match(OFFLINE_URL);
        return cached || Response.error();
      })
    );
    return;
  }

  // For other GET requests, try network first then fallback to cache
  if (req.method === 'GET') {
    event.respondWith(
      fetch(req).then((res) => {
        // If we got a valid response, clone & put in runtime cache
        try {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(async (cache) => {
            // Only cache successful responses (status 200)
            if (resClone && resClone.ok) {
              await cache.put(req, resClone);
              trimCache(CACHE_NAME, MAX_RUNTIME_ENTRIES);
            }
          });
        } catch (e) {
          // ignore
        }
        return res;
      }).catch(async () => {
        // On network failure, try cache
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        // if it's an image, return a tiny fallback transparent image
        if (req.destination === 'image') {
          return new Response('', { status: 503, statusText: 'Offline' });
        }
        // else return offline page for HTML or JSON fallback
        const accept = req.headers.get('accept') || '';
        if (accept.includes('text/html')) {
          return cache.match(OFFLINE_URL);
        }
        return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
