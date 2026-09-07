// BLOCK CHASE service worker — 네트워크 우선, 실패 시 캐시(오프라인 폴백)
// 주의: 캐시 우선으로 바꾸면 TWA 사용자가 옛 버전을 계속 보게 됨. 네트워크 우선 유지.
const CACHE = "bc-v1";
const CORE = ["./", "./index.html", "./manifest.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {}); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
});
