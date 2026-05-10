const CACHE_NAME = "arithmetic-pwa-v14";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./stamps/stamps.js",
  "./stamps/1.png",
  "./stamps/10.png",
  "./stamps/30.png",
  "./stamps/50.png",
  "./stamps/100.png",
  "./stamps/150.png",
  "./stamps/200.png",
  "./stamps/250.png",
  "./stamps/300.png",
  "./stamps/350.png",
  "./stamps/400.png",
  "./stamps/450.png",
  "./stamps/500.png",
  "./stamps/600.png",
  "./stamps/700.png",
  "./stamps/800.png",
  "./stamps/900.png",
  "./stamps/1000.png",
  "./stamps/1250.png",
  "./stamps/1500.png",
  "./stamps/1750.png",
  "./stamps/2000.png",
  "./stamps/2500.png",
  "./stamps/3000.png",
  "./stamps/3500.png",
  "./stamps/4000.png",
  "./stamps/5000.png",
  "./stamps/6000.png",
  "./stamps/8000.png",
  "./stamps/10000.png"
];

const NETWORK_FIRST_PATHS = new Set([
  "/",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "stamps/stamps.js"
]);

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(
        ASSETS.map(async asset => {
          const request = new Request(asset, { cache: "reload" });
          const response = await fetch(request);
          await cache.put(asset, response);
        })
      );
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("arithmetic-pwa-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  // Google Apps Scriptのランキング取得など、外部通信はキャッシュしない。
  if (requestUrl.origin !== self.location.origin) return;

  const path = requestUrl.pathname.replace(self.location.pathname.replace(/service-worker\.js$/, ""), "").replace(/^\//, "");

  if (event.request.mode === "navigate" || NETWORK_FIRST_PATHS.has(path) || NETWORK_FIRST_PATHS.has(requestUrl.pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      return cache.match("./index.html");
    }

    throw new Error("Network request failed and no cache is available.");
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}
