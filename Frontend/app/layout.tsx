import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppChrome } from '@/components/layout/AppChrome';
import { Footer } from '@/components/layout/Footer';
import { AutoRefreshListener } from '@/components/layout/AutoRefreshListener';
import { getServerLocale } from '@/lib/i18n/server';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Desa Anabanua | Sistem Informasi & Layanan Terintegrasi',
    template: '%s | Desa Anabanua Digital',
  },
  description:
    'Portal informasi resmi, transparansi anggaran APBDes, layanan persuratan online, dan direktori UMKM Desa Anabanua, Kecamatan Barru, Kabupaten Barru, Sulawesi Selatan.',
  keywords: [
    'Desa Anabanua',
    'Barru',
    'Barru',
    'Desa Digital',
    'Surat Online Desa',
    'Desa Anabanua Barru',
    'APBDes Anabanua',
    'Layanan Desa',
  ],
  authors: [{ name: 'Pemerintah Desa Anabanua' }],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://desaanabanua.barrukab.go.id',
    title: 'Website Resmi Desa Anabanua - Barru',
    description: 'Portal layanan publik dan informasi resmi Desa Anabanua',
    siteName: 'Desa Anabanua Digital',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://desaanabanua.barrukab.go.id'}/kantor_desa_og.jpg`,
        width: 1200,
        height: 630,
        alt: 'Kantor Desa Anabanua, Kecamatan Barru, Kabupaten Barru',
      },
    ],
  },
  // Ikon / tab logo agar tampil di header browser dan saat PWA dipasang.
  // Versi kecil per ukuran (bukan satu file 710KB) agar hemat bandwidth.
  icons: {
    icon: '/favicon-32x32.png',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Desa Anabanua',
  },
};

export const viewport: Viewport = {
  themeColor: '#37AB34',
};

import { ToastContainer } from '@/components/ui/ToastContainer';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getServerLocale();
  return (
    <html lang={lang} suppressHydrationWarning className={`${plusJakartaSans.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('desa-anabanua-ui');
                if (stored) {
                  const state = JSON.parse(stored).state;
                  if (state && state.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (state && state.theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  }
                } else {
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  if (systemTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans antialiased">
        <AppChrome footer={<Footer />}>{children}</AppChrome>
        <ToastContainer />
        <AutoRefreshListener />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
