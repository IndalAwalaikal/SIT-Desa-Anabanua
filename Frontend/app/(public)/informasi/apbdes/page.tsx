'use client';

import React, { useState, useEffect } from 'react';
import { getApbdes } from '@/lib/services/statistik.service';
import type { ApbdesRingkasan } from '@/types/statistik';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { formatRupiah } from '@/lib/utils/format';
import { getCurrentYear, getTahunOptions } from '@/lib/utils/date';
import { Wallet, TrendingUp, TrendingDown, Download, Filter, RotateCcw, CheckCircle2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { lightTooltipRupiahProps } from '@/lib/utils/chartTooltip';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Reveal } from '@/components/ui/Reveal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';

const COLORS = ['#16a34a', '#37AB34', '#f59e0b', '#dc2626', '#0d9488'];
const TAHUN_OPTIONS = getTahunOptions();
const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function ApbdesPage() {
  const [apbdes, setApbdes] = useState<ApbdesRingkasan | null>(null);
  const [selectedTahun, setSelectedTahun] = useState<number>(getCurrentYear());
  const [selectedBulan, setSelectedBulan] = useState<string>('semua');
  const [selectedPeriode, setSelectedPeriode] = useState<string>('semua');
  const { t } = useTranslation();

  useEffect(() => {
    const p: { bulan?: number; triwulan?: number } = {
      ...(selectedBulan !== 'semua' ? { bulan: Number(selectedBulan) } : {}),
      ...(selectedPeriode !== 'semua' ? { triwulan: Number(selectedPeriode.replace('q', '')) } : {}),
    };
    getApbdes(selectedTahun, p).then(setApbdes);
  }, [selectedTahun, selectedBulan, selectedPeriode]);

  const resetFilters = () => {
    setSelectedTahun(getCurrentYear());
    setSelectedBulan('semua');
    setSelectedPeriode('semua');
  };

  if (!apbdes) {
    return (
      <div className="py-12 bg-neutral-50 dark:bg-neutral-950">
        <div className="container-desa space-y-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-6 w-44 mx-auto rounded-full" />
            <Skeleton className="h-9 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-10 w-40 mx-auto mt-3 rounded-full" />
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-40 w-full rounded-3xl" />
            ))}
          </div>

          {/* Comparison chart */}
          <Skeleton variant="rectangular" className="h-80 w-full rounded-3xl" />

          {/* Income / Expenses breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Skeleton variant="rectangular" className="lg:col-span-6 h-96 w-full rounded-3xl" />
            <Skeleton variant="rectangular" className="lg:col-span-6 h-96 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const pendapatan = apbdes.items.filter((i) => i.kategori === 'pendapatan');
  const belanja = apbdes.items.filter((i) => i.kategori === 'belanja');
  const surplus = apbdes.totalPendapatan - apbdes.totalBelanja;

  const comparisonData = [
    { name: t('Apbdes.totalRevenue'), jumlah: apbdes.totalPendapatan },
    { name: t('Apbdes.totalExpenses'), jumlah: apbdes.totalBelanja },
  ];

  const handleDownload = () => {
    const rows: string[] = [];
    rows.push(`${t('Apbdes.title')} ${apbdes.tahun}`);
    rows.push('');
    rows.push(`${t('Apbdes.totalRevenue')},${formatRupiah(apbdes.totalPendapatan)}`);
    rows.push(`${t('Apbdes.totalExpenses')},${formatRupiah(apbdes.totalBelanja)}`);
    rows.push(`${t('Apbdes.surplus')},${formatRupiah(surplus)}`);
    rows.push('');
    rows.push(
      [
        t('Apbdes.kategoriCol'),
        t('Apbdes.subKategoriCol'),
        t('Apbdes.jumlahCol'),
        t('Apbdes.persentaseCol'),
      ].join(',')
    );
    apbdes.items.forEach((item) => {
      rows.push(`${item.kategori},${item.subKategori},${item.jumlah},${item.persentase}%`);
    });
    const csv = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apbdes-${apbdes.tahun}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeFiltersCount =
    (selectedTahun !== getCurrentYear() ? 1 : 0) +
    (selectedBulan !== 'semua' ? 1 : 0) +
    (selectedPeriode !== 'semua' ? 1 : 0);

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="container-desa space-y-10">
        {/* Header */}
        <Reveal>
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold">
              <span>{t('Apbdes.budgetTransparency')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
              {t('Apbdes.titleWithYear')} {selectedTahun}
            </h1>
            <p className="text-sm text-neutral-500">
              {t('Apbdes.description')}
            </p>
            <button
              onClick={handleDownload}
              className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-primary-700/30 dark:bg-primary-500 dark:hover:bg-primary-400"
              aria-label={t('Apbdes.download')}
            >
              <Download className="h-4 w-4" />
              {t('Apbdes.download')}
            </button>
          </div>
        </Reveal>

        {/* Filter Toolbar Section */}
        <Reveal delay={40}>
          <Card className="p-5 border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                    Filter Periode APBDes &amp; Transparansi Anggaran
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Pilih Tahun Anggaran, Triwulan / Semester, Bulan, atau Tanggal Pelaporan.
                  </p>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline bg-rose-50 dark:bg-rose-950/50 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Filter ({activeFiltersCount})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Filter Tahun */}
              <Select
                label="Tahun Anggaran:"
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(Number(e.target.value))}
                options={TAHUN_OPTIONS.map((th) => ({ value: String(th), label: `Tahun APBDes ${th}` }))}
                className="px-3 py-2 text-xs font-bold"
              />

              {/* Filter Triwulan / Semester */}
              <Select
                label="Semester / Triwulan:"
                value={selectedPeriode}
                onChange={(e) => {
                  setSelectedPeriode(e.target.value);
                  if (e.target.value !== 'semua') setSelectedBulan('semua');
                }}
                options={[
                  { value: 'semua', label: 'Setahun Penuh (12 Bulan)' },
                  { value: 'q1', label: 'Triwulan 1 (Q1: Jan - Mar)' },
                  { value: 'q2', label: 'Triwulan 2 (Q2: Apr - Jun)' },
                  { value: 'q3', label: 'Triwulan 3 (Q3: Jul - Sep)' },
                  { value: 'q4', label: 'Triwulan 4 (Q4: Okt - Des)' },
                ]}
                className="px-3 py-2 text-xs font-bold"
              />

              {/* Filter Bulan */}
              <Select
                label="Bulan Realisasi:"
                value={selectedBulan}
                onChange={(e) => {
                  setSelectedBulan(e.target.value);
                  if (e.target.value !== 'semua') setSelectedPeriode('semua');
                }}
                options={[
                  { value: 'semua', label: 'Semua Bulan' },
                  ...BULAN_NAMES.map((bName, idx) => ({ value: String(idx + 1), label: `Bulan ${bName}` })),
                ]}
                className="px-3 py-2 text-xs font-bold"
              />

              {/* Catatan: filter tanggal cut-off dihapus — data kini disimpan & disajikan per periode nyata (tahun/bulan/triwulan). */}
            </div>

            {/* Active Filter Pill */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400">
              <span className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Laporan Dilihat:
              </span>
              <span className="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full font-semibold">
                Tahun: {selectedTahun}
              </span>
              <span className="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full font-semibold">
                Periode: {selectedPeriode.toUpperCase()}
              </span>
              {selectedBulan !== 'semua' && (
                <span className="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full font-semibold">
                  Bulan: {BULAN_NAMES[Number(selectedBulan) - 1]}
                </span>
              )}
            </div>
          </Card>
        </Reveal>

        {/* Total Summary Cards — BUG FIX: added lg:col-span-4 untuk tiap card */}
        <Reveal delay={80}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-6">
            <Card
              className="p-6 bg-gradient-to-br from-emerald-600 to-primary-800 text-white shadow-xl lg:col-span-4"
              hoverable
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wide bg-white/20 px-3 py-1 rounded-full">
                  {t('Apbdes.revenue')}
                </span>
                <TrendingUp className="w-6 h-6 text-emerald-300" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black break-all">
                <AnimatedCounter value={apbdes.totalPendapatan} formatter={formatRupiah} />
              </h2>
              <p className="text-xs text-primary-100 mt-2">
                {t('Apbdes.revenueDesc')}
              </p>
            </Card>

            <Card
              className="p-6 bg-gradient-to-br from-primary-600 to-secondary-800 text-white shadow-xl lg:col-span-4"
              hoverable
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wide bg-white/20 px-3 py-1 rounded-full">
                  {t('Apbdes.expenses')}
                </span>
                <TrendingDown className="w-6 h-6 text-primary-300" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black break-all">
                <AnimatedCounter value={apbdes.totalBelanja} formatter={formatRupiah} />
              </h2>
              <p className="text-xs text-primary-100 mt-2">
                {t('Apbdes.expensesDesc')}
              </p>
            </Card>

            <Card
              className="p-6 bg-gradient-to-br from-amber-500 to-accent-700 text-neutral-950 shadow-xl lg:col-span-4"
              hoverable
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wide bg-neutral-950/20 px-3 py-1 rounded-full text-neutral-800">
                  {t('Apbdes.surplus')}
                </span>
                <Wallet className="w-6 h-6 text-neutral-800" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black break-all">
                <AnimatedCounter value={surplus} formatter={formatRupiah} />
              </h2>
              <p className="text-xs text-neutral-800 mt-2">
                {t('Apbdes.surplusDesc')}
              </p>
            </Card>
          </div>
        </Reveal>

        {/* Perbandingan Pendapatan vs Belanja */}
        <Reveal delay={120}>
          <Card className="p-6" hoverable>
            <CardHeader className="px-0 pt-0 mb-4">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {t('Apbdes.comparisonTitle')}
              </h3>
            </CardHeader>
            <CardBody className="px-0 space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} barCategoryGap="30%">
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                      tickFormatter={(v) => `${Math.round((v as number) / 1_000_000)}jt`}
                      width={62}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <Tooltip {...lightTooltipRupiahProps} />
                    <Bar dataKey="jumlah" radius={[10, 10, 0, 0]}>
                      <Cell fill="#16a34a" />
                      <Cell fill="#37AB34" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-emerald-600" /> {t('Apbdes.legendRevenue')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-primary-600" /> {t('Apbdes.legendExpenses')}
                </span>
                <span>
                  {t('Apbdes.surplusLabel')} {apbdes.tahun}:{' '}
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    <AnimatedCounter value={surplus} formatter={formatRupiah} />
                  </span>
                </span>
              </div>
            </CardBody>
          </Card>
        </Reveal>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Income Breakdown */}
          <Reveal className="lg:col-span-6" delay={80}>
            <Card className="p-6" hoverable>
              <CardHeader className="px-0 pt-0 mb-4">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {t('Apbdes.incomeBreakdown')}
                </h3>
              </CardHeader>
              <CardBody className="px-0 space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pendapatan}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        dataKey="jumlah"
                        nameKey="subKategori"
                      >
                        {pendapatan.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...lightTooltipRupiahProps} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  {pendapatan.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-neutral-600 dark:text-neutral-400">{item.subKategori}</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {formatRupiah(item.jumlah)} ({item.persentase}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Reveal>

          {/* Expenses Breakdown */}
          <Reveal className="lg:col-span-6" delay={160}>
            <Card className="p-6" hoverable>
              <CardHeader className="px-0 pt-0 mb-4">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {t('Apbdes.expensesBreakdown')}
                </h3>
              </CardHeader>
              <CardBody className="px-0 space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={belanja}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        dataKey="jumlah"
                        nameKey="subKategori"
                      >
                        {belanja.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...lightTooltipRupiahProps} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  {belanja.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-neutral-600 dark:text-neutral-400">{item.subKategori}</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {formatRupiah(item.jumlah)} ({item.persentase}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
