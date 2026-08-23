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
  /** 'full' = kartu besar dgn foto besar (profil/beranda); 'compact' = baris ringkas. */
  variant?: 'full' | 'compact';
  className?: string;
}

export function findKepalaDesa(list: PerangkatDesa[]): PerangkatDesa | undefined {
  return list.find((p) => p.jabatan?.trim().toLowerCase() === 'kepala desa');
}

export const KepalaDesaCard: React.FC<KepalaDesaCardProps> = ({
  kepala,
  variant = 'full',
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

  return (
    <section
      aria-label={t('KepalaDesa.jabatan')}
      className={`group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,50,100,.08)] dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      <div className="grid sm:grid-cols-[280px_1fr]">
        {/* Foto */}
        <div className="relative h-64 sm:h-full min-h-[256px] bg-gradient-to-br from-primary-100 to-primary-300 dark:from-neutral-800 dark:to-neutral-700">
          <Image
            src={src}
            alt={`${t('KepalaDesa.jabatan')} ${kepala.nama}`}
            fill
            sizes="(max-width: 640px) 100vw, 280px"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
            unoptimized
            onError={() => setSrc(AVATAR_FALLBACK(kepala.nama))}
          />
        </div>

        {/* Identitas */}
        <div className="relative flex flex-col justify-center p-7 sm:p-9">
          <Quote className="absolute right-7 top-7 h-10 w-10 text-primary-100 dark:text-neutral-800" aria-hidden="true" />
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('KepalaDesa.jabatan')}
          </span>
          <h2 className="mt-4 text-xl font-black leading-tight text-slate-900 sm:text-2xl dark:text-white">
            {kepala.nama}
          </h2>
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
