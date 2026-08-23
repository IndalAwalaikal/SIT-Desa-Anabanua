// next.config.mjs — Website Desa Borong
// Rewrites semua request /api/* (dan /uploads/*) ke backend Go melalui internal Docker network.
// Variabel NEXT_PUBLIC_* dan API_INTERNAL_URL disuplai lewat Docker BUILD ARG → ENV (lihat Frontend/Dockerfile).

const API_INTERNAL_URL = process.env.API_INTERNAL_URL || 'http://backend:8080';

export default {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    // Aktifkan optimasi Next.js (membutuhkan sharp — sudah ada di package.json).
    // Gambar akan dikonversi ke WebP / AVIF dan di-resize sesuai layar pengguna.
    qualities: [75, 85, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 jam
    remotePatterns: [
      // Unsplash — dipakai sebagai hero background HD
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // ui-avatars.com — avatar generik perangkat desa bila belum ada foto unggah
      { protocol: 'https', hostname: 'ui-avatars.com' },
      // Backend uploads yang diakses via rewrite /uploads/*
      // ponytail: wildcard hostname '**' dihapus untuk mencegah SSRF;
      // tambahkan hostname domain produksi saat deploy.
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: 'backend' },
    ],
  },

  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Website Desa Borong',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3300',
  },

  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_INTERNAL_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API_INTERNAL_URL}/uploads/:path*` },
    ];
  },
};

