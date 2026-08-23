'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';

export const LanguageToggle: React.FC = () => {
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);

  const toggle = () => {
    const next = locale === 'id' ? 'en' : 'id';
    setLocale(next);
    // Mirror to a non-HttpOnly cookie so Server Components on the next request
    // can render in the same language as the client without an extra round trip.
    if (typeof document !== 'undefined') {
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `NEXT_LOCALE=${next};path=/;max-age=${oneYear};SameSite=Lax`;
    }
  };

  const isId = locale === 'id';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isId ? 'Switch to English' : 'Beralih ke Bahasa Indonesia'}
      title={isId ? 'Switch to English' : 'Beralih ke Bahasa Indonesia'}
      className={cn(
        'group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
        'border border-neutral-200 dark:border-neutral-700',
        'bg-neutral-50 dark:bg-neutral-900',
        'text-neutral-700 dark:text-neutral-300',
        'hover:border-primary-500/50 hover:bg-neutral-100 dark:hover:bg-neutral-800',
        'transition-all duration-300 hover:shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'dark:focus:ring-offset-neutral-900'
      )}
    >
      <Globe
        className={cn(
          'h-3.5 w-3.5 transition-transform duration-300',
          'text-primary-600 dark:text-primary-400',
          'group-hover:rotate-180'
        )}
      />
      <span className="hidden xs:inline">{locale === 'id' ? 'ID' : 'EN'}</span>
      <span className="sr-only">
        {isId ? 'Beralih ke Bahasa Inggris' : 'Switch to Indonesian'}
      </span>
    </button>
  );
};
