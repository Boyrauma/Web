const CACHE_NAME = "dinhdung-admin-v1";

function getBasePath() {
  return new URL(self.registration.scope).pathname.replace(/\/?$/, "/");
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const basePath = getBasePath();
  const isSameOrigin = url.origin === self.location.origin;
  const isAdminAsset =
    isSameOrigin &&
    url.pathname.startsWith(basePath) &&
    (url.pathname.includes("/assets/") ||
      url.pathname.endsWith("manifest.webmanifest") ||
      url.pathname.endsWith("admin-pwa-icon.svg"));

  if (request.mode === "navigate" && isSameOrigin && url.pathname.startsWith(basePath)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(basePath, clonedResponse));
          return response;
        })
        .catch(() => caches.match(basePath))
    );
    return;
  }

  if (isAdminAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkResponse = fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        });

        return cachedResponse || networkResponse;
      })
    );
  }
});
