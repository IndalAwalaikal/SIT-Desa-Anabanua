/**
 * Locale-aware formatting helpers — satu sumber untuk format angka & tanggal
 * agar konsisten dengan locale aktif (id-ID / en-US).
 *
 * Dipakai komponen client via useTranslation().locale; di server component
 * gunakan getServerLocale() lalu panggil helper ini dengan locale tersebut.
 */

export type Locale = 'id' | 'en';

export function intlLocale(locale: string | undefined): string {
  return locale === 'en' ? 'en-US' : 'id-ID';
}

export function formatNumber(value: number, locale: string | undefined, opts?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(intlLocale(locale), opts);
}

export function formatDate(
  iso: string | Date | undefined,
  locale: string | undefined,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(intlLocale(locale), opts);
  } catch {
    return '';
  }
}

export function formatRupiah(value: number, locale: string | undefined): string {
  return value.toLocaleString(intlLocale(locale), { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
}
