'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getBeritaList } from '@/lib/services/berita.service';
import { getUmkmList } from '@/lib/services/umkm.service';
import { getJenisSuratList } from '@/lib/services/persuratan.service';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { formatTanggal } from '@/lib/utils/format';
import { Search, Newspaper, Store, FileText, X, ArrowRight, Sparkles } from 'lucide-react';
import type { Berita } from '@/types/berita';
import type { Umkm } from '@/types/umkm';
import type { JenisSurat } from '@/types/persuratan';
import { useTranslation } from '@/lib/i18n/useTranslation';

function sectionTitle(label: string, icon: React.ReactNode, count: number) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
        {icon}
        {label}
      </h2>
      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
        {count}
      </span>
    </div>
  );
}

function CariContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get('q') || '';

  const [beritas, setBeritas] = useState<Berita[]>([]);
  const [umkms, setUmkms] = useState<Umkm[]>([]);
  const [surats, setSurats] = useState<JenisSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initial);

  useEffect(() => {
    Promise.all([
      getBeritaList({ page: 1, perPage: 100 }),
      getUmkmList(),
      getJenisSuratList(),
    ])
      .then(([bData, umkmData, suratData]) => {
        setBeritas(bData.data);
        setUmkms(umkmData);
        setSurats(suratData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const hasQuery = q.length > 0;

  const qBerita = useMemo(() => {
    if (!hasQuery) return [];
    return beritas.filter((b) =>
      [b.judul, b.ringkasan, b.penulis, b.kategori, ...(b.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [beritas, q, hasQuery]);

  const qUmkm = useMemo(() => {
    if (!hasQuery) return [];
    return umkms.filter((u) =>
      [u.namaUsaha, u.pemilik, u.kategori, u.deskripsi, u.alamat]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [umkms, q, hasQuery]);

  const qSurat = useMemo(() => {
    if (!hasQuery) return [];
    return surats.filter((s) =>
      [s.kode, s.nama, s.deskripsi].join(' ').toLowerCase().includes(q)
    );
  }, [surats, q, hasQuery]);

  const total = qBerita.length + qUmkm.length + qSurat.length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.replace(`/cari?q=${encodeURIComponent(query.trim())}`);
  };

  const clear = () => {
    setQuery('');
    router.replace('/cari');
  };

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="container-desa max-w-4xl space-y-8">
        <Breadcrumb items={[{ label: 'Pencarian' }]} />

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PENCARIAN WEBSITE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
            {t('Cari.title', 'Cari di Website Desa Anabanua')}
          </h1>
          <p className="text-sm text-neutral-500">
            {t('Cari.subtitle', 'Cari berita, layanan surat, hingga UMKM lokal dalam satu tempat.')}
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex flex-1 items-center gap-3 px-2">
            <Search className="h-5 w-5 text-primary-600 shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik kata kunci... mis. SKTM, kopi, posyandu, pembangunan"
              aria-label="Kata kunci pencarian"
              className="border-none bg-transparent p-0 shadow-none focus:ring-0"
            />
            {query && (
              <button type="button" onClick={clear} aria-label="Hapus kata kunci" className="text-neutral-400 hover:text-neutral-700">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            Cari
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {loading ? (
          <div className="text-center py-16 text-sm text-neutral-500">Menyiapkan indeks pencarian...</div>
        ) : !hasQuery ? (
          <Card className="p-10 text-center text-sm text-neutral-500 space-y-3">
            <Search className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-700" />
            <p className="font-bold text-neutral-700 dark:text-neutral-300">
              Mulai mengetik di atas untuk mencari.
            </p>
            <p>Coba: &quot;kopi&quot;, &quot;SKTM&quot;, &quot;gotong royong&quot;, atau nama UMKM.</p>
          </Card>
        ) : total === 0 ? (
          <Card className="p-10 text-center text-sm text-neutral-500 space-y-2">
            <p className="text-2xl">🤔</p>
            <p className="font-bold text-neutral-700 dark:text-neutral-300">
              Tidak ada hasil untuk &quot;{query}&quot;
            </p>
            <p>Coba kata kunci lain atau perkecil lingkup pencarian Anda.</p>
          </Card>
        ) : (
          <div className="space-y-10">
            {qBerita.length > 0 && (
              <section className="space-y-3">
                {sectionTitle('Berita & Pengumuman', <Newspaper className="h-4 w-4 text-primary-600" />, qBerita.length)}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {qBerita.map((b) => (
                    <Link key={b.id} href={`/berita/${b.slug}`} className="group flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase text-primary-600">{b.kategori}</p>
                        <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">{b.judul}</h3>
                        <p className="text-xs text-neutral-500 line-clamp-1">{b.ringkasan}</p>
                      </div>
                      <span className="shrink-0 text-xs text-neutral-400">{formatTanggal(b.tanggalTerbit)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {qSurat.length > 0 && (
              <section className="space-y-3">
                {sectionTitle('Layanan Surat', <FileText className="h-4 w-4 text-primary-600" />, qSurat.length)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {qSurat.map((s) => (
                    <Link key={s.kode} href={`/layanan/${s.kode}/ajukan`} className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 transition-colors hover:border-primary-400/60">
                      <div className="min-w-0">
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-extrabold text-primary-700 dark:bg-primary-950 dark:text-primary-300">{s.kode}</span>
                        <h3 className="mt-1 font-bold text-sm text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors">{s.nama}</h3>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 group-hover:text-primary-500" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {qUmkm.length > 0 && (
              <section className="space-y-3">
                {sectionTitle('UMKM & Produk Lokal', <Store className="h-4 w-4 text-accent-600" />, qUmkm.length)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {qUmkm.map((u) => (
                    <Link key={u.id} href={`/umkm/${u.slug}`} className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 transition-colors hover:border-accent-400/60">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase text-accent-600">{u.kategori}</p>
                        <h3 className="mt-0.5 font-bold text-sm text-neutral-900 dark:text-white group-hover:text-accent-600 transition-colors">{u.namaUsaha}</h3>
                        <p className="text-xs text-neutral-500 line-clamp-1">oleh {u.pemilik}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 group-hover:text-accent-500" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CariPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] bg-neutral-50 dark:bg-neutral-950 py-12">
          <div className="container-desa space-y-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-6 w-96" />
            <div className="grid gap-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      }
    >
      <CariContent />
    </Suspense>
  );
}