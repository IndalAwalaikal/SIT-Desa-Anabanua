'use client';

import React from 'react';
import Link from 'next/link';
import type { JenisSurat } from '@/types/persuratan';
import type { ProfilDesa } from '@/types/desa';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  Home,
  Store,
  Heart,
  CreditCard,
  Users,
  HeartHandshake,
  Baby,
  FileHeart,
  Search,
  CheckCircle2,
  ArrowRight,
  Clock,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const iconMap: Record<string, React.ReactNode> = {
  SKD: <Home className="w-6 h-6 text-primary-600" />,
  SKU: <Store className="w-6 h-6 text-secondary-600" />,
  SKTM: <Heart className="w-6 h-6 text-rose-600" />,
  SPK: <CreditCard className="w-6 h-6 text-amber-600" />,
  SPKK: <Users className="w-6 h-6 text-emerald-600" />,
  SPN: <HeartHandshake className="w-6 h-6 text-pink-600" />,
  SKL: <Baby className="w-6 h-6 text-sky-600" />,
  SKM: <FileHeart className="w-6 h-6 text-teal-600" />,
};

interface LayananClientProps {
  jenisSuratList: JenisSurat[];
  profil: ProfilDesa;
}

export const LayananClient: React.FC<LayananClientProps> = ({ jenisSuratList, profil }) => {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('Semua');

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    set.add('Semua');
    jenisSuratList.forEach((s) => {
      if (s.kategori) set.add(s.kategori);
    });
    return Array.from(set);
  }, [jenisSuratList]);

  const filteredSurat = React.useMemo(() => {
    return jenisSuratList.filter((s) => {
      const matchSearch =
        !search ||
        s.kode.toLowerCase().includes(search.toLowerCase()) ||
        s.nama.toLowerCase().includes(search.toLowerCase()) ||
        s.deskripsi.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'Semua' || s.kategori === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [jenisSuratList, search, selectedCategory]);

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <div className="container-desa space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold">
            <span>SISTEM PERSURATAN TERPADU DESA ANABANUA</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Layanan Permohonan Surat Online
          </h1>
          <p className="text-sm text-neutral-500">
            Pilih dari 100+ jenis surat administrasi desa. Ajukan permohonan secara mandiri dari mana saja.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="space-y-4 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="relative">
            <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari jenis surat (contoh: Domisili, SKU, SKTM, Tanah, Nikah, Ternak)..."
              className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lacak Resi Quick Banner */}
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-secondary-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold">{t('Layanan.trackBannerTitle')}</h3>
            <p className="text-xs text-primary-200">
              {t('Layanan.trackBannerDesc')}
            </p>
          </div>
          <Link href="/layanan/lacak">
            <Button variant="accent" size="lg" className="font-extrabold shadow-lg text-neutral-950">
              <Search className="w-5 h-5" />
              {t('Layanan.trackButton')}
            </Button>
          </Link>
        </div>

        {/* Jam Layanan & Kontak Cepat */}
        <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
            <div className="flex items-center gap-3 shrink-0">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-600/10 text-primary-600 dark:text-primary-400">
                <Clock className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Jam Layanan Kantor
                </p>
                <p className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
                  {profil.jamLayanan}
                </p>
              </div>
            </div>

            <div className="hidden md:block h-10 w-px bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 text-xs font-semibold">
              <a
                href={`tel:${profil.telepon}`}
                className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:text-primary-600 transition-colors"
                aria-label={`Telepon kantor desa: ${profil.telepon}`}
              >
                <Phone className="w-4 h-4 text-primary-600 shrink-0" aria-hidden="true" />
                <span className="truncate">{profil.telepon}</span>
              </a>
              <a
                href={`mailto:${profil.email}`}
                className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:text-primary-600 transition-colors"
                aria-label={`Email kantor desa: ${profil.email}`}
              >
                <Mail className="w-4 h-4 text-primary-600 shrink-0" aria-hidden="true" />
                <span className="truncate">{profil.email}</span>
              </a>
              <span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                <MapPin className="w-4 h-4 text-primary-600 shrink-0" aria-hidden="true" />
                <span className="truncate">{profil.alamatKantor}</span>
              </span>
            </div>
          </div>
        </Card>

        {/* Dynamic Grid 100+ Jenis Surat */}
        {filteredSurat.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <p className="text-neutral-500 text-sm font-medium">
              Tidak ada jenis surat yang cocok dengan kriteria pencarian &quot;{search}&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSurat.map((surat) => (
              <Card key={surat.kode} hoverable className="group flex flex-col justify-between">
                <CardBody className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {iconMap[surat.kode] || <FileText className="w-6 h-6 text-primary-600" />}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-extrabold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950 px-2.5 py-0.5 rounded-full border border-primary-200 dark:border-primary-800">
                          {surat.kode}
                        </span>
                        {surat.kategori && (
                          <span className="text-[10px] text-neutral-400 font-medium">
                            {surat.kategori}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors">
                      {surat.nama}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                      {surat.deskripsi}
                    </p>

                    <div className="space-y-2 pt-4 border-t border-neutral-100 dark:border-neutral-800 mb-6">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{t('Layanan.syariat')}</p>
                      <ul className="space-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                        {Array.isArray(surat.persyaratan) && surat.persyaratan.map((syarat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{syarat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{surat.estimasiHari} hari</span>
                    </div>

                    <Link href={`/layanan/${surat.kode}/ajukan`}>
                      <Button variant="primary" size="sm" className="font-bold">
                        {t('Layanan.apply')} <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

