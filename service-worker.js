self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('pacman-pwa-v1').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './styles.css',
        './main.js',
        './manifest.json',
        // Se vuoi, aggiungi anche le icone PWA:
        // './icon-192.png',
        // './icon-512.png',
        'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.js'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => {
      return res || fetch(event.request);
    })
  );
});
