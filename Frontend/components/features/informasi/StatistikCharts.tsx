'use client';

import React from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
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
  LineChart,
  Line,
} from 'recharts';
import { lightTooltipProps } from '@/lib/utils/chartTooltip';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { StatistikPenduduk, TrenPenduduk } from '@/types/statistik';

const COLORS = ['#16a34a', '#37AB34', '#f59e0b', '#dc2626', '#0d9488', '#f97316', '#06b6d4'];

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

interface StatistikChartsProps {
  data: StatistikPenduduk;
  tren?: TrenPenduduk;
}

/**
 * Bagian berisi chart (recharts) — dipisah agar dapat di-lazy-load (dynamic
 * { ssr:false }) sehingga pustaka chart berat tidak ikut bundle pada halaman
 * lain. Diterima sebagai Client Component dan tidak perlu data di SSR.
 */
export const StatistikCharts: React.FC<StatistikChartsProps> = ({ data, tren }) => {
  const { t } = useTranslation();
  const genderData = [
    { name: t('Statistik.lakiLaki'), value: data.lakiLaki },
    { name: t('Statistik.perempuan'), value: data.perempuan },
  ];

  return (
    <React.Fragment>
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Bar Chart: Per Dusun */}
        <Card className="lg:col-span-8 p-6">
          <CardHeader className="px-0 pt-0 flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              {t('Statistik.perDusun')}
            </h3>
          </CardHeader>
          <CardBody className="px-0 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.perDusun}>
                <XAxis dataKey="dusun" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip {...lightTooltipProps} />
                <Bar dataKey="jumlah" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Pie Chart: Gender */}
        <Card className="lg:col-span-4 p-6">
          <CardHeader className="px-0 pt-0 mb-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-secondary-600" />
              {t('Statistik.komposisiGender')}
            </h3>
          </CardHeader>
          <CardBody className="px-0 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#37AB34" />
                  <Cell fill="#f97316" />
                </Pie>
                <Tooltip {...lightTooltipProps} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Education Chart */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 mb-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {t('Statistik.pendidikan')}
            </h3>
          </CardHeader>
          <CardBody className="px-0 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.perPendidikan} layout="vertical">
                <XAxis type="number" stroke="#888888" fontSize={12} />
                <YAxis dataKey="jenjang" type="category" stroke="#888888" fontSize={11} width={130} />
                <Tooltip {...lightTooltipProps} />
                <Bar dataKey="jumlah" fill="#37AB34" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Profession Chart */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 mb-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {t('Statistik.pekerjaan')}
            </h3>
          </CardHeader>
          <CardBody className="px-0 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.perPekerjaan} layout="vertical">
                <XAxis type="number" stroke="#888888" fontSize={12} />
                <YAxis dataKey="pekerjaan" type="category" stroke="#888888" fontSize={11} width={130} />
                <Tooltip {...lightTooltipProps} />
                <Bar dataKey="jumlah" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

        {/* Charts Row 3: Age Groups & Religion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Age Group Chart */}
        {data.perKelompokUsia && data.perKelompokUsia.length > 0 && (
          <Card className="p-6">
            <CardHeader className="px-0 pt-0 mb-4">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {t('Statistik.kelompokUsia')}
              </h3>
            </CardHeader>
            <CardBody className="px-0 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.perKelompokUsia}>
                  <XAxis dataKey="rentang" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip {...lightTooltipProps} />
                  <Bar dataKey="jumlah" fill="#0d9488" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        {/* Religion Chart */}
        {data.perAgama && data.perAgama.length > 0 && (
          <Card className="p-6">
            <CardHeader className="px-0 pt-0 mb-4">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {t('Statistik.agama')}
              </h3>
            </CardHeader>
            <CardBody className="px-0 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.perAgama.map((item) => ({ name: item.agama, value: item.jumlah }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {data.perAgama.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...lightTooltipProps} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Charts Row 4: Tren Bulanan (line chart) — baris penuh */}
      {tren && tren.data.length > 0 && (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 mb-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              {t('Statistik.trenBulanan', `Tren Kependudukan Bulanan — Tahun ${tren.tahun}`)}
            </h3>
          </CardHeader>
          <CardBody className="px-0 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={tren.data.map((d) => ({ ...d, label: BULAN_SHORT[d.bulan - 1] ?? String(d.bulan) }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip {...lightTooltipProps} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="lahir" name={t('Statistik.trenLahir', 'Kelahiran')} stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="meninggal" name={t('Statistik.trenMeninggal', 'Kematian')} stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pindahMasuk" name={t('Statistik.trenMasuk', 'Pindah Masuk')} stroke="#37AB34" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pindahKeluar" name={t('Statistik.trenKeluar', 'Pindah Keluar')} stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}
    </React.Fragment>
  );
};
