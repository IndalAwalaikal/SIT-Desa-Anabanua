'use client';

import React, { useEffect, useState } from 'react';
import { getBukuAgendaAdmin } from '@/lib/services/persuratan.service';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileSpreadsheet, Search, ShieldCheck, Calendar, BookOpen } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import { useSortableData } from '@/hooks/useSortableData';
import { SortableHeader } from '@/components/ui/SortableHeader';

interface AgendaItem {
  noUrut: number;
  id: string;
  nomorResi: string;
  nomorSuratResmi: string;
  jenisSuratKode: string;
  jenisSuratNama: string;
  pemohonNama: string;
  pemohonNik: string;
  tanggalTerbit: string;
  penandatangan: string;
  filePdfUrl?: string;
  qrCode?: string;
}

export default function DashboardBukuAgendaPage() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showError, showSuccess } = useToastStore();

  useEffect(() => {
    async function load() {
      try {
        const data = await getBukuAgendaAdmin();
        setItems(data || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = items.filter(
    (item) =>
      !search ||
      item.nomorSuratResmi?.toLowerCase().includes(search.toLowerCase()) ||
      item.pemohonNama?.toLowerCase().includes(search.toLowerCase()) ||
      item.pemohonNik?.toLowerCase().includes(search.toLowerCase()) ||
      item.jenisSuratNama?.toLowerCase().includes(search.toLowerCase())
  );

  const { sorted, requestSort, sortKey, direction } = useSortableData(filtered);

  const handleExportCSV = () => {
    if (items.length === 0) {
      showError('Tidak ada data agenda surat keluar untuk diekspor.');
      return;
    }

    const headers = ['No. Urut', 'Tanggal Terbit', 'Nomor Surat Resmi', 'Jenis Surat', 'Nama Pemohon', 'NIK Pemohon', 'Penandatangan', 'QR Code Verifikasi'];
    const rows = items.map((it) => [
      it.noUrut,
      it.tanggalTerbit,
      `"${it.nomorSuratResmi || '-'}"`,
      `"${it.jenisSuratNama}"`,
      `"${it.pemohonNama}"`,
      `"${it.pemohonNik || '-'}"`,
      `"${it.penandatangan}"`,
      `"${it.qrCode || '-'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `buku_agenda_surat_keluar_desa_anabanua_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Buku Agenda Surat Keluar berhasil diekspor ke format CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              Buku Agenda Surat Keluar
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Registrasi resmi surat terbit Pemerintah Desa Anabanua sesuai Permendagri No. 47 Tahun 2016.
          </p>
        </div>

        <Button variant="primary" onClick={handleExportCSV} className="shrink-0 font-bold">
          <FileSpreadsheet className="w-4 h-4" /> Ekspor Buku Agenda (CSV/Excel)
        </Button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor surat, NIK, nama pemohon..."
            className="border-none bg-neutral-50 dark:bg-neutral-950 pl-10 pr-4 py-2 text-xs shadow-none focus:ring-0"
          />
        </div>

        <div className="text-xs text-neutral-500 font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-600" />
          <span>Total Surat Terbit: <strong>{items.length} Dokumen</strong></span>
        </div>
      </div>

      {/* Agenda Table */}
      <Card className="overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm">
        {loading ? (
          <div className="p-8 space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            Belum ada data surat keluar resmi yang terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-300 font-bold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-center w-12">No</th>
                  <SortableHeader
                    sortKey="tanggalTerbit"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={(k) => requestSort(k as keyof AgendaItem)}
                  >
                    Tanggal
                  </SortableHeader>
                  <SortableHeader
                    sortKey="nomorSuratResmi"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={(k) => requestSort(k as keyof AgendaItem)}
                  >
                    Nomor Surat Resmi
                  </SortableHeader>
                  <SortableHeader
                    sortKey="jenisSuratNama"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={(k) => requestSort(k as keyof AgendaItem)}
                  >
                    Jenis Surat
                  </SortableHeader>
                  <SortableHeader
                    sortKey="pemohonNama"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={(k) => requestSort(k as keyof AgendaItem)}
                  >
                    Nama Pemohon &amp; NIK
                  </SortableHeader>
                  <SortableHeader
                    sortKey="penandatangan"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={(k) => requestSort(k as keyof AgendaItem)}
                  >
                    Penandatangan
                  </SortableHeader>
                  <th className="px-4 py-3 text-center">Verifikasi Digital</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {sorted.map((it) => (
                  <tr key={it.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-950/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-center text-neutral-400">{it.noUrut}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600 dark:text-neutral-300">{it.tanggalTerbit}</td>
                    <td className="px-4 py-3 font-mono font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">
                      {it.nomorSuratResmi || '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                      {it.jenisSuratNama}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-neutral-900 dark:text-white">{it.pemohonNama}</div>
                      <div className="text-[11px] font-mono text-neutral-400">NIK: {it.pemohonNik || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-medium">
                      {it.penandatangan}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {it.qrCode ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          {it.qrCode}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 italic">No QR</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
