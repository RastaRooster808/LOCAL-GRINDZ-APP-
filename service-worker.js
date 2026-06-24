const CACHE_NAME = 'local-grindz-v7';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'dashboard.html',
  'menu.html',
  'order.html',
  'loyalty.html',
  'vendor.html',
  'styles/main.css',
  'styles/dashboard.css',
  'styles/pages.css',
  'styles/vendor.css',
  'scripts/nav.js',
  'scripts/app.js',
  'scripts/dashboard.js',
  'scripts/menu.js',
  'scripts/order.js',
  'scripts/loyalty.js',
  'scripts/vendor.js',
  'manifest.json',
  'data/vendors.json',
  'data/menus.json',
  'data/locations.json',
  'data/updates.json',
  'data/specials.json',
  'data/loyalty.json',
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