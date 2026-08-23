import { Suspense } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { PublicMasthead } from '@/components/layout/PublicMasthead';
import type { JenisSurat } from '@/types/persuratan';
import { getJenisSuratByKode } from '@/lib/services/persuratan.service';
import {
  FileText, Home, Store, Heart, CreditCard, Users,
  HeartHandshake, Baby, FileHeart, CheckCircle2, Clock,
  ArrowRight, ExternalLink,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n/useTranslation';

const iconMap: Record<string, React.ReactNode> = {
  SKD: <Home className="w-6 h-6 text-primary-600" />,
  SKU: <Store className="w-6 h-6 text-secondary-600" />,
  SKTM: <Heart className="w-6 h-6 text-rose-600" />,
  SPK: <CreditCard className="w-6 h-6 text-amber-600" />,
  SPKK: <Users className="w-6 h-6 text-indigo-600" />,
  SPN: <HeartHandshake className="w-6 h-6 text-pink-600" />,
  SKL: <Baby className="w-6 h-6 text-sky-600" />,
  SKM: <FileHeart className="w-6 h-6 text-purple-600" />,
};

interface DetailProps { params: { kode: string }; }

export const metadata = { title: 'Detail Layanan Surat' };

function JenisSuratDetailClient({ surat }: { surat: JenisSurat }) {
  const { t } = useTranslation();
  const icon = iconMap[surat.kode] || <FileText className="w-6 h-6 text-primary-600" />;

  return (
    <article className="w-full max-w-4xl mx-auto">
      <header className="text-center max-w-2xl mx-auto space-y-4 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold">
          <FileText className="w-3.5 h-3.5" />
          <span>{t('LayananDetail.eyebrow')}</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
            {icon}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <code className="px-2 py-1 bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-mono text-sm font-bold rounded">
                {surat.kode}
              </code>
              {surat.kategori && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{surat.kategori}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              {surat.nama}
            </h1>
          </div>
        </div>
        <p className="text-sm text-neutral-500 max-w-lg mx-auto">{surat.deskripsi}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: info cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estimasi */}
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{t('LayananDetail.estimation')}</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {t('LayananDetail.estimationDesc')}{' '}
              <strong className="text-neutral-900 dark:text-white">
                {surat.estimasiHari} {t('LayananDetail.workDays')}
              </strong>
            </p>
          </Card>

          {/* Persyaratan */}
          {surat.persyaratan && surat.persyaratan.length > 0 && (
            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">{t('LayananDetail.requirements')}</h2>
              <ul className="space-y-2">
                {surat.persyaratan.map((syarat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{syarat}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Form Fields */}
          {surat.formFields && surat.formFields.length > 0 && (
            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">{t('LayananDetail.requiredFields')}</h2>
              <div className="space-y-3">
                {surat.formFields.map((field) => (
                  <div key={field.name} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {field.label}
                      {field.required && <span className="text-rose-500">*</span>}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-500 text-right">
                      Tipe: {field.type}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Nomor Surat Format */}
          {surat.nomorSuratFormat && (
            <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">{t('LayananDetail.letterFormat')}</h2>
              <code className="text-sm font-mono text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-3 py-1 rounded">
                {surat.nomorSuratFormat}
              </code>
            </Card>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-600 flex items-center justify-center mx-auto mb-4">
              {icon}
            </div>
            <Badge variant={surat.aktif ? 'success' : 'neutral'} className="mb-2">
              {surat.aktif ? t('LayananDetail.statusActive') : t('LayananDetail.statusInactive')}
            </Badge>
          </Card>

          {surat.aktif && (
            <Link href={`/layanan/${surat.kode}/ajukan`}>
              <Button variant="primary" size="lg" className="w-full font-bold">
                {t('LayananDetail.applyNow')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}

          <Link href="/layanan/lacak">
            <Button variant="outline" size="sm" className="w-full font-bold">
              {t('LayananDetail.trackLetter')}
              <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </Button>
          </Link>

          <Link href="/layanan">
            <Button variant="ghost" size="sm" className="w-full">
              {t('LayananDetail.backToServices')}
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}


/**
 * Server Component — Detail halaman jenis surat.
 * Fetch data dari API di server, lalu render client component untuk interaktivitas.
 */
export default async function LayananDetailPage({ params }: DetailProps) {
  const { kode } = params;
  const surat = await getJenisSuratByKode(kode);

  if (!surat) {
    return (
      <div className="py-12 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
        <div className="container-desa">
          <Card className="w-full max-w-lg p-8 mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-3xl">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                <FileText className="w-10 h-10" />
              </div>
              <h1 className="text-xl font-black text-neutral-900 dark:text-white">Layanan Tidak Ditemukan</h1>
              <p className="text-sm text-neutral-500">
                Kode layanan <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">&quot;{kode}&quot;</code> tidak valid atau tidak tersedia.
              </p>
                            <Link href="/layanan">
                <Button variant="primary" size="sm">Lihat Semua Layanan</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
            <PublicMasthead eyebrow="Layanan Persuratan" title={surat.nama} description={surat.deskripsi} />
      <main className="py-12 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
        <div className="container-desa">
          <Suspense fallback={null}>
            <JenisSuratDetailClient surat={surat} />
          </Suspense>
        </div>
      </main>
    </>
  );
}
