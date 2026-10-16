'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PublicMasthead } from '@/components/layout/PublicMasthead';
import { MapPin, Navigation, Building2, Users, Map } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
export const WilayahClient: React.FC = () => {
  const { t } = useTranslation();
  const namaDusun = ['Banga-bangae', 'Daccipong', 'Gellengnge', 'Allejjang'];

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="container-desa space-y-12">
        <Breadcrumb
          items={[
            { label: t('Navbar.menuProfile'), href: '/profil' },
            { label: t('Navbar.menuProfileArea') },
          ]}
        />

        <PublicMasthead
          eyebrow={t('Wilayah.badge')}
          title={t('Wilayah.title')}
          description={t('Wilayah.subtitle')}
          image="/kantor_desa.png"
        />

        <div className="flex justify-center">
          <a
            href="https://www.google.com/maps/search/?api=1&query=-4.47928,119.71651"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-lg shadow-primary-600/25"
          >
            <Navigation className="w-4 h-4" />
            {t('Wilayah.openMaps')}
          </a>
        </div>

        {/* Kantor Desa Photo Card */}
        <Card className="overflow-hidden border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 bg-white dark:bg-neutral-900 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-6 relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <Image
                src="/kantor_desa.png"
                alt="Kantor Desa Anabanua"
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="md:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5" />
                <span>Pusat Administrasi</span>
              </div>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                {t('Wilayah.officePhotoTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {t('Wilayah.officePhotoDesc')}
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                  <Map className="w-4 h-4 text-primary-500" />
                  <span>Luas: ± 20 km²</span>
                </div>
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                  <Users className="w-4 h-4 text-primary-500" />
                  <span>4 Dusun · 14 RT</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">Geografi dan batas wilayah</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Ketinggian', '0–800 mdpl'],
              ['Suhu rata-rata', '20–30°C'],
              ['Curah hujan', '± 1.000 mm/tahun'],
              ['Kode wilayah', '73.11.03.2008'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4">
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="mt-1 font-bold text-neutral-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            {[
              ['Utara', 'Desa Palakka'],
              ['Selatan', 'Desa Libureng'],
              ['Timur', 'Desa Harapan'],
              ['Barat', 'Kelurahan Coppo'],
            ].map(([arah, desa]) => (
              <p key={arah} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 text-neutral-700 dark:text-neutral-300">
                <span className="block text-xs font-bold uppercase tracking-wide text-primary-700 dark:text-primary-300">{arah}</span>
                <span className="mt-1 block">{desa}</span>
              </p>
            ))}
          </div>
        </Card>

        <Card className="p-6 sm:p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">Fasilitas Kampung KB</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">Desa Anabanua tercatat sebagai Kampung Keluarga Berencana dengan kelompok dan sarana berikut:</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-neutral-700 dark:text-neutral-300">
            {['Bina Keluarga Balita (BKB)', 'Bina Keluarga Remaja (BKR)', 'Usaha Peningkatan Pendapatan Keluarga Akseptor (UPPKA)', 'Pusat Informasi dan Konseling Remaja (PIK-R)', 'Sekretariat Kampung KB', 'Rumah Data Kependudukan Kampung KB'].map((item) => (
              <li key={item} className="rounded-xl bg-primary-50/70 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900 p-4">{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 sm:p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">Demografi Kampung KB</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">Angka berikut berasal dari data Kampung KB (BKKBN) yang disampaikan untuk profil desa.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ['Jumlah jiwa', '2.419'],
              ['Kepala keluarga', '633'],
              ['Pasangan usia subur', '341'],
              ['PUS ber-KB', '273'],
              ['PUS tidak ber-KB', '68'],
              ['Keluarga dengan balita', '147'],
              ['Keluarga dengan remaja', '393'],
              ['Keluarga dengan lansia', '198'],
              ['Jumlah remaja', '12'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4">
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="mt-1 text-xl font-extrabold text-primary-700 dark:text-primary-300">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">Sumber lain yang disebutkan, Wikipedia pertengahan 2021, memperkirakan penduduk sekitar 2.200 jiwa. Angka itu berasal dari periode dan sumber berbeda, sehingga ditampilkan terpisah.</p>
        </Card>

        <Card className="p-6 sm:p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">Sekolah dan lembaga pendidikan</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700"><tr><th className="py-3 pr-4">Nama</th><th className="py-3 pr-4">Dusun</th><th className="py-3 pr-4">Status</th><th className="py-3">Akreditasi</th></tr></thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {[
                  ['UPTD SD Negeri 27 Barru', 'Banga-bangae', 'Negeri', 'B'],
                  ['UPTD SD Negeri 30 Barru', 'Gellengnge', 'Negeri', 'C'],
                  ['UPTD SD Negeri 31 Barru', 'Allejjang', 'Negeri', 'C'],
                  ['MIS DDI Banga-Banga', 'Daccipong', 'Swasta (Kemenag)', '—'],
                  ['UPTD SMP Negeri SATAP 4 Barru', 'Banga-bangae', 'Negeri', 'B'],
                  ['KB Abadi Banga-Banga', 'Banga-bangae', 'Kelompok Bermain / PAUD', '—'],
                ].map(([nama, dusun, status, akreditasi]) => (
                  <tr key={nama}><td className="py-3 pr-4 font-semibold text-neutral-900 dark:text-white">{nama}</td><td className="py-3 pr-4">{dusun}</td><td className="py-3 pr-4">{status}</td><td className="py-3">{akreditasi}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">MIS DDI Banga-Banga didirikan pada 1 Desember 1986. SMP Negeri SATAP 4 Barru mengintegrasikan layanan SMP dengan SD. Kampus Lapangan Geologi Universitas Hasanuddin juga berada di desa ini sebagai fasilitas praktik lapangan, bukan sekolah formal.</p>
        </Card>

        {/* Dusun Section */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
              {t('Wilayah.dusunSectionTitle')}
            </h2>
            <p className="text-xs text-neutral-500">
              {t('Wilayah.dusunSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {namaDusun.map((nama) => (
                <Card
                  key={nama}
                  className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                        DUSUN
                      </span>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                        Dusun {nama}
                      </h3>
                    </div>
                    <span className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-600">
                      <MapPin className="w-5 h-5" />
                    </span>
                  </div>

                </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
