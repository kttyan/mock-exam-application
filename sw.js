const CACHE_NAME = 'exam-app-v1';
const urlsToCache = [
  './index.html',
  // ここに使用しているCSSやJSのパスを記述します
  // 科目のHTMLファイルを追加するたびに、ここへ追記する必要があります
  './data_game_seisaku.js',
  './contents_industry.js',
  './linux_introduction.js',
  './web-app-dev-3.js',
  './editing_engineering.js',

  './app.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        return response || fetch(event.request);
      })
  );
});