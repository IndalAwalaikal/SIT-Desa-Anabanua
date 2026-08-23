'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PublicMasthead } from '@/components/layout/PublicMasthead';
import { MapPin, Navigation, Building2, Users, Map } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Dusun } from '@/types/desa';

interface WilayahClientProps {
  dusunList: Dusun[];
}

export const WilayahClient: React.FC<WilayahClientProps> = ({ dusunList }) => {
  const { t } = useTranslation();

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="container-desa space-y-12">
        <Breadcrumb
          items={[
            { label: t('Navbar.menuProfile'), href: '/profil' },
            { label: t('Navbar.menuProfileArea') },
          ]}
        />

        <PublicMasthead
          eyebrow={t('Wilayah.badge')}
          title={t('Wilayah.title')}
          description={t('Wilayah.subtitle')}
          image="/kantor_desa.png"
        />

        <div className="flex justify-center">
          <a
            href="https://maps.app.goo.gl/nSJcjAg82dk2tuLm7"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-lg shadow-primary-600/25"
          >
            <Navigation className="w-4 h-4" />
            {t('Wilayah.openMaps')}
          </a>
        </div>

        {/* Kantor Desa Photo Card */}
        <Card className="overflow-hidden border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 bg-white dark:bg-neutral-900 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-6 relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <Image
                src="/kantor_desa.png"
                alt="Kantor Desa Borong"
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="md:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5" />
                <span>Pusat Administrasi</span>
              </div>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                {t('Wilayah.officePhotoTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {t('Wilayah.officePhotoDesc')}
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                  <Map className="w-4 h-4 text-primary-500" />
                  <span>Luas: 12,5 km²</span>
                </div>
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                  <Users className="w-4 h-4 text-primary-500" />
                  <span>4 Dusun · 8 RW · 16 RT</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Dusun Section */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
              {t('Wilayah.dusunSectionTitle')}
            </h2>
            <p className="text-xs text-neutral-500">
              {t('Wilayah.dusunSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dusunList.length > 0 ? (
              dusunList.map((dusun) => (
                <Card
                  key={dusun.id}
                  className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                        DUSUN
                      </span>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                        {dusun.nama}
                      </h3>
                    </div>
                    <span className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600">
                      <MapPin className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div>
                      <span className="text-neutral-400 block">{t('Wilayah.headOfHamlet')}</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {dusun.ketua || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">{t('Wilayah.population')}</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {dusun.jumlahPenduduk ? `${dusun.jumlahPenduduk.toLocaleString()} Jiwa` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">{t('Wilayah.rtRwCount')}</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {dusun.jumlahRW || 0} RW / {dusun.jumlahRT || 0} RT
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">{t('Wilayah.area')}</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {dusun.luasWilayah || '-'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-neutral-400 text-xs">
                Data dusun sedang diperbarui.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
