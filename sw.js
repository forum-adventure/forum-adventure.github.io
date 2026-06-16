const CACHE_NAME = 'forum-filter-v1';
// Liệt kê các tài nguyên cốt lõi cần lưu cache để chạy offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  './icon-512.png',
  // Nếu bạn có file CSS/JS riêng biệt (ví dụ: style.css, script.js), hãy thêm đường dẫn vào đây:
  // './style.css',
  // './script.js'
];

// 1. Sự kiện Cài đặt (Install) - Lưu các tài nguyên vào Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      // Ép Service Worker mới kích hoạt ngay lập tức mà không chờ đợi
      return self.skipWaiting();
    })
  );
});

// 2. Sự kiện Kích hoạt (Activate) - Dọn dẹp cache cũ khi bạn cập nhật phiên bản (v2, v3...)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Giúp Service Worker kiểm soát các trang hiện tại ngay lập tức
      return self.clients.claim();
    })
  );
});

// 3. Sự kiện Bắt yêu cầu mạng (Fetch) - Chiến lược Stale-While-Revalidate
// Ưu tiên lấy từ Cache để tải cực nhanh, song song đó tự động cập nhật ngầm dữ liệu mới từ mạng
self.addEventListener('fetch', (event) => {
  // Chỉ xử lý các yêu cầu GET thông thường
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Tạo một fetch request để cập nhật cache ngầm
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          // Lưu bản sao phản hồi mới vào cache nếu hợp lệ
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Trả về khi mất mạng (đã có cachedResponse lo)
          console.log('[Service Worker] Fetch failed, network is down.');
        });

        // Trả về kết quả từ cache ngay lập tức nếu có, nếu không thì đợi từ mạng
        return cachedResponse || fetchedResponse;
      });
    })
  );
});


