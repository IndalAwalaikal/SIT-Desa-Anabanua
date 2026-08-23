'use client';

import React from 'react';
import Link from 'next/link';
import { PublicMasthead } from '@/components/layout/PublicMasthead';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { MapPin, Phone, Mail, Globe, Clock, Navigation, MessageSquare, HelpCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { ProfilDesa } from '@/types/desa';

interface KontakClientProps {
  profil: ProfilDesa | null;
}

export const KontakClient: React.FC<KontakClientProps> = ({ profil }) => {
  const { t } = useTranslation();

  const alamat = profil?.alamatKantor || 'Jl. Poros Borong – Herlang, Desa Borong, Kec. Herlang, Kab. Bulukumba';
  const telepon = profil?.telepon || '+62 811-4000-xxxx';
  const email = profil?.email || 'admin@desaborong.id';
  const jamLayanan = profil?.jamLayanan || 'Senin–Jumat, 08.00–16.00 WITA';

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="container-desa space-y-10">
        <Breadcrumb items={[{ label: t('Kontak.breadcrumb') }]} />

        <PublicMasthead
          eyebrow={t('Kontak.badge')}
          title={t('Kontak.title')}
          description={t('Kontak.subtitle')}
          image="/kantor_desa.png"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md space-y-6">
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                {t('Kontak.officeTitle')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                    {t('Kontak.addressLabel')}
                  </span>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    {alamat}
                  </p>
                  <a
                    href="https://maps.app.goo.gl/nSJcjAg82dk2tuLm7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline pt-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    {t('Kontak.mapButton')}
                  </a>
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                    {t('Kontak.phoneLabel')}
                  </span>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary-600 shrink-0" />
                    {telepon}
                  </p>
                  <span className="text-xs text-neutral-500 block pt-1">
                    WhatsApp &amp; Call Center Resmi
                  </span>
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                    {t('Kontak.emailLabel')}
                  </span>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary-600 shrink-0" />
                    {email}
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 block">
                    {t('Kontak.hoursLabel')}
                  </span>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-600 shrink-0" />
                    {jamLayanan}
                  </p>
                </div>
              </div>
            </Card>

            {/* Google Maps Embed Simulation / Card */}
            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md space-y-4">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary-600" />
                Peta &amp; Petunjuk Lokasi Kantor Desa
              </h3>
              <div className="w-full h-72 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 relative bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
                <div className="text-center p-6 space-y-3">
                  <MapPin className="w-10 h-10 text-primary-600 mx-auto animate-bounce" />
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Kantor Pemerintah Desa Borong
                  </p>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Kecamatan Herlang, Kabupaten Bulukumba, Sulawesi Selatan 92572
                  </p>
                  <a
                    href="https://maps.app.goo.gl/nSJcjAg82dk2tuLm7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <Navigation className="w-4 h-4" /> Buka di Google Maps ↗
                  </a>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Quick Action */}
          <div className="space-y-6">
            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {t('Kontak.sendMsgTitle')}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {t('Kontak.sendMsgDesc')}
              </p>
              <div className="pt-2 space-y-3">
                <Link
                  href="/pengaduan"
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-xs font-bold hover:bg-primary-100 transition-colors"
                >
                  <span>Kirim Laporan / Pengaduan</span>
                  →
                </Link>
                <Link
                  href="/layanan"
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-200 transition-colors"
                >
                  <span>Ajukan Surat Online</span>
                  →
                </Link>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-primary-600 font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>{t('Kontak.faqPrompt')}</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Pertanyaan seputar syarat pembuatan surat, jam operasional, dan transparansi anggaran.
              </p>
              <Link
                href="/faq"
                className="inline-block text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline pt-1"
              >
                {t('Kontak.faqLink')} →
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
