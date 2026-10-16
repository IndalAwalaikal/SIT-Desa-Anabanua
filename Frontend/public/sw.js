/* Service Worker — Website Desa Anabanua
   Strategi cache:
   - Navigasi halaman (mode 'navigate'): network-first, fallback ke cache, terakhir ke halaman "/".
   - Aset statis (JS/CSS/gambar): stale-while-revalidate (tampilkan cache, perbarui di belakang).
   - Pre-cache halaman penting agar tetap terbaca tanpa sinyal (PRD §5.11 PWA ringan).
*/
const CACHE_NAME = 'desa-anabanua-v3';

// Halaman info penting yang di-pre-cache saat service worker terpasang.
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/profil',
  '/profil/sejarah',
  '/layanan',
  '/informasi/pajak',
  '/informasi/apbdes',
  '/informasi/agenda',
  '/informasi/fasilitas',
  '/pengaduan',
  '/umkm',
  '/faq',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        // allSettled: kegagalan satu URL (mis. server sedang mati) tidak menggagalkan pemasangan.
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navigasi halaman: utamakan jaringan agar konten selalu segar, cache sebagai cadangan offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Aset statis: tampilkan cache lebih dulu, perbarui di latar belakang (stale-while-revalidate).
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

