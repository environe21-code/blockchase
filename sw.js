/* BLOCK CHASE service worker — v3 (network-first for HTML)
   교체 이유: index.html을 캐시 우선으로 제공하면 새 버전을 올려도 옛 버전이 계속 뜹니다.
   이 파일은 HTML은 항상 네트워크에서 먼저 받고(실패 시 캐시), 아이콘/매니페스트만 캐시를 씁니다. */
const VERSION = 'bc-v3';
const CACHE = 'blockchase-' + VERSION;
const ASSETS = ['manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html') ||
                 /\/(index\.html)?$/.test(new URL(req.url).pathname);

  if (isHTML) {
    // 항상 최신 index.html을 우선 사용, 오프라인일 때만 캐시 사용
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // 그 외 정적 파일: 캐시 우선 + 백그라운드 갱신
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
