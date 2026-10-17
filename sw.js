/* The production build injects a content hash and the complete asset list. */
const CACHE = "gideao-cc7ce2893582";
const BASE = new URL('./', self.location.href).pathname;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(["./","./assets/PROVENANCE.md","./assets/gideao-walk.png","./assets/gideao.png","./assets/index-DVEkkSGq.js","./assets/index-opewQOLt.css","./assets/limestone-wall.png","./assets/people-walk.png","./fonts/Cinzel-OFL.txt","./fonts/DMSans-OFL.txt","./fonts/cinzel.ttf","./fonts/dm-sans.ttf","./icon-192.png","./icon-512.png","./icon.svg","./index.html","./manifest.webmanifest"])));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => {
    // Preserve the preceding shell while any already-open page finishes using it.
    const old = keys.filter(key => key.startsWith('gideao-') && key !== CACHE);
    return Promise.all(old.slice(0, -1).map(key => caches.delete(key)));
  }).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    // Hashed resources used by a preceding open shell may live in the previous cache.
    const previous = await caches.match(event.request);
    if (previous && event.request.mode !== 'navigate') return previous;
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch {
      if (event.request.mode === 'navigate') return await cache.match(BASE+'index.html') || Response.error();
      return Response.error();
    }
  })());
});
