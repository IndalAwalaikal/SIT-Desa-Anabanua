import React from 'react';
import { HeroSection } from '@/components/features/beranda/HeroSection';
import { InfoTicker } from '@/components/features/beranda/InfoTicker';
import { DemografiPotensiSection } from '@/components/features/beranda/StatsSection';
import { QuickServices } from '@/components/features/beranda/QuickServices';
import { LatestNewsSection } from '@/components/features/beranda/LatestNewsSection';
import { UmkmShowcase } from '@/components/features/beranda/UmkmShowcase';
import { HomeCTA } from '@/components/features/beranda/HomeCTA';
import { PajakSection } from '@/components/features/beranda/PajakSection';
import { ApbdesSection } from '@/components/features/beranda/ApbdesSection';
import { AgendaSection } from '@/components/features/beranda/AgendaSection';
import { ProfilRingkasanSection } from '@/components/features/beranda/ProfilRingkasanSection';
import { SembakoSection } from '@/components/features/beranda/SembakoSection';
import { GallerySection } from '@/components/features/beranda/GallerySection';
import { Reveal } from '@/components/ui/Reveal';
import { getProfilDesa, getPerangkatDesaList, getPotensiDesaList } from '@/lib/services/desa.service';
import { getJenisSuratList } from '@/lib/services/persuratan.service';
import { getBeritaList } from '@/lib/services/berita.service';
import { getUmkmList } from '@/lib/services/umkm.service';
import { getAgendaKegiatan } from '@/lib/services/statistik.service';
import { getGaleriAlbumPreview } from '@/lib/services/galeri.service';
import { getSembakoPeriods } from '@/lib/services/sembako.service';
import type { PotensiDesa } from '@/types/desa';

/**
 * Memetakan daftar PotensiDesa dari API ke bentuk PotensiWilayah
 * yang dipakai DemografiPotensiSection. Pencocokan berdasarkan kata kunci
 * pada kategori/nama; item yang tidak cocok tidak ditampilkan.
 */
function mapPotensi(list: PotensiDesa[]) {
  const fmt = (p?: PotensiDesa) => (p ? `${p.nama} — ${p.deskripsi}` : undefined);
  const pick = (...keywords: string[]): PotensiDesa | undefined =>
    list.find((p) =>
      keywords.some((k) => `${p.kategori} ${p.nama}`.toLowerCase().includes(k)),
    );
  const perkebunan = list
    .filter((item) => `${item.kategori} ${item.nama}`.toLowerCase().includes('perkebunan'))
    .map(fmt)
    .filter(Boolean)
    .join(' · ');

  return {
    pertanian: fmt(pick('pertanian', 'tanaman pangan')),
    perkebunan: perkebunan || fmt(pick('kebun')),
    umkm: fmt(pick('umkm', 'kerajinan', 'usaha')),
  };
}

export default async function HomePage() {
  const [profil, services, newsResult, businesses, agenda, gallery, perangkat, sembako, potensi] = await Promise.all([
    getProfilDesa(),
    getJenisSuratList(),
    getBeritaList({ page: 1, perPage: 4 }),
    getUmkmList(undefined, 4),
    getAgendaKegiatan(),
    getGaleriAlbumPreview(12),
    getPerangkatDesaList(),
    // Sembako boleh gagal tanpa merobohkan beranda — cukup section disembunyikan.
    getSembakoPeriods().catch(() => []),
    getPotensiDesaList().catch(() => []),
  ]);
  const kepalaDesa = perangkat.find(
    (item) => item.jabatan?.trim().toLocaleLowerCase('id-ID') === 'kepala desa',
  );

  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden">
      {/* === Decorative floating glowing blobs — purely visual, pointer-events none === */}
      <div aria-hidden="true" className="pointer-events-none select-none fixed inset-0 overflow-hidden -z-10">
        {/* Blob 1: top-left, primary green — radial glow */}
        <div
          className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-[0.07] dark:opacity-[0.05] hidden md:block"
          style={{
            background: 'radial-gradient(circle at center, rgba(55,171,52,0.55) 0%, rgba(55,171,52,0) 65%)',
            animation: 'float 9s ease-in-out infinite',
          }}
        />
        {/* Blob 2: mid-right, emerald/teal */}
        <div
          className="absolute top-[45%] -right-32 h-[420px] w-[420px] rounded-full opacity-[0.07] dark:opacity-[0.05] hidden md:block"
          style={{
            background: 'radial-gradient(circle at center, rgba(16,185,129,0.5) 0%, rgba(20,184,166,0) 65%)',
            animation: 'float 12s ease-in-out infinite 2s',
          }}
        />
        {/* Blob 3: lower-left, green brand glow */}
        <div
          className="absolute bottom-[15%] -left-24 h-[380px] w-[380px] rounded-full opacity-[0.06] dark:opacity-[0.04] hidden md:block"
          style={{
            background: 'radial-gradient(circle at center, rgba(55,171,52,0.45) 0%, rgba(55,171,52,0) 65%)',
            animation: 'float 10s ease-in-out infinite 4.5s',
          }}
        />
      </div>

      <HeroSection profil={profil} />
      <InfoTicker />
      <Reveal>
        <DemografiPotensiSection
          demografi={{
            totalPenduduk: 2419,
            jumlahKK: 633,
          }}
          potensi={mapPotensi(potensi ?? [])}
          fotoKepalaDesa={kepalaDesa?.foto ?? ''}
          namaKepalaDesa={kepalaDesa?.nama ?? ''}
          namaDesa={profil.nama}
          namaKecamatan={profil.kecamatan}
          namaKabupaten={profil.kabupaten}
        />
      </Reveal>
      <Reveal delay={120}>
        <LatestNewsSection news={newsResult.data} />
      </Reveal>
      <Reveal delay={80}>
        <QuickServices services={services} />
      </Reveal>
      <Reveal delay={100}>
        <PajakSection />
      </Reveal>
      <Reveal delay={110}>
        <ApbdesSection />
      </Reveal>
      <Reveal delay={120}>
        <SembakoSection periods={sembako ?? []} />
      </Reveal>
      <Reveal delay={130}>
        <AgendaSection agenda={agenda || []} />
      </Reveal>
      <Reveal delay={140}>
        <ProfilRingkasanSection profil={profil} perangkat={perangkat ?? []} />
      </Reveal>
      <Reveal delay={160}>
        <GallerySection gallery={gallery || []} />
      </Reveal>
      <Reveal delay={150}>
        <UmkmShowcase businesses={businesses} />
      </Reveal>
      <HomeCTA />
    </div>
  );
}
