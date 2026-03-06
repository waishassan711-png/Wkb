const CACHE_NAME = 'kab-tracker-v3';
const ASSETS = [
  '/Kabw/',
  '/Kabw/index.html',
  '/Kabw/manifest.json',
  '/Kabw/icon-192.png',
  '/Kabw/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip Firebase requests — always go to network for data
  if (event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('googleapis.com/identitytoolkit') ||
      event.request.url.includes('firebase') ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache a copy of the response
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: return from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // If it's a navigation request, return index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/Kabw/index.html');
          }
        });
      })
  );
});
