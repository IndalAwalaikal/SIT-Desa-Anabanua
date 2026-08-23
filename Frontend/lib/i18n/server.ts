import { cookies, headers } from 'next/headers';
import idMessages from '@/messages/id.json';
import enMessages from '@/messages/en.json';
import type { Locale } from '@/store/uiStore';

const messages: Record<Locale, Record<string, unknown>> = {
  id: idMessages as Record<string, unknown>,
  en: enMessages as Record<string, unknown>,
};

/**
 * Resolve locale to use on the server (Next.js 15 async cookies & headers).
 */
export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const fromCookie = cookieStore.get('NEXT_LOCALE')?.value;
    if (fromCookie === 'id' || fromCookie === 'en') return fromCookie;

    const headerStore = await headers();
    const accept = headerStore.get('accept-language') || '';
    if (/en/i.test(accept) && !/id/i.test(accept)) return 'en';
  } catch {
    // cookies()/headers() can throw in non-request contexts
  }
  return 'id';
}

/**
 * Server-side translation helper. Note: since this is sync, we use default 'id' or cache.
 * For Server Components, we can also use getServerLocale() if awaited.
 */
export function getServerT(): (path: string, fallback?: string) => string {
  // Default to 'id' for synchronous server renders, overridden by client locale store on hydration.
  const locale: Locale = 'id';
  return (path: string, fallback?: string) => {
    const buckets = [messages[locale], messages.id];
    const keys = path.split('.');
    for (const bucket of buckets) {
      let value: unknown = bucket;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
          value = (value as Record<string, unknown>)[key];
        } else {
          value = undefined;
          break;
        }
      }
      if (typeof value === 'string') return value;
    }
    return fallback ?? path;
  };
}
