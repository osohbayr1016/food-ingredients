const CACHE = "food-ingredients-public-recipe-v2";

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith("food-ingredients-") && n !== CACHE)
      .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || req.headers.has("authorization")) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.search ||
      !/^\/recipe\/[^/]+\/?$/.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(req);
      if (response.ok && response.status === 200 && response.type === "basic") {
        await cache.put(req, response.clone());
      }
      return response;
    } catch {
      return (await cache.match(req)) ?? Response.error();
    }
  })());
});
