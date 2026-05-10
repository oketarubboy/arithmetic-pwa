const CACHE_NAME = "arithmetic-pwa-v11";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./stamps/stamps.js",
  "./stamps/stamp_01.png",
  "./stamps/stamp_03.png",
  "./stamps/stamp_05.png",
  "./stamps/stamp_10.png",
  "./stamps/stamp_20.png"
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
