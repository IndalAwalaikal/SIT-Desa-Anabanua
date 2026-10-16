'use client';

import Link from 'next/link';
import { PublicMasthead } from '@/components/layout/PublicMasthead';
import { Card } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';

const sectionClass = 'p-7 sm:p-9 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-md space-y-4';
const eyebrowClass = 'text-[11px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400 block';
const paragraphClass = 'text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed';

export function SejarahClient() {
  return (
    <div className="bg-[#f5f8f4] py-8 sm:py-12 dark:bg-neutral-950">
      <div className="container-desa space-y-8 sm:space-y-12">
        <PublicMasthead
          eyebrow="SEJARAH DESA"
          title="Sejarah dan Asal Usul Desa Anabanua"
          description="Perjalanan Desa Anabanua, dari pemekaran Desa Palakka hingga menjadi desa definitif di Kecamatan Barru."
          image="/kantor_desa.png"
        />

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] items-start">
          <aside className="space-y-5 lg:sticky lg:top-24">
            <Link href="/profil" className="inline-flex items-center gap-2 text-xs font-bold text-primary-700 dark:text-primary-400 hover:underline bg-white dark:bg-neutral-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Profil Desa
            </Link>
            <Card className="p-5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">Daftar Isi</p>
              <nav className="mt-3 flex flex-col gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400">
                <a href="#pembentukan" className="hover:text-primary-600">Pembentukan desa</a>
                <a href="#nama" className="hover:text-primary-600">Asal nama</a>
                <a href="#kepala-desa" className="hover:text-primary-600">Kepala desa</a>
                <a href="#budaya" className="hover:text-primary-600">Budaya dan mata pencaharian</a>
              </nav>
            </Card>
          </aside>

          <article className="space-y-7">
            <Card id="pembentukan" className={sectionClass}>
              <span className={eyebrowClass}>SEJARAH PEMBENTUKAN</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">Pemekaran dari Desa Palakka</h2>
              <p className={paragraphClass}>Desa Anabanua merupakan hasil pemekaran dari Desa Palakka di Kecamatan Barru. Pemekaran dilakukan karena jangkauan wilayah Desa Palakka saat itu terlalu luas, sehingga pelayanan pemerintahan, pembangunan, dan pengawasan sulit menjangkau seluruh wilayah.</p>
              <ol className="grid gap-3 sm:grid-cols-3">
                {[
                  ['1990', 'Desa Persiapan Latuttu dibentuk dan dipimpin Haruna, kepala desa dari Desa Palakka.'],
                  ['1993', 'Desa Persiapan Latuttu memperoleh status desa definitif.'],
                  ['1994', 'Pemilihan kepala desa pertama dimenangkan Marhaeni, yang sebelumnya menjabat Sekretaris Desa.'],
                ].map(([year, detail]) => (
                  <li key={year} className="rounded-2xl border border-primary-100 bg-primary-50/70 p-5 dark:border-primary-900 dark:bg-primary-950/40">
                    <span className="text-lg font-black text-primary-700 dark:text-primary-300">{year}</span>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{detail}</p>
                  </li>
                ))}
              </ol>
            </Card>

            <Card id="nama" className={sectionClass}>
              <span className={eyebrowClass}>ASAL USUL NAMA</span>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Makna nama Anabanua</h2>
              <p className={paragraphClass}>Nama Anabanua memiliki dua penjelasan yang dikenal masyarakat. Pertama, nama ini dibentuk dari nama dua dusun awal, Allejjang dan Banga-bangae. Kedua, secara harfiah dimaknai sebagai “anak dari kampung”, yang menggambarkan Anabanua sebagai desa hasil pemekaran dari desa induknya, Palakka.</p>
            </Card>

            <Card id="kepala-desa" className={sectionClass}>
              <span className={eyebrowClass}>PEMERINTAHAN DESA</span>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Kepala Desa Anabanua</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-sm">
                  <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700"><tr><th className="py-3 pr-4">Nama</th><th className="py-3 pr-4">Periode</th><th className="py-3">Keterangan</th></tr></thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <tr><td className="py-3 pr-4 font-semibold">Haruna</td><td className="py-3 pr-4">1990–1994</td><td className="py-3">Kepala Desa Persiapan, berasal dari Desa Palakka</td></tr>
                    <tr><td className="py-3 pr-4 font-semibold">Marhaeni</td><td className="py-3 pr-4">1994–2002</td><td className="py-3">Kepala desa definitif pertama</td></tr>
                    <tr><td className="py-3 pr-4 font-semibold">Sahnun.M</td><td className="py-3 pr-4">2002–2014</td><td className="py-3">Kepala Desa Anabanua</td></tr>
                    <tr><td className="py-3 pr-4 font-semibold">Data belum tersedia</td><td className="py-3 pr-4">2014–2022</td><td className="py-3">Nama dan rincian periode belum tersedia</td></tr>
                    <tr><td className="py-3 pr-4 font-semibold">Syamsuryadi, A.Md</td><td className="py-3 pr-4">25 Okt–19 Des 2022</td><td className="py-3">Penjabat sementara (PLH)</td></tr>
                    <tr><td className="py-3 pr-4 font-semibold">Faharuddin</td><td className="py-3 pr-4">2023–2029</td><td className="py-3">Kepala desa definitif</td></tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <Card id="budaya" className={sectionClass}>
              <span className={eyebrowClass}>BUDAYA DAN MATA PENCAHARIAN</span>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Pertanian dan tradisi Maddoja Bine</h2>
              <p className={paragraphClass}>Pertanian menjadi mata pencaharian utama warga. Komoditas yang disebutkan meliputi padi, kakao, dan kopi. Sebagian lahan di Dusun Banga-bangae dikelola Kelompok Tani Hutan (KTH), antara lain untuk budidaya kakao dan kopi.</p>
              <p className={paragraphClass}>Maddoja Bine merupakan tradisi begadang bersama untuk menjaga benih padi sebelum musim tanam. Tradisi ini menjadi bagian dari warisan budaya pertanian masyarakat Bugis-Makassar di Anabanua.</p>
            </Card>
          </article>
        </div>
      </div>
    </div>
  );
}
