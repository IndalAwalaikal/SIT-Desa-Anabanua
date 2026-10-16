'use client';

import React from 'react';
import Link from 'next/link';
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
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { JenisSurat } from '@/types/persuratan';
import { useTranslation } from '@/lib/i18n/useTranslation';

const iconMap: Record<string, React.ReactNode> = {
  SKD: <Home className="w-6 h-6 text-primary-600" />,
  SKU: <Store className="w-6 h-6 text-secondary-600" />,
  SKTM: <Heart className="w-6 h-6 text-primary-600" />,
  SPK: <CreditCard className="w-6 h-6 text-secondary-600" />,
  SPKK: <Users className="w-6 h-6 text-primary-600" />,
  SPN: <HeartHandshake className="w-6 h-6 text-secondary-600" />,
  SKL: <Baby className="w-6 h-6 text-primary-600" />,
  SKM: <FileHeart className="w-6 h-6 text-secondary-600" />,
};

interface QuickServicesProps {
  services: JenisSurat[];
}

export const QuickServices: React.FC<QuickServicesProps> = ({ services }) => {
  const { t } = useTranslation();
  const popularServices = services.slice(0, 6);

  return (
    <section className="py-20 bg-neutral-50 dark:bg-neutral-900/60">
      <div className="container-desa">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-950 dark:text-primary-300 mb-3">
              <span>{t('Home.qsBadge')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
              {t('Home.qsTitle')}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {t('Home.qsSubtitle')}
            </p>
          </div>

          <Link href="/layanan">
            <Button variant="outline" size="md">
              {t('Home.qsSeeAll')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularServices.map((surat) => (
            <Card
              key={surat.kode}
              hoverable
              className="group hover:border-primary-500/40"
            >
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {iconMap[surat.kode] || <FileText className="w-6 h-6 text-primary-600" />}
                  </div>
                  <span className="text-xs font-extrabold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950 px-2.5 py-1 rounded-full">
                    {surat.kode}
                  </span>
                </div>

                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors">
                  {surat.nama}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4 line-clamp-2">
                  {surat.deskripsi}
                </p>

                <div className="space-y-2 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 mb-6">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{t('Home.qsRequirements')}</p>
                  <ul className="space-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                    {surat.persyaratan.slice(0, 2).map((syarat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span>{syarat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-medium text-neutral-400">
                    {t('Home.qsEstimate')} {surat.estimasiHari} {t('Home.qsDays')}
                  </span>
                  <Link href={`/layanan/${surat.kode}/ajukan`}>
                    <Button variant="primary" size="sm">
                      {t('Home.qsApply')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
