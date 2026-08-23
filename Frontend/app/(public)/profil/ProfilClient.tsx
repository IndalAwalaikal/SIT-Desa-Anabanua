'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ProfilDesa, PerangkatDesa } from '@/types/desa';
import { Card } from '@/components/ui/Card';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { PublicMasthead } from '@/components/layout/PublicMasthead';
import { Reveal } from '@/components/ui/Reveal';
import { KepalaDesaCard, findKepalaDesa } from '@/components/features/KepalaDesaCard';
import {
  ArrowUpRight,
  History,
  Landmark,
  Map,
  Users,
  MapPin,
  Globe,
  Building2,
  Home,
  BarChart3,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ProfilClientProps {
  profil: ProfilDesa;
  perangkat: PerangkatDesa[];
}

// Variasi shade primary saja — tidak ada warna aksen lain (anti AI-slop).
const STAT_GRADIENTS = [
  'from-primary-100 to-primary-600',
  'from-primary-50 to-primary-700',
  'from-primary-100 to-primary-700',
  'from-primary-50 to-primary-600',
];

// Fallback foto kantor bila URL dari DB gagal dimuat / kosong.
const KANTOR_FALLBACK = '/kantor_desa.png';

export const ProfilClient: React.FC<ProfilClientProps> = ({ profil, perangkat }) => {
  const { t } = useTranslation();
  const kepalaDesa = findKepalaDesa(perangkat);
  const mapHref = 'https://maps.app.goo.gl/nSJcjAg82dk2tuLm7';
  const websiteHref = profil.website
    ? profil.website.startsWith('http')
      ? profil.website
      : `https://${profil.website}`
    : '';

  // Fallback foto kantor bila URL dari DB kosong/gagal dimuat — cegah null src.
  const [officeSrc, setOfficeSrc] = React.useState<string>(profil.fotoKantor || KANTOR_FALLBACK);

  const routes = [
    { href: '/profil/sejarah', title: t('Profil.route1Title'), text: t('Profil.route1Text'), icon: History, number: '01' },
    { href: '/profil/struktur-organisasi', title: t('Profil.route2Title'), text: t('Profil.route2Text'), icon: Users, number: '02' },
    { href: '/profil/wilayah', title: t('Profil.route3Title'), text: t('Profil.route3Text'), icon: Map, number: '03' },
  ];

  const factCards = [
    { label: t('Profil.luasWilayahLabel'), raw: profil.luasWilayah || '12,5 km²', icon: MapPin, numeric: false },
    { label: t('Profil.jumlahDusunLabel'), raw: profil.jumlahDusun, icon: Home, numeric: true },
    { label: t('Profil.jumlahRWLabel'), raw: profil.jumlahRW, icon: BarChart3, numeric: true },
    { label: t('Profil.jumlahRTLabel'), raw: profil.jumlahRT, icon: Building2, numeric: true },
  ];

  const sejarahExcerpt = profil.sejarah
    ? profil.sejarah.length > 420
      ? `${profil.sejarah.substring(0, 420)}...`
      : profil.sejarah
    : '';

  return (
    <div className="bg-[#f5f8fc] py-8 sm:py-12 dark:bg-neutral-950">
      <div className="container-desa space-y-10 sm:space-y-14">
        {/* ===== Masthead ===== */}
        <PublicMasthead
          eyebrow={t('Profil.mastheadEyebrow')}
          title={t('Profil.mastheadTitle')}
          description={t('Profil.mastheadDesc')}
          image="/kantor_desa.png"
        />

        {/* ===== Quick Navigation Cards ===== */}
        <Reveal delay={0}>
          <nav className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-[0_18px_40px_rgba(15,50,100,.06)] md:grid-cols-3 dark:border-neutral-800 dark:bg-neutral-800">
            {routes.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative bg-white p-6 transition duration-500 hover:bg-primary-50/60 dark:bg-neutral-900 dark:hover:bg-neutral-800"
              >
                <div
                  className="absolute top-0 left-0 w-1 h-0 bg-primary-500 group-hover:h-14 transition-all duration-500"
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold tracking-widest text-primary-600">
                    {item.number}
                 </span>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    <item.icon className="h-5 w-5" />
                 </div>
               </div>
                <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
               </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
                  {item.text}
               </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary-700 group-hover:gap-2 transition-all">
                  {t('Profil.explore')} <ArrowUpRight className="h-3.5 w-3.5" />
               </span>
             </Link>
            ))}
         </nav>
       </Reveal>

        {/* ===== Village Facts Stat Cards ===== */}
        <section aria-labelledby="fakta-desa-heading">
          <Reveal delay={80}>
            <div className="mb-6 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h2 id="fakta-desa-heading" className="text-xl font-extrabold text-neutral-900 dark:text-white">
                {t('Profil.faktaDesa')}
             </h2>
           </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 max-w-2xl">
              {t('Profil.faktaDesc')}
           </p>
         </Reveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {factCards.map((card, idx) => (
              <Reveal key={card.label} delay={80 + idx * 80}>
                <div
                  className="group relative overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-6 shadow-[0_10px_30px_rgba(15,44,88,0.05)] transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${STAT_GRADIENTS[idx % STAT_GRADIENTS.length]}`}
                  />
                  <div
                    className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${STAT_GRADIENTS[idx % STAT_GRADIENTS.length]} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
                  />
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${STAT_GRADIENTS[idx % STAT_GRADIENTS.length]} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
                    >
                      <card.icon className="h-6 w-6" />
                   </div>
                    <div>
                      <h3 className="text-2xl font-black text-neutral-900 dark:text-white flex items-baseline gap-1">
                        {card.numeric ? (
                          <AnimatedCounter
                            value={Number(card.raw)}
                            duration={2400}
                            delay={idx * 110}
                          />
                        ) : (
                          <span>{card.raw}</span>
                        )}
                     </h3>
                      <p className="mt-0.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        {card.label}
                     </p>
                   </div>
                 </div>
               </div>
             </Reveal>
            ))}
         </div>
       </section>

        {/* ===== Office Card (full-width, no kontak section) ===== */}
        <section id="nav-profil">
          <Reveal delay={220}>
            <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
              <div className="relative h-52 w-full bg-neutral-100 dark:bg-neutral-800">
                <Image
                  src={officeSrc || KANTOR_FALLBACK}
                  alt={`Kantor ${profil.nama || 'Desa Borong'}`}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  unoptimized
                  onError={() => setOfficeSrc(KANTOR_FALLBACK)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-neutral-950/80 backdrop-blur-md p-3 text-white text-xs flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-400" />
                    <span className="font-bold">{profil.nama || 'Desa Borong'}</span>
                 </div>
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <MapPin className="w-3 h-3" /> {t('Profil.lihatPeta')}
                 </a>
               </div>
             </div>
              <div className="p-6 sm:p-8 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t('Profil.navProfil')}</span>
               </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {profil.nama || 'Desa Borong'}, Kecamatan {profil.kecamatan || 'Herlang'}
               </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                  {profil.alamatKantor ||
                    'Jl. Raya Desa Borong, Kec. Herlang, Kabupaten Bulukumba.'}
               </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                  Terletak di{' '}
                  <a
                    href="https://bulukumbakab.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    Kabupaten Bulukumba <Globe className="w-3 h-3" />
                 </a>
                  , Provinsi {profil.provinsi || 'Sulawesi Selatan'}. Pusat pemerintahan dan pelayanan masyarakat berada di Kantor Desa yang melayani keperluan administrasi, persuratan, dan pemberdayaan warga.
               </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <MapPin className="w-4 h-4" />
                    {t('Profil.lihatPeta')}
                 </a>
                  {websiteHref && (
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all border border-neutral-200 dark:border-neutral-700"
                    >
                      <Globe className="w-4 h-4 text-primary-500" />
                      {t('Profil.kunjungiWebsite')}
                   </a>
                  )}
               </div>
             </div>
           </Card>
         </Reveal>
       </section>

        {/* ===== Kepala Desa (dinamis dari data perangkat desa) ===== */}
        {kepalaDesa && (
          <section aria-labelledby="kepala-desa-heading">
            <Reveal delay={140}>
              <h2 id="kepala-desa-heading" className="sr-only">
                {t('KepalaDesa.jabatan')}
              </h2>
              <KepalaDesaCard
                kepala={kepalaDesa}
                about={sejarahExcerpt}
                aboutEyebrow={t('Profil.mastheadEyebrow')}
              />
            </Reveal>
          </section>
        )}

        {/* ===== Visi & Misi ===== */}
        <Reveal delay={180}>
          <div id="nav-visimisi" className="grid gap-8 lg:grid-cols-[.9fr_1.4fr]">
            <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0b4b9c] p-8 text-white shadow-[0_18px_45px_rgba(11,75,156,.22)] sm:p-10">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/15" />
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full border border-white/10" />
              <p className="relative text-[11px] font-bold uppercase tracking-[.2em] text-blue-100">
                {t('Profil.arahPembangunan')}
             </p>
              <blockquote className="relative mt-6 font-serif text-2xl font-bold leading-snug sm:text-3xl">
                &#x201C;{profil.visi}&#x201D;
             </blockquote>
              <div className="relative mt-12 border-t border-white/20 pt-5 text-xs text-blue-100">
                {t('Profil.periode')}
             </div>
           </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_15px_38px_rgba(15,50,100,.05)] sm:p-9 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-neutral-800">
                <div>
                  <p className="eyebrow">{t('Profil.komitmen')}</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {t('Profil.misiTitle')}
                 </h2>
               </div>
                <Landmark className="h-7 w-7 text-primary-600" />
             </div>
              <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                {profil.misi.map((item, idx) => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-neutral-300"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-50 text-[10px] font-bold text-primary-700 dark:bg-primary-950">
                      {String(idx + 1).padStart(2, '0')}
                   </span>
                    {item}
                 </li>
                ))}
             </ol>
           </section>
         </div>
       </Reveal>

        {/* ===== Profil Singkat (Sejarah Excerpt) ===== */}
        {sejarahExcerpt && (
          <Reveal delay={380}>
            <Card className="p-8 sm:p-10 border border-slate-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold mb-4">
                <History className="w-3.5 h-3.5" />
                <span>{t('Profil.profilSingkat')}</span>
             </div>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-4 leading-tight">
                {t('Profil.profilSingkatTitle', 'Sejarah Desa Borong')}
             </h2>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-6">
                {sejarahExcerpt}
             </p>
              <Link
                href="/profil/sejarah"
                className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-primary-600 dark:text-primary-400 hover:gap-2 transition-all"
              >
                {t('Profil.bacaSejarah')} <ArrowUpRight className="h-4 w-4" />
             </Link>
           </Card>
         </Reveal>
        )}
     </div>
   </div>
  );
};
