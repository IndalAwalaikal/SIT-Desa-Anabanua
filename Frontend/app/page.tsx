import React from 'react';
import { HeroSection } from '@/components/features/beranda/HeroSection';
import { InfoTicker } from '@/components/features/beranda/InfoTicker';
import { StatsSection } from '@/components/features/beranda/StatsSection';
import { QuickServices } from '@/components/features/beranda/QuickServices';
import { LatestNewsSection } from '@/components/features/beranda/LatestNewsSection';
import { UmkmShowcase } from '@/components/features/beranda/UmkmShowcase';
import { HomeCTA } from '@/components/features/beranda/HomeCTA';
import { PajakSection } from '@/components/features/beranda/PajakSection';
import { ApbdesSection } from '@/components/features/beranda/ApbdesSection';
import { AgendaSection } from '@/components/features/beranda/AgendaSection';
import { ProfilRingkasanSection } from '@/components/features/beranda/ProfilRingkasanSection';
import { GallerySection } from '@/components/features/beranda/GallerySection';
import { Reveal } from '@/components/ui/Reveal';
import { getProfilDesa, getPerangkatDesaList } from '@/lib/services/desa.service';
import { getStatistikPenduduk } from '@/lib/services/statistik.service';
import { getJenisSuratList } from '@/lib/services/persuratan.service';
import { getBeritaList } from '@/lib/services/berita.service';
import { getUmkmList } from '@/lib/services/umkm.service';
import { getAgendaKegiatan } from '@/lib/services/statistik.service';
import { getGaleriAlbumList } from '@/lib/services/galeri.service';

export default async function HomePage() {
  const [profil, statistik, services, newsResult, businesses, agenda, gallery, perangkat] = await Promise.all([
    getProfilDesa(),
    getStatistikPenduduk(),
    getJenisSuratList(),
    getBeritaList({ page: 1, perPage: 4 }),
    getUmkmList(),
    getAgendaKegiatan(),
    getGaleriAlbumList(),
    getPerangkatDesaList(),
  ]);

  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden">
      {/* === Decorative floating glowing blobs — purely visual, pointer-events none === */}
      <div aria-hidden="true" className="pointer-events-none select-none fixed inset-0 overflow-hidden -z-10">
        {/* Blob 1: top-left, primary blue — radial glow tanpa blur filter (jauh lebih ringan utk GPU) */}
        <div
          className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-[0.07] dark:opacity-[0.05] hidden md:block"
          style={{
            background: 'radial-gradient(circle at center, rgba(36,116,212,0.55) 0%, rgba(36,116,212,0) 65%)',
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
        {/* Blob 3: lower-left, navy/primary — tetap dalam keluarga biru brand */}
        <div
          className="absolute bottom-[15%] -left-24 h-[380px] w-[380px] rounded-full opacity-[0.06] dark:opacity-[0.04] hidden md:block"
          style={{
            background: 'radial-gradient(circle at center, rgba(11,93,187,0.55) 0%, rgba(11,93,187,0) 65%)',
            animation: 'float 10s ease-in-out infinite 4.5s',
          }}
        />
      </div>

      <HeroSection profil={profil} />
      <InfoTicker />
      <Reveal>
        <StatsSection statistik={statistik} profil={profil} />
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
