self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open("cache").then((cache) => {
      return cache.match(event.request).then((response) => {
        console.log("cache request: " + event.request.url);
        const fetchPromise = fetch(event.request).then(
          (networkResponse) => {
            console.log(
              "fetch completed: " + event.request.url,
              networkResponse,
            );
            if (networkResponse) {
              console.debug(
                "updated cached page: " + event.request.url,
                networkResponse,
              );
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          },
          (event) => {
            console.log("Error in fetch()", event);
            event.waitUntil(
              caches.open("cache").then((cache) => {
                return cache.addAll([
                  "./index.html",
                  "./css/style.css",
                  "./public/*",
                  "./manifest.json",
                  "https://platform.twitter.com/widgets.js",
                ]);
              }),
            );
          },
        );
        return response || fetchPromise;
      });
    }),
  );
});
self.addEventListener("install", () => {
  self.skipWaiting();
  console.log("Latest version installed!");
});
