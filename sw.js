const CACHE_NAME = 'exam-app-v1';
const urlsToCache = [
  './index.html',
  // ここに使用しているCSSやJSのパスを記述します
  // 科目のHTMLファイルを追加するたびに、ここへ追記する必要があります
  './exam/data_game_seisaku.js',
  './exam/linux_introduction.js',
  './exam/web-app-dev-3.js',
  './exam/editing_engineering.js',
  './exam/anime_industry_history.js',
  './exam/machine_translation_info.js',
  './exam/web-app-dev-4.js',
  './exam/python_programming.js',
  './exam/gas_automation_efficiency.js',

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
