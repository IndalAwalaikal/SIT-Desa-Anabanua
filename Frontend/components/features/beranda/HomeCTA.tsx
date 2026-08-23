'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const HomeCTA: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-gradient-to-r from-primary-900 via-primary-800 to-secondary-950 text-white relative overflow-hidden on-dark">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-600/20 via-transparent to-transparent pointer-events-none" />
      <div className="container-desa relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('Home.ctaBadge')}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {t('Home.ctaTitle')}
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {t('Home.ctaDesc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <Link href="/pengaduan">
            <Button variant="primary" size="lg" className="font-extrabold shadow-xl">
              <MessageSquare className="w-5 h-5" />
              {t('Home.ctaComplaint')}
            </Button>
          </Link>
          <Link href="/kontak">
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
              {t('Home.ctaContact')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
