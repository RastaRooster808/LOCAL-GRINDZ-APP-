// Local Grindz Service Worker — Phase 4 (React/Vite build)
const CACHE_VERSION = 'v4';
const CACHE_NAME = `local-grindz-${CACHE_VERSION}`;

// Shell assets — updated by the build process (hashes change each deploy)
// We use a network-first strategy for HTML and cache-first for static assets
const IMMUTABLE_EXTS = ['.js', '.css', '.woff2', '.woff', '.ttf', '.png', '.webp', '.jpg', '.svg'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and external API calls
  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co') || url.hostname.includes('nominatim.openstreetmap.org')) return;
  if (url.hostname.includes('unpkg.com')) return;

  const isImmutable = IMMUTABLE_EXTS.some(ext => url.pathname.endsWith(ext));

  if (isImmutable) {
    // Cache-first: hashed assets never change
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(res => {
            cache.put(request, res.clone());
            return res;
          });
        }),
      ),
    );
    return;
  }

  // Network-first for HTML / navigation
  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok && url.origin === self.location.origin) {
          caches.open(CACHE_NAME).then(cache => cache.put(request, res.clone()));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match('/index.html') || new Response('Offline', { status: 503 });
      }),
  );
});
