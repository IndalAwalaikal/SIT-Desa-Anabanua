'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ArrowRight } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Umkm } from '@/types/umkm';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface UmkmShowcaseProps {
  businesses: Umkm[];
}

export const UmkmShowcase: React.FC<UmkmShowcaseProps> = ({ businesses }) => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-white dark:bg-neutral-950 relative overflow-hidden">
      {/* Decorative backdrop glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.05] dark:opacity-[0.03] blur-3xl"
        style={{
          background: "radial-gradient(circle, #37AB34 0%, transparent 70%)",
        }}
      />
      <div className="container-desa relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-950 dark:text-primary-300 mb-3">
              <span>{t('Home.umkmBadge')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
              {t('Home.umkmTitle')}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {t('Home.umkmSubtitle')}
            </p>
          </div>

          <Link href="/umkm">
            <Button variant="outline" size="md">
              {t('Home.umkmSeeAll')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {businesses.slice(0, 4).map((item) => (
            <Card key={item.id} hoverable className="group hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-500/5 dark:hover:shadow-black/30 transition-all duration-300">
              <div className="relative h-52 w-full overflow-hidden rounded-t-2xl">
                <Image
                  src={item.foto[0]}
                  alt={item.namaUsaha}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-neutral-900 dark:text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                    {item.kategori}
                  </span>
                </div>
              </div>

              <CardBody className="p-5">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors mb-1 line-clamp-1">
                  {item.namaUsaha}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                  {t('Home.umkmOwner')} <span className="font-semibold text-neutral-700 dark:text-neutral-300">{item.pemilik}</span>
                </p>

                <div className="space-y-1.5 mb-4 text-xs text-neutral-600 dark:text-neutral-400">
                  <p className="line-clamp-2">{item.deskripsi}</p>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {item.kontak}
                  </span>
                  <Link href={`/umkm/${item.slug}`}>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white hover:underline">
                      {t('Home.umkmDetail')} →
                    </span>
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
