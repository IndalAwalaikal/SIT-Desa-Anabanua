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
    default: 'Desa Borong | Sistem Informasi & Layanan Terintegrasi',
    template: '%s | Desa Borong Digital',
  },
  description:
    'Portal informasi resmi, transparansi anggaran APBDes, layanan persuratan online, dan direktori UMKM Desa Borong, Kecamatan Herlang, Kabupaten Bulukumba, Sulawesi Selatan.',
  keywords: [
    'Desa Borong',
    'Bulukumba',
    'Herlang',
    'Desa Digital',
    'Surat Online Desa',
    'Desa Borong Herlang',
    'APBDes Borong',
    'Layanan Desa',
  ],
  authors: [{ name: 'Pemerintah Desa Borong' }],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://desaborong.bulukumbakab.go.id',
    title: 'Website Resmi Desa Borong - Bulukumba',
    description: 'Portal layanan publik dan informasi resmi Desa Borong',
    siteName: 'Desa Borong Digital',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://desaborong.bulukumbakab.go.id'}/kantor_desa.png`,
        width: 1200,
        height: 630,
        alt: 'Kantor Desa Borong, Kecamatan Herlang, Kabupaten Bulukumba',
      },
    ],
  },
  // Ikon / tab logo agar tampil di header browser dan saat PWA dipasang.
  // Menggunakan icon_pwa_app.png yang sama dengan manifest.json agar konsisten.
  icons: {
    icon: '/icon_pwa_app.png',
    shortcut: '/icon_pwa_app.png',
    apple: '/icon_pwa_app.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Desa Borong',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f4c81',
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
                const stored = localStorage.getItem('desa-borong-ui');
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
