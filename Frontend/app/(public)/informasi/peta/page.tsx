'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import {
  MapPin,
  Navigation,
  School,
  Building2,
  Hospital,
  Trees,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

// Leaflet & react-leaflet butuh window -> hanya dimuat di client (SSR: false).
const MapView = dynamic(() => import('@/components/features/informasi/MapView'), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full w-full min-h-[440px] items-center justify-center bg-neutral-100 text-neutral-400 dark:bg-neutral-900">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span className="ml-2 text-sm font-semibold">{t('Peta.loading')}</span>
    </div>
  );
}

const WARN_COLOR: Record<string, string> = {
  Pemerintahan: '#247623',
  Pendidikan: '#0d9488',
  Kesehatan: '#dc2626',
  Pariwisata: '#f59e0b',
};

const CATEGORY_KEY: Record<string, string> = {
  Pemerintahan: 'Peta.pemerintahan',
  Pendidikan: 'Peta.pendidikan',
  Kesehatan: 'Peta.kesehatan',
  Pariwisata: 'Peta.pariwisata',
};

interface Fasilitas {
  id: string;
  nama: string;
  kategori: string;
  lat: number;
  lng: number;
  icon: React.ReactNode;
}

const ALL_FASILITAS: Fasilitas[] = [
  {
    id: 'kantor-desa',
    nama: 'Kantor Desa Anabanua',
    kategori: 'Pemerintahan',
    lat: -4.47928,
    lng: 119.71651,
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    id: 'sd-negeri-1',
    nama: 'SD Negeri 1 Anabanua',
    kategori: 'Pendidikan',
    lat: -4.4805,
    lng: 119.718,
    icon: <School className="w-5 h-5" />,
  },
  {
    id: 'pustu',
    nama: 'Puskesmas Pembantu (Pustu)',
    kategori: 'Kesehatan',
    lat: -4.4785,
    lng: 119.7152,
    icon: <Hospital className="w-5 h-5" />,
  },
  {
    id: 'ekowisata-kopi',
    nama: 'Agrowisata Kopi Anabanua',
    kategori: 'Pariwisata',
    lat: -4.4735,
    lng: 119.7208,
    icon: <Trees className="w-5 h-5" />,
  },
];

export default function PetaPage() {
  const { t } = useTranslation();
  const [kategori, setKategori] = useState('semua');

  const kategoriList = ['semua', ...Array.from(new Set(ALL_FASILITAS.map((f) => f.kategori)))];
  const filtered =
    kategori === 'semua'
      ? ALL_FASILITAS
      : ALL_FASILITAS.filter((f) => f.kategori === kategori);

  const mapData = useMemo(
    () =>
      filtered.map((f) => ({
        id: f.id,
        nama: f.nama,
        kategori: f.kategori,
        lat: f.lat,
        lng: f.lng,
      })),
    [filtered],
  );

  const kategoriLabel = (k: string) =>
    k === 'semua' ? t('Peta.semua') : t(CATEGORY_KEY[k] ?? k, k);

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="container-desa space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold">
            <MapPin className="w-3.5 h-3.5" />
            <span>{t('Peta.eyebrow')}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            {t('Peta.title')}
          </h1>
          <p className="text-sm text-neutral-500">
            {t('Peta.subtitle1')}{' '}
            <a
              href="https://barrukab.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
            >
              {t('Peta.kabupaten')}
            </a>
            {t('Peta.subtitle2')}
          </p>
        </div>

        {/* ===== Map ===== */}
        <Card className="overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xl">
          <div className="relative w-full h-[440px] sm:h-[480px]">
            <MapView fasilitas={mapData} />
            {/* Kartu info overlay kiri-atas */}
            <div className="pointer-events-none absolute top-4 left-4 z-[1000] hidden sm:block">
              <div className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg border border-neutral-200 dark:bg-neutral-900/95 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                  <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                    {t('Peta.namaDesa')}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                  {filtered.length} {t('Peta.lokasi')} • {t('Peta.klikPin')}
                </p>
              </div>
            </div>
            {/* Tombol buka Google Maps overlay kanan-atas */}
            <a
              href="https://www.google.com/maps/search/?api=1&query=-4.47928,119.71651"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 z-[1000] inline-flex items-center gap-2 rounded-full bg-neutral-950/85 text-white text-xs font-bold px-4 py-2.5 shadow-lg backdrop-blur-md transition-colors hover:bg-primary-700"
            >
              <Navigation className="w-4 h-4 text-primary-400" />
              {t('Peta.bukaGmaps')}
            </a>
          </div>
        </Card>

        {/* ===== Legend + Filter ===== */}
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {(['Pemerintahan', 'Pendidikan', 'Kesehatan', 'Pariwisata'] as const).map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 px-3 py-1.5 bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: WARN_COLOR[k] }} />
                  {kategoriLabel(k)}
                </span>
              ))}
            </div>
            <span className="hidden sm:block h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex flex-wrap gap-2">
              {kategoriList.map((item) => (
                <button
                  key={item}
                  onClick={() => setKategori(item)}
                  className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition-colors ${
                    kategori === item
                      ? 'bg-primary-700 text-white shadow-md'
                      : 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-primary-400 hover:text-primary-700'
                  }`}
                >
                  {kategoriLabel(item)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ===== Fasilitas Grid ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((f) => (
            <Card
              key={f.id}
              className="p-5 space-y-3 border border-neutral-200 dark:border-neutral-800 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: WARN_COLOR[f.kategori] }}
                >
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{f.nama}</h4>
                  <p className="text-xs text-neutral-500">{kategoriLabel(f.kategori)}</p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:underline"
              >
                <MapPin className="w-3.5 h-3.5" />
                {t('Peta.bukaGmaps')}
              </a>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
