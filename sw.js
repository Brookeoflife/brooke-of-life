
const CACHE_NAME = "brooke-of-life-v5";

/* ================= STATIC ASSETS ================= */

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/firebase.js",
  "/manifest.json",
  "/logo.png"
];

/* ================= INSTALL ================= */

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn("Cache failed for some assets:", err);
      });
    })
  );

  self.skipWaiting();
});

/* ================= ACTIVATE ================= */

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

/* ================= FETCH STRATEGY ================= */

self.addEventListener("fetch", event => {
  const req = event.request;

  // Always bypass Firebase requests (critical fix)
  if (
    req.url.includes("firestore.googleapis.com") ||
    req.url.includes("firebaseauth.googleapis.com") ||
    req.url.includes("identitytoolkit.googleapis.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then(res => {
        // cache only GET requests
        if (req.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return res;
      })
      .catch(() => {
        return caches.match(req).then(cached => {
          return cached || caches.match("/index.html");
        });
      })
  );
});
