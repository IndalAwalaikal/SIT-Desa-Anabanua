'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Quote } from 'lucide-react';
import type { PerangkatDesa } from '@/types/desa';
import { useTranslation } from '@/lib/i18n/useTranslation';

/**
 * Kartu profil Kepala Desa — data dinamis dari tabel perangkat_desa
 * (entri dengan jabatan "Kepala Desa", prioritas tier tertinggi).
 * Foto memakai fallback avatar otomatis bila URL kosong/gagal dimuat.
 */

const AVATAR_FALLBACK = (nama: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(nama)}&size=400&background=0b4b9c&color=fff&bold=true`;

interface KepalaDesaCardProps {
  kepala: PerangkatDesa;
  /** 'full' = layout 2 card (teks tentang desa kiri, foto+identitas kanan); 'compact' = baris ringkas. */
  variant?: 'full' | 'compact';
  /** Teks tentang desa untuk card kiri (variant 'full'). */
  about?: string;
  /** Judul kecil di atas teks card kiri. */
  aboutEyebrow?: string;
  className?: string;
}

export function findKepalaDesa(list: PerangkatDesa[]): PerangkatDesa | undefined {
  return list.find((p) => p.jabatan?.trim().toLowerCase() === 'kepala desa');
}

export const KepalaDesaCard: React.FC<KepalaDesaCardProps> = ({
  kepala,
  variant = 'full',
  about,
  aboutEyebrow,
  className = '',
}) => {
  const { t } = useTranslation();
  const [src, setSrc] = useState(kepala.foto || AVATAR_FALLBACK(kepala.nama));

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-primary-500/60">
          <Image src={src} alt={kepala.nama} fill sizes="56px" className="object-cover" unoptimized onError={() => setSrc(AVATAR_FALLBACK(kepala.nama))} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary-600 dark:text-primary-400">{t('KepalaDesa.jabatan')}</p>
          <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{kepala.nama}</p>
        </div>
      </div>
    );
  }

  // Layout 2 card: kiri teks tentang desa, kanan foto kepala desa + nama + jabatan.
  return (
    <section
      aria-label={t('KepalaDesa.jabatan')}
      className={`grid gap-6 lg:gap-8 md:grid-cols-2 ${className}`}
    >
      {/* ── Card kiri: teks tentang Desa Borong ── */}
      <div className="group/card relative flex flex-col justify-center overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-[0_18px_45px_rgba(15,50,100,.08)] sm:p-9 dark:border-neutral-800 dark:bg-neutral-900">
        <Quote className="absolute right-7 top-7 h-10 w-10 text-primary-100 dark:text-neutral-800" aria-hidden="true" />
        {aboutEyebrow && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {aboutEyebrow}
          </span>
        )}
        <h2 className="mt-4 text-xl font-black leading-tight text-slate-900 sm:text-2xl dark:text-white">
          {t('Profil.mastheadTitle')}
        </h2>
        {about && (
          <p className="mt-4 text-sm leading-relaxed text-slate-600 line-clamp-8 sm:text-base dark:text-neutral-300">
            {about}
          </p>
        )}
        <div className="mt-6">
          <Link
            href="/profil/sejarah"
            className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 transition-all hover:gap-2 dark:text-primary-400"
          >
            {t('Profil.route1Title')} →
          </Link>
        </div>
      </div>

      {/* ── Card kanan: foto + nama + jabatan kepala desa ── */}
      <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,50,100,.08)] dark:border-neutral-800 dark:bg-neutral-900">
        {/* Foto */}
        <div className="relative h-64 sm:h-72 bg-gradient-to-br from-primary-100 to-primary-300 dark:from-neutral-800 dark:to-neutral-700">
          <Image
            src={src}
            alt={`${t('KepalaDesa.jabatan')} ${kepala.nama}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
            unoptimized
            onError={() => setSrc(AVATAR_FALLBACK(kepala.nama))}
          />
        </div>

        {/* Identitas di dalam card */}
        <div className="flex flex-col p-6 sm:p-7">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('KepalaDesa.jabatan')}
          </span>
          <h3 className="mt-3 text-xl font-black leading-tight text-slate-900 sm:text-2xl dark:text-white">
            {kepala.nama}
          </h3>
          {kepala.nip && (
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
              NIP. {kepala.nip}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 dark:text-neutral-300">
            {kepala.periode && (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 dark:bg-neutral-800">
                {t('KepalaDesa.periode')} {kepala.periode}
              </span>
            )}
            <Link
              href="/profil/struktur-organisasi"
              className="inline-flex items-center gap-1 font-bold text-primary-600 transition-all hover:gap-2 dark:text-primary-400"
            >
              {t('KepalaDesa.lihatStruktur')} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
