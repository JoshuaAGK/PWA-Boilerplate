const STATIC_CACHE_NAME = "pwa";
const OFFLINE_URL = "offline.html";

self.addEventListener("install", function(event) {
    event.waitUntil((
        async () => {
            const cache = await caches.open(STATIC_CACHE_NAME);
            await cache.add(
                new Request(
                    OFFLINE_URL, { cache: "reload" }
                )
            );
        })()
    );

    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

self.addEventListener("activate", function(event) {
    event.waitUntil((
        async () => {
            // Enable navigation preload if it's supported
            if ("navigationPreload" in self.registration) {
                await self.registration.navigationPreload.enable();
            }
        })()
    );

    // Tell the active service worker to take control of the page immediately
    self.clients.claim();
});

self.addEventListener("fetch", function(event) {
    // Check if navigating to new page
    if (event.request.mode == "navigate") {
        event.respondWith((
            async () => {
                try {
                    var preloadResponse = await event.preloadResponse;
                    if (preloadResponse != null) {
                        // Try to use cached page
                        return preloadResponse;
                    } else {
                        // Standard network request
                        var networkResponse = await fetch(event.request);
                        return networkResponse;
                    }                
                } catch (e) {
                    // Use offline.html
                    var cache = await caches.open(STATIC_CACHE_NAME);
                    var cachedResponse = await cache.match(OFFLINE_URL);
                    return cachedResponse;
                }
            })()
        );
    }
});