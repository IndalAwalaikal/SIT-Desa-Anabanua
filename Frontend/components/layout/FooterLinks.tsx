'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const FooterLinks = () => {
  const { t } = useTranslation();

  return (
    <>
      {/* Col 2: Navigasi Cepat */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-l-4 border-primary-500 pl-3">
          Navigasi Utama
        </h4>
        <ul className="space-y-2 text-xs">
          {[
            { href: '/profil', label: t('Navbar.menuProfile') },
            { href: '/profil/struktur-organisasi', label: 'Struktur Perangkat Desa' },
            { href: '/informasi/statistik', label: t('Navbar.menuInformationStatistik') },
            { href: '/informasi/apbdes', label: t('Navbar.menuInformationApbdes') },
            { href: '/informasi/pajak', label: t('Navbar.menuInformationPajak') },
            { href: '/informasi/peta', label: t('Navbar.menuInformationPeta') },
            { href: '/informasi/sembako', label: t('Navbar.menuInformationSembako') },
            { href: '/galeri', label: t('Navbar.menuNewsGallery') },
            { href: '/umkm', label: t('Navbar.menuNewsUmkm') },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex items-center gap-2 hover:text-primary-400 transition-colors text-neutral-400 hover:translate-x-1 duration-200">
                <ChevronRight className="w-3 h-3 text-primary-500" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Col 3: Layanan Persuratan */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider border-l-4 border-primary-500 pl-3">
          Layanan Warga
        </h4>
        <ul className="space-y-2 text-xs">
          {[
            { href: '/layanan', label: 'Layanan Pengajuan Surat' },
            { href: '/layanan/SKU/ajukan', label: 'Surat Keterangan Usaha (SKU)' },
            { href: '/layanan/SKTM/ajukan', label: 'Surat Keterangan Tidak Mampu' },
            { href: '/layanan/SPK/ajukan', label: 'Surat Pengantar KTP' },
            { href: '/layanan/lacak', label: t('Navbar.menuServicesTrack') },
            { href: '/faq', label: t('Navbar.menuServicesFaq') },
            { href: '/pengaduan', label: t('Navbar.menuServicesComplaints') },
            { href: '/kontak', label: t('Navbar.menuContact') },
            { href: '/login', label: t('Navbar.loginWarga') },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex items-center gap-2 hover:text-primary-400 transition-colors text-neutral-400 hover:translate-x-1 duration-200">
                <ChevronRight className="w-3 h-3 text-primary-500" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
