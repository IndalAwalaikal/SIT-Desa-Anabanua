'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAllPengaduanAdmin, updateStatusPengaduanAdmin } from '@/lib/services/pengaduan.service';
import type { Pengaduan } from '@/types/pengaduan';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { Search, Filter } from 'lucide-react';

export default function DashboardPengaduanPage() {
  const [list, setList] = useState<Pengaduan[]>([]);
  const [selected, setSelected] = useState<Pengaduan | null>(null);
  const [tanggapan, setTanggapan] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'terbuka' | 'selesai'>('semua');
  const [sortBy, setSortBy] = useState<'terbaru' | 'terlama' | 'status'>('terbaru');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const refreshList = useCallback(async (requestedPage = page) => {
    try {
      const result = await getAllPengaduanAdmin({
        page: requestedPage,
        limit: 20,
        status: filterStatus === 'semua' ? undefined : filterStatus,
        search,
        sort: sortBy,
      });
      setList(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (requestedPage > Math.max(1, result.totalPages)) setPage(Math.max(1, result.totalPages));
      return result.data;
    } catch {
      setList([]);
      setTotal(0);
      setTotalPages(1);
      return null;
    }
  }, [page, filterStatus, search, sortBy]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshList(); }, search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [refreshList, search]);

  const sortedFiltered = list;

  const handleRespond = async () => {
    if (!selected) return;
    await updateStatusPengaduanAdmin(selected.id, 'selesai', tanggapan);
    await refreshList();
    setModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Kelola Pengaduan Warga</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Tindak lanjuti laporan dan aspirasi masyarakat.</p>
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari judul, pelapor, atau no. tiket..."
            aria-label="Cari pengaduan"
            className="pl-10"
          />
        </div>
        <Select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as typeof filterStatus); setPage(1); }}
          options={[
            { value: 'semua', label: 'Semua Status' },
            { value: 'terbuka', label: 'Terbuka (Belum Selesai)' },
            { value: 'selesai', label: 'Selesai' },
          ]}
          wrapperClassName="sm:w-56"
          className="px-3 py-2 text-xs font-bold"
        />
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
          className="text-xs font-bold bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-primary-500 transition-colors sm:w-36"
          aria-label="Urutkan pengaduan"
        >
          <option value="terbaru">Terbaru</option>
          <option value="terlama">Terlama</option>
          <option value="status">Per Status</option>
        </select>
      </div>

      <div className="space-y-4">
        {sortedFiltered.length === 0 ? (
          <Card className="p-12 text-center text-sm text-neutral-500">
            <Filter className="mx-auto mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-700" aria-hidden="true" />
            Tidak ada pengaduan yang cocok dengan pencarian / filter saat ini.
          </Card>
        ) : (
          sortedFiltered.map((item) => (
          <Card key={item.id} className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-secondary-500 dark:text-secondary-400">{item.nomorTiket}</span>
              <Badge variant={item.status === 'selesai' ? 'success' : 'warning'}>{item.status}</Badge>
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">{item.judul}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.deskripsi}</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Pelapor: {item.pelaporNama} • Lokasi: {item.lokasi || '-'}</p>

            {item.tanggapanAdmin && (
              <div className="p-3 bg-neutral-100 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-emerald-600 dark:text-emerald-400">
                Tanggapan Admin: {item.tanggapanAdmin}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelected(item);
                setTanggapan(item.tanggapanAdmin || '');
                setModalOpen(true);
              }}
            >
              Beri Tanggapan
            </Button>
          </Card>
          ))
        )}
      </div>

      <PaginationControls page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tanggapi Pengaduan Warga">
        <div className="space-y-4">
          <Textarea
            label="Tanggapan / Tindak Lanjut Admin"
            value={tanggapan}
            onChange={(e) => setTanggapan(e.target.value)}
          />
          <Button variant="primary" className="w-full" onClick={handleRespond}>
            Simpan & Tandai Selesai
          </Button>
        </div>
      </Modal>
    </div>
  );
}
