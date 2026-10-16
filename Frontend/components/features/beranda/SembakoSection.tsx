'use client';

import React from 'react';
import Link from 'next/link';
import { Package, ArrowRight, MapPin, Users, CalendarDays } from 'lucide-react';
import type { SembakoPeriod, SembakoStatus } from '@/types/sembako';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { formatDate, formatNumber } from '@/lib/i18n/format';

function pickRelevantPeriod(periods: SembakoPeriod[]): SembakoPeriod | undefined {
  if (!periods.length) return undefined;
  const rank: Record<SembakoStatus, number> = { ongoing: 0, upcoming: 1, completed: 2 };
  return [...periods].sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime(),
  )[0];
}

const STATUS_STYLES: Record<SembakoStatus, string> = {
  ongoing: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  upcoming: 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
  completed: 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400',
};

export const SembakoSection = ({ periods }: { periods: SembakoPeriod[] }) => {
  const { t, locale } = useTranslation();
  const period = pickRelevantPeriod(periods);

  // Belum ada data sama sekali → section disembunyikan agar beranda tetap ramping.
  if (!period) return null;

  const visibleItems = period.items.slice(0, 4);
  const hiddenCount = period.items.length - visibleItems.length;
  const statusLabel = t(
    `Sembako.status${period.status.charAt(0).toUpperCase()}${period.status.slice(1)}`,
  );

  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-neutral-950 relative overflow-hidden">
      <div className="container-desa">
        {/* ── Header: badge & judul ── */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-950 dark:text-primary-300 mb-3">
            <Package className="w-3.5 h-3.5" />
            <span>{t('Home.sembakoBadge')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {t('Home.sembakoTitle')}
          </h2>
        </div>

        {/* ── Kartu periode terbaru ── */}
        <Link
          href="/informasi/sembako"
          className="group block rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(36,61,33,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-[0_18px_45px_rgba(36,61,33,0.12)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
        >
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-stretch sm:gap-0 sm:p-0">
            {/* Panel ikon bergradien */}
            <div className="shrink-0 flex w-full sm:w-24 lg:w-28 flex-col items-center justify-center gap-2 rounded-2xl sm:rounded-2xl-none sm:rounded-l-3xl bg-gradient-to-b from-primary-600 to-primary-800 p-4 text-white">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Package className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="px-2 text-center text-[9px] font-bold uppercase tracking-widest text-primary-100">
                {period.periode}
              </span>
            </div>

            <div className="min-w-0 flex-1 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[period.status]}`}
                >
                  {statusLabel}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:hidden dark:text-neutral-500">
                  {period.periode}
                </span>
              </div>
              <h3 className="mt-1.5 truncate text-base font-extrabold text-slate-900 dark:text-white">
                {period.nama}
              </h3>
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
                  {formatDate(period.tanggalMulai, locale)}
                  {period.tanggalSelesai ? ` – ${formatDate(period.tanggalSelesai, locale)}` : ''}
                </span>
                {period.lokasi && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
                    {period.lokasi}
                  </span>
                )}
                {typeof period.targetPenerima === 'number' && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
                    {formatNumber(period.targetPenerima, locale)} {t('Sembako.kkPenerima')}
                  </span>
                )}
              </p>

              {/* Item sembako (maks. 4 chip) */}
              {visibleItems.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {visibleItems.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors group-hover:border-primary-200 group-hover:bg-primary-50/60 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300 dark:group-hover:border-primary-800"
                    >
                      {item.namaBarang} · {formatNumber(item.jumlahPerKK, locale)} {item.satuan}
                    </li>
                  ))}
                  {hiddenCount > 0 && (
                    <li className="rounded-full bg-primary-100 px-2.5 py-1 text-[11px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                      +{hiddenCount} lainnya
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* CTA panah */}
            <div className="hidden shrink-0 items-center pr-6 sm:flex">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-50 text-primary-700 ring-1 ring-primary-100 transition-all duration-300 group-hover:bg-primary-600 group-hover:text-white group-hover:ring-primary-600 dark:bg-primary-950 dark:text-primary-300 dark:ring-primary-900">
                <ArrowRight
                  className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </div>
          </div>
        </Link>

        {/* Tautan lihat semua (mobile) */}
        <Link
          href="/informasi/sembako"
          className="group mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:gap-3 transition-all sm:hidden dark:text-primary-400"
        >
          {t('Home.sembakoSeeAll')}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
};
