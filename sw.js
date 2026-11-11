/* Офлайн-кэш: после первого открытия по http(s) игра работает без интернета.
   Меняете файлы игры? Увеличьте номер версии в CACHE, чтобы телефоны обновились. */
var CACHE = 'oge-calc-v19';
var ASSETS = [
  './', 'index.html', 'styles.css', 'logic.js', 'logic2.js', 'logic3.js', 'logic4.js', 'logic5.js', 'logic6.js', 'logic7.js', 'logic8.js', 'logic9.js', 'logic10.js', 'logic11.js', 'app.js', 'modes.js', 'modes2.js', 'modes3.js', 'modes4.js', 'modes5.js', 'modes6.js', 'modes7.js', 'modes8.js', 'modes9.js', 'feedback.js', 'sound.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

/* Сначала из сети (чтобы после обновления файлов не смешались старые и новые),
   без интернета из кэша */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (cached) { return cached || caches.match('index.html'); });
    })
  );
});
