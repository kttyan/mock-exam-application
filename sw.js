// 模試アプリ用 Service Worker

const CACHE_NAME = 'exam-app-v2';

// アプリ本体としてキャッシュしてよいファイルだけを登録
// 問題JS（exam/*.js）は意図的にキャッシュしません。
// 問題を更新した際、GitHub Pagesから最新ファイルを取得できるようにするためです。
const urlsToCache = [
    './index.html',
    './app.js'
];


// Service Worker インストール
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                // 新しいService Workerをすぐに有効化
                return self.skipWaiting();
            })
    );
});


// 古いキャッシュを削除
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys()
            .then(function(cacheNames) {
                return Promise.all(
                    cacheNames
                        .filter(function(cacheName) {
                            return cacheName !== CACHE_NAME;
                        })
                        .map(function(cacheName) {
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(function() {
                // 現在開いているページにも新しいService Workerを適用
                return self.clients.claim();
            })
    );
});


// ファイル取得
self.addEventListener('fetch', function(event) {

    // examディレクトリ内の問題JSはキャッシュしない
    // 常にネットワークから最新版を取得する
    const url = new URL(event.request.url);

    if (url.pathname.includes('/exam/')) {
        event.respondWith(
            fetch(event.request)
        );
        return;
    }

    // その他のアプリ本体ファイルは、
    // キャッシュ → なければネットワーク
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                return response || fetch(event.request);
            })
    );
});
