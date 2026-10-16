'use client';

import React from 'react';
import { Megaphone, Bell, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getSekilasInfo } from '@/lib/services/sekilas_info.service';
import type { SekilasInfo } from '@/types/sekilas_info';

export const InfoTicker: React.FC = () => {
  const { t } = useTranslation();

  const [announcements, setAnnouncements] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const items = await getSekilasInfo();
        if (active) {
          setAnnouncements(
            items
              .filter((i: SekilasInfo) => i.aktif)
              .map((i: SekilasInfo) => i.konten)
          );
        }
      } catch {
        if (active) setAnnouncements([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    syncWhenVisible();
    // Perbarui secara berkala tanpa polling saat tab berada di latar belakang.
    const tmr = setInterval(syncWhenVisible, 60000);
    document.addEventListener('visibilitychange', syncWhenVisible);
    return () => {
      active = false;
      clearInterval(tmr);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, []);

  const fallback = t('Home.tickerFallback') || t('Home.ticker1');
  const display = announcements.length > 0 ? announcements : [fallback];

  return (
    <div className="bg-gradient-to-r from-primary-800 via-primary-700 to-secondary-800 text-white py-3 px-4 shadow-md">
      <div className="container-desa flex items-center gap-4">
        <div className="flex items-center gap-2 bg-primary-500 text-white px-3 py-1 rounded-lg text-xs font-extrabold uppercase shrink-0 shadow">
          <Megaphone className="w-4 h-4 animate-pulse-soft" />
          <span>{t('Home.tickerBadge')}</span>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden font-medium text-xs sm:text-sm" aria-label={t('Home.tickerBadge')}>
          {loading ? (
            <div className="flex items-center gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 w-48 sm:w-64 bg-neutral-600/30 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="ticker-track">
              {[0, 1].map((group) => (
                <div className="ticker-group" key={group} aria-hidden={group === 1}>
                  {display.map((text, index) => (
                    <span key={`${group}-${index}`} className="ticker-item">
                      <Bell className="w-3.5 h-3.5 text-primary-300 shrink-0" />
                      {text}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/berita"
          className="hidden md:flex items-center gap-1 border-l border-white/15 pl-4 text-xs font-bold text-primary-300 hover:text-white transition-colors shrink-0"
        >
          {t('Home.tickerSeeAll')}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
