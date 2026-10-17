/**
 * Service Worker — أَثَر | ATHAR PWA
 * تخزين مؤقت متقدم للأصول والخطوط والصور ودعم العمل دون اتصال بالإنترنت
 */

const CACHE_NAME = 'athar-pwa-v1';

// الأصول الأساسية لهيكل التطبيق (App Shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/media/brand/gharsa-album-cover.jpg',
  '/media/brand/gharsa-banner.png'
];

// تثبيت Service Worker وتخزين هيكل التطبيق
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// تفعيل Service Worker وتنظيف النسخ القديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// معالجة طلبات الشبكة (Stale-While-Revalidate & Cache-First)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات غير GET أو بروتوكولات أخرى
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // لطلبات التنقل (Navigation) — توجيه دائم لـ index.html لدعم SPA دون انقطاع
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // لطلبات الخطوط (Google Fonts) والأصول الثابتة والصور — Cache-First مع تحديث الخلفية
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/media/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // جلب نسخة محدثة في الخلفية دون تعطيل العرض
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const resClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
            }
          }).catch(() => {});
          return cached;
        }

        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
          }
          return response;
        }).catch(() => {
          // Fallback للصورة إذا كانت مفقودة دون اتصال
          if (request.destination === 'image') {
            return caches.match('/icons/icon-192.png');
          }
        });
      })
    );
    return;
  }

  // الاستراتيجية الافتراضية: Network First مع الاحتياط للتخزين المؤقت
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// استقبال رسائل تحديث الإصدار
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
