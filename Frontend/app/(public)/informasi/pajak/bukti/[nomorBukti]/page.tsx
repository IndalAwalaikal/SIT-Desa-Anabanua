'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { pajakService, DetailTransaksiBukti } from '@/lib/services/pajak.service';
import { Card } from '@/components/ui/Card';
import { formatRupiah, formatDate } from '@/lib/utils/format';
import {
  Receipt,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  ShieldCheck,
  Printer,
  ArrowLeft,
  AlertCircle,
  UserCheck,
  History,
} from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BuktiPajakPage({ params }: { params: Promise<{ nomorBukti: string }> }) {
  const resolvedParams = use(params);
  const nomorBukti = decodeURIComponent(resolvedParams.nomorBukti);

  const [data, setData] = useState<DetailTransaksiBukti | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    pajakService
      .getTransaksiByNomor(nomorBukti)
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err?.message || 'Bukti pembayaran pajak tidak ditemukan.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [nomorBukti]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-12 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
        <div className="container-desa max-w-4xl space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton variant="rectangular" className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 bg-neutral-50 dark:bg-neutral-950 min-h-screen flex items-center justify-center">
        <div className="container-desa max-w-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            Bukti Pajak Tidak Ditemukan
          </h1>
          <p className="text-xs text-neutral-500">
            Nomor resi <code className="bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded font-mono">{nomorBukti}</code> tidak terdaftar dalam sistem Desa Anabanua. Pastikan nomor bukti yang dimasukkan sudah benar.
          </p>
          <Link
            href="/informasi/pajak"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-600 text-white font-bold text-xs hover:bg-primary-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Transparansi Pajak
          </Link>
        </div>
      </div>
    );
  }

  const { transaksi, setoran } = data;

  const isDiverifikasi = ['diverifikasi', 'disetor', 'dikonfirmasi_bpd'].includes(transaksi.status);
  const isDisetor = ['disetor', 'dikonfirmasi_bpd'].includes(transaksi.status);
  const isDikonfirmasi = transaksi.status === 'dikonfirmasi_bpd';
  const isBatal = transaksi.status === 'dibatalkan';

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <div className="container-desa max-w-4xl space-y-8">
        {/* Navigation & Print toolbar (Hidden on print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <Link
            href="/informasi/pajak"
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-primary-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Transparansi Pajak
          </Link>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-extrabold text-xs shadow-lg shadow-primary-600/20 transition"
          >
            <Printer className="w-4 h-4" /> Cetak Bukti Resi Pajak
          </button>
        </div>

        {/* Resi / Proof Main Receipt Card */}
        <Reveal>
          <Card className="p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl rounded-3xl space-y-8 print:shadow-none print:border-none print:p-0">
            {/* Header Instansi */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-dashed border-neutral-200 dark:border-neutral-800 pb-6 text-center sm:text-left gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-700 text-white flex items-center justify-center font-black text-xl shadow-md">
                  DB
                </div>
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-wide">
                    Pemerintah Desa Anabanua
                  </h2>
                  <p className="text-xs text-neutral-500 font-medium">
                    Tanda Bukti Penerimaan &amp; Monitoring Penyetoran Pajak Desa
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Sistem Informasi Transparansi Keuangan Desa Anabanua
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-neutral-500">Nomor Bukti Resi:</div>
                <div className="text-lg font-mono font-black text-primary-600 dark:text-primary-400">
                  {transaksi.nomorBukti}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  Tgl Catat: {formatDate(transaksi.createdAt)}
                </div>
              </div>
            </div>

            {/* Status Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 gap-3">
              <div className="flex items-center gap-3">
                {isDikonfirmasi ? (
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : isDisetor ? (
                  <div className="w-10 h-10 rounded-xl bg-secondary-100 text-secondary-700 flex items-center justify-center">
                    <ArrowRightLeft className="w-6 h-6" />
                  </div>
                ) : isDiverifikasi ? (
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                ) : isBatal ? (
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                    Status Akhir Penyetoran
                  </div>
                  <div className="text-base font-extrabold text-neutral-900 dark:text-white capitalize">
                    {transaksi.status === 'dikonfirmasi_bpd'
                      ? 'Telah Dikonfirmasi BPD / Bank (Lunas & Disetor)'
                      : transaksi.status === 'disetor'
                      ? 'Sedang Disetorkan ke BPD'
                      : transaksi.status === 'diverifikasi'
                      ? 'Diverifikasi Desa (Menunggu Setoran)'
                      : transaksi.status === 'tercatat'
                      ? 'Tercatat di Pemerintah Desa'
                      : 'Pembayaran Dibatalkan'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-neutral-500">Nominal Pajak:</span>
                <div className="text-2xl font-black text-primary-600 dark:text-primary-400">
                  {formatRupiah(transaksi.nominal)}
                </div>
              </div>
            </div>

            {/* Rincian Transaksi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3 bg-neutral-50/70 dark:bg-neutral-950/70 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-xs">
                <h4 className="font-extrabold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-primary-600" /> Data Wajib Pajak
                </h4>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-neutral-500">Nama Lengkap:</span>
                  <span className="col-span-2 font-bold text-neutral-900 dark:text-white">{transaksi.wajibPajakNama}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-neutral-500">No. Objek Pajak:</span>
                  <span className="col-span-2 font-mono font-bold text-neutral-800 dark:text-neutral-200">{transaksi.noObjek}</span>
                </div>
                {transaksi.nik && (
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-neutral-500">NIK (Sensitif):</span>
                    <span className="col-span-2 font-mono text-neutral-700 dark:text-neutral-300">{transaksi.nik}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-neutral-500">Wilayah / Dusun:</span>
                  <span className="col-span-2 font-medium text-neutral-800 dark:text-neutral-200">Dusun {transaksi.dusun || '-'}</span>
                </div>
              </div>

              <div className="space-y-3 bg-neutral-50/70 dark:bg-neutral-950/70 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-xs">
                <h4 className="font-extrabold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-2 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-primary-600" /> Rincian Pembayaran
                </h4>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-neutral-500">Jenis Pajak:</span>
                  <span className="col-span-2 font-bold text-neutral-900 dark:text-white">
                    {transaksi.jenisPajakKode} - {transaksi.jenisPajakNama}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-neutral-500">Tahun / Periode:</span>
                  <span className="col-span-2 font-medium text-neutral-800 dark:text-neutral-200">
                    Tahun {transaksi.tahun} {transaksi.periode ? `(${transaksi.periode})` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-neutral-500">Tanggal Bayar:</span>
                  <span className="col-span-2 font-medium text-neutral-800 dark:text-neutral-200">
                    {formatDate(transaksi.tanggalBayar)}
                  </span>
                </div>
                {transaksi.catatan && (
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-neutral-500">Catatan:</span>
                    <span className="col-span-2 text-neutral-700 dark:text-neutral-300 italic">{transaksi.catatan}</span>
                  </div>
                )}
              </div>
            </div>

            {/* End-to-End Tracking Timeline */}
            <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-primary-600" /> Alur Audit &amp; Tracking Penyetoran End-to-End
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
                {/* Step 1: Pencatatan */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold">
                    1
                  </div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Pencatatan Pembayaran oleh Pemerintah Desa
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Nomor Resi: <code className="font-mono text-neutral-800 dark:text-neutral-200">{transaksi.nomorBukti}</code> • {formatDate(transaksi.createdAt)}
                  </div>
                </div>

                {/* Step 2: Verifikasi */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isDiverifikasi ? 'bg-primary-600 text-white' : 'bg-neutral-300 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}>
                    2
                  </div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Verifikasi Keabsahan oleh Bendahara Desa
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {isDiverifikasi ? (
                      `Diverifikasi pada ${transaksi.tglVerifikasi ? formatDate(transaksi.tglVerifikasi) : '-'}`
                    ) : isBatal ? (
                      <span className="text-rose-600 font-bold">Dibatalkan: {transaksi.catatanBatal || '-'}</span>
                    ) : (
                      'Menunggu proses verifikasi petugas...'
                    )}
                  </div>
                </div>

                {/* Step 3: Batch Penyetoran ke BPD */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isDisetor ? 'bg-primary-600 text-white' : 'bg-neutral-300 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}>
                    3
                  </div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Penyetoran Kolektif ke BPD / Bank Mitra
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {setoran ? (
                      <>
                        Nomor Batch Setoran: <code className="font-mono text-primary-700 dark:text-primary-400 font-bold">{setoran.nomorSetoran}</code> ({setoran.tujuan}) • Disetor pada {formatDate(setoran.tanggalSetor)} oleh {setoran.disetorOleh}
                      </>
                    ) : (
                      'Belum dimasukkan ke dalam batch penyetoran BPD'
                    )}
                  </div>
                </div>

                {/* Step 4: Konfirmasi Penerimaan BPD */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isDikonfirmasi ? 'bg-primary-600 text-white' : 'bg-neutral-300 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}>
                    4
                  </div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Konfirmasi Penerimaan Resmi dari BPD
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {setoran && setoran.status === 'dikonfirmasi' ? (
                      <div className="mt-1 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 space-y-1">
                        <div className="font-bold text-primary-900 dark:text-primary-300">
                          Diterima Oleh: {setoran.diterimaOleh || 'BPD'} (No. Penerimaan: {setoran.nomorBuktiPenerimaan || '-'})
                        </div>
                        <div className="text-[10px] text-primary-700 dark:text-primary-400">
                          Dikonfirmasi pada {setoran.tglKonfirmasi ? formatDate(setoran.tglKonfirmasi) : '-'} {setoran.catatan ? `• ${setoran.catatan}` : ''}
                        </div>
                      </div>
                    ) : (
                      'Menunggu konfirmasi penerimaan dan bukti transfer BPD'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stamp Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 gap-4">
              <div>
                Dokumen ini merupakan bukti sah pencatatan transparansi pajak Desa Anabanua.
              </div>
              <div className="text-center sm:text-right font-semibold">
                Pemerintah Desa Anabanua<br />
                <span className="text-[10px] text-neutral-400 font-mono">Verified Digital Resi System</span>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
