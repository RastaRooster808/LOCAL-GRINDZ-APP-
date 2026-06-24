const CACHE_NAME = 'local-grindz-v3';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'vendor.html',
  'styles/main.css',
  'styles/vendor.css',
  'scripts/app.js',
  'scripts/vendor.js',
  'manifest.json',
  'data/vendors.json',
  'data/menu.json',
  'data/locations.json',
  'data/updates.json',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});