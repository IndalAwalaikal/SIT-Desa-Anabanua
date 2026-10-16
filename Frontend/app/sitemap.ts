import { MetadataRoute } from 'next';
import { getBeritaList } from '@/lib/services/berita.service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://desaanabanua.barrukab.go.id';

  // Fetch berita real dari API; fallback kosong jika API tidak tersedia
  // agar sitemap tetap valid meski backend sedang down.
  let newsUrls: MetadataRoute.Sitemap = [];
  try {
    const result = await getBeritaList({ page: 1, perPage: 100 });
    newsUrls = result.data.map((item) => ({
      url: `${baseUrl}/berita/${item.slug}`,
      lastModified: new Date(item.tanggalTerbit),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // Fallback: sitemap tetap valid tanpa URL berita
  }

  const routes = [
    '',
    '/profil',
    '/profil/sejarah',
    '/profil/struktur-organisasi',
    '/profil/wilayah',
    '/informasi/statistik',
    '/informasi/apbdes',
    '/informasi/peta',
    '/informasi/agenda',
    '/berita',
    '/layanan',
    '/layanan/lacak',
    '/pengaduan',
    '/galeri',
    '/umkm',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [...routes, ...newsUrls];
}
