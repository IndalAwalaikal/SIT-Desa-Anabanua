'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getPengaduanByTiket } from '@/lib/services/pengaduan.service';
import type { Pengaduan, StatusPengaduan } from '@/types/pengaduan';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { formatTanggal } from '@/lib/utils/format';
import { Search, Ticket, AlertCircle, CheckCircle2, MessageSquareText, MapPin, Home } from 'lucide-react';

const statusLabel: Record<StatusPengaduan, string> = {
  diterima: 'Diterima',
  ditindaklanjuti: 'Ditindaklanjuti',
  selesai: 'Selesai',
};

const statusVariant: Record<StatusPengaduan, 'info' | 'warning' | 'success'> = {
  diterima: 'info',
  ditindaklanjuti: 'warning',
  selesai: 'success',
};

function LacakLoading() {
  return (
    <div className="min-h-[60vh] bg-neutral-50 dark:bg-neutral-950">
      <div className="container-desa py-12 flex items-center justify-center">
        <span className="text-neutral-400">Memuat…</span>
      </div>
    </div>
  );
}

function LacakContent() {
  const searchParams = useSearchParams();
  const initialTiket = searchParams.get('tiket') || '';

  const [tiket, setTiket] = useState(initialTiket);
  const [result, setResult] = useState<Pengaduan | null | 'not_found'>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialTiket) return;
    void (async () => {
      setLoading(true);
      try {
        const data = await getPengaduanByTiket(initialTiket);
        setResult(data || 'not_found');
      } catch {
        setResult('not_found');
      } finally {
        setLoading(false);
      }
    })();
  }, [initialTiket]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tiket.trim()) return;
    setLoading(true);
    try {
      const data = await getPengaduanByTiket(tiket.trim());
      setResult(data || 'not_found');
    } catch {
      setResult('not_found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <div className="container-desa space-y-8 max-w-3xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Beranda', href: '/' },
            { label: 'Layanan', href: '/layanan' },
            { label: 'Lacak Pengaduan' },
          ]}
        />

        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold">
            <Ticket className="w-3.5 h-3.5" />
            <span>LACAK PENGADUAN</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            Lacak Status Pengaduan Warga
          </h1>
          <p className="text-sm text-neutral-500">
            Masukkan nomor tiket pengaduan yang Anda terima setelah mengirim laporan untuk melihat
            status penanganan dari perangkat desa.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              value={tiket}
              onChange={(e) => setTiket(e.target.value)}
              placeholder="Contoh: PGN-2026-00123"
              className="w-full"
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="shrink-0">
            <Search className="w-4 h-4" />
            Lacak Sekarang
          </Button>
        </form>

        {loading && (
          <Card className="p-6 space-y-4">
            <Skeleton variant="rectangular" className="h-5 w-1/2 rounded" />
            <Skeleton variant="rectangular" className="h-5 w-full rounded" />
            <Skeleton variant="rectangular" className="h-5 w-2/3 rounded" />
          </Card>
        )}

        {!loading && result === 'not_found' && (
          <div className="p-8 text-center space-y-3 bg-rose-50 dark:bg-rose-950/40 rounded-3xl border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">Pengaduan Tidak Ditemukan</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400">
              Nomor tiket tidak terdaftar pada sistem pengaduan Desa Anabanua. Periksa kembali nomor tiket Anda.
            </p>
          </div>
        )}

        {!loading && result && result !== 'not_found' && (
          <Card className="p-6 sm:p-8 space-y-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-3xl">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Nomor Tiket</p>
                <p className="font-mono font-bold text-primary-600 dark:text-primary-400">{result.nomorTiket}</p>
              </div>
              <Badge variant={statusVariant[result.status]}>{statusLabel[result.status]}</Badge>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{result.judul}</h2>
                <p className="text-xs text-neutral-500 mt-1">{result.deskripsi}</p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 font-semibold capitalize">
                  {result.kategori}
                </span>
                {result.lokasi && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 font-semibold">
                    <MapPin className="w-3.5 h-3.5" />
                    {result.lokasi}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 font-semibold">
                  Dilaporkan: {formatTanggal(result.dibuatPada, { withTime: true })}
                </span>
              </div>
            </div>

            {/* Tanggapan admin */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5" />
                Tanggapan Perangkat Desa
              </p>
              {result.tanggapanAdmin ? (
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {result.tanggapanAdmin}
                </p>
              ) : (
                <p className="text-xs text-neutral-400 italic">
                  Belum ada tanggapan. Laporan Anda sedang dalam proses peninjauan.
                </p>
              )}
            </div>

            {result.status === 'selesai' && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p className="text-xs font-bold">Pengaduan telah diselesaikan oleh perangkat desa.</p>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <Link href="/pengaduan" className="inline-flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
                <Home className="w-3.5 h-3.5" />
                Ajukan Pengaduan Baru
              </Link>
            </div>
          </Card>
        )}

        {!loading && !result && (
          <div className="text-center py-8">
            <p className="text-xs text-neutral-400">
              Ketik nomor tiket untuk melihat status pengaduan Anda.
            </p>
          </div>
        )}


      </div>
    </div>
  );
}

export default function LacakPengaduanPage() {
  return (
    <Suspense fallback={<LacakLoading />}>
      <LacakContent />
    </Suspense>
  );
}
