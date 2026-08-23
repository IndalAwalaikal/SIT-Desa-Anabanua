'use client';

import React, { useMemo, useState } from 'react';
import { Package, MapPin, Users, CalendarDays, Wheat } from 'lucide-react';
import type { SembakoPeriod, SembakoStatus } from '@/types/sembako';
import { Card } from '@/components/ui/Card';
import { PublicMasthead } from '@/components/layout/PublicMasthead';
import { Reveal } from '@/components/ui/Reveal';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { formatDate, formatNumber } from '@/lib/i18n/format';

interface SembakoClientProps {
  periods: SembakoPeriod[];
}

const STATUS_STYLES: Record<SembakoStatus, string> = {
  ongoing: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  completed: 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400',
};

export const SembakoClient: React.FC<SembakoClientProps> = ({ periods }) => {
  const { t, locale } = useTranslation();
  const [filter, setFilter] = useState<'semua' | SembakoStatus>('semua');

  const filtered = useMemo(
    () => (filter === 'semua' ? periods : periods.filter((p) => p.status === filter)),
    [periods, filter],
  );

  // Periode berjalan ditampilkan paling menonjol; sisanya urut tanggal mulai terbaru.
  const sorted = useMemo(() => {
    const rank: Record<SembakoStatus, number> = { ongoing: 0, upcoming: 1, completed: 2 };
    return [...filtered].sort((a, b) => rank[a.status] - rank[b.status] ||
      new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime());
  }, [filtered]);

  const filters: Array<{ key: 'semua' | SembakoStatus; label: string }> = [
    { key: 'semua', label: t('Sembako.filterSemua') },
    { key: 'ongoing', label: t('Sembako.statusOngoing') },
    { key: 'upcoming', label: t('Sembako.statusUpcoming') },
    { key: 'completed', label: t('Sembako.statusCompleted') },
  ];

  return (
    <div className="bg-[#f5f8fc] py-8 sm:py-12 dark:bg-neutral-950">
      <div className="container-desa space-y-10">
        <PublicMasthead
          eyebrow={t('Sembako.mastheadEyebrow')}
          title={t('Sembako.mastheadTitle')}
          description={t('Sembako.mastheadDesc')}
          image="/kantor_desa.png"
        />

        {/* Filter status */}
        <Reveal>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('Sembako.filterAria')}>
            {filters.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  filter === f.key
                    ? 'bg-primary-700 text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Reveal>

        {sorted.length === 0 && (
          <Card className="p-10 text-center text-sm text-slate-500 dark:text-neutral-400">
            {t('Sembako.empty')}
          </Card>
        )}

        <div className="space-y-8">
          {sorted.map((period, idx) => (
            <Reveal key={period.id} delay={60 + idx * 60}>
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,44,88,0.06)] dark:border-neutral-800 dark:bg-neutral-900">
                {/* Header periode */}
                <header className="relative overflow-hidden bg-gradient-to-r from-primary-700 to-primary-500 p-6 text-white sm:p-8">
                  <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full border border-white/15" aria-hidden="true" />
                  <div className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full border border-white/10" aria-hidden="true" />
                  <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[period.status]} bg-white`}>
                          {t(`Sembako.status${period.status.charAt(0).toUpperCase()}${period.status.slice(1)}`)}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-100">{period.periode}</span>
                      </div>
                      <h2 className="mt-3 text-xl font-extrabold leading-tight sm:text-2xl">{period.nama}</h2>
                      {period.keterangan && (
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-50/90">{period.keterangan}</p>
                      )}
                    </div>
                    <div className="shrink-0 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                      <Package className="h-7 w-7" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="relative mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-blue-50">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      {formatDate(period.tanggalMulai, locale)}
                      {period.tanggalSelesai ? ` – ${formatDate(period.tanggalSelesai, locale)}` : ''}
                    </span>
                    {period.lokasi && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" aria-hidden="true" /> {period.lokasi}
                      </span>
                    )}
                    {typeof period.targetPenerima === 'number' && (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        {formatNumber(period.targetPenerima, locale)} {t('Sembako.kkPenerima')}
                      </span>
                    )}
                  </div>
                </header>

                {/* Rincian barang */}
                <div className="p-6 sm:p-8">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-700 dark:text-neutral-200">
                    <Wheat className="h-4 w-4 text-primary-600" aria-hidden="true" />
                    {t('Sembako.rincianBarang')}
                  </h3>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {period.items.map((item) => (
                      <li
                        key={item.id || item.namaBarang}
                        className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:border-primary-700"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800 dark:text-neutral-100">{item.namaBarang}</p>
                            {item.keterangan && (
                              <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-neutral-400">{item.keterangan}</p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-black text-primary-700 dark:text-primary-300">
                              {formatNumber(item.jumlahPerKK, locale)}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.satuan}/KK</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
};
