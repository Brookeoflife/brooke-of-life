
const CACHE_NAME = "brooke-of-life-v3";

/* ================= STATIC FILES ================= */

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/firebase.js",
  "/manifest.json",
  "/logo.png",

  // Firebase SDKs
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js",

  // PDF libraries
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js"
];

/* ================= INSTALL ================= */

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* ================= ACTIVATE ================= */

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ================= FETCH ================= */

self.addEventListener("fetch", event => {
  const req = event.request;

  // Do NOT cache Firebase API calls
  if (
    req.url.includes("firestore.googleapis.com") ||
    req.url.includes("firebaseauth.googleapis.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      return (
        cached ||
        fetch(req)
          .then(res => {
            if (req.method === "GET") {
              const copy = res.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => caches.match("/index.html"))
      );
    })
  );
});
