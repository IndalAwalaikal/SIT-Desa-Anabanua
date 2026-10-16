'use client';

import React, { useEffect, useState } from 'react';
import {
  createFasilitasDesa,
  deleteFasilitasDesa,
  getFasilitasDesa,
  updateFasilitasDesa,
} from '@/lib/services/fasilitas.service';
import type { FasilitasDesa, KategoriFasilitas } from '@/types/fasilitas';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Building2, Edit, Trash2, Save, Search, MapPin } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

const KATEGORI_OPTIONS: KategoriFasilitas[] = [
  'pemerintahan',
  'pendidikan',
  'kesehatan',
  'ibadah',
  'olahraga',
  'umum',
];

export default function DashboardFasilitasPage() {
  const [items, setItems] = useState<FasilitasDesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showSuccess, showError } = useToastStore();
  const [form, setForm] = useState({
    nama: '',
    kategori: 'pemerintahan' as KategoriFasilitas,
    alamat: '',
    dusun: '',
    deskripsi: '',
    kontak: '',
    jamLayanan: '',
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getFasilitasDesa();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ nama: '', kategori: 'pemerintahan', alamat: '', dusun: '', deskripsi: '', kontak: '', jamLayanan: '' });
    setModalOpen(true);
  };

  const openEdit = (item: FasilitasDesa) => {
    setEditingId(item.id);
    setForm({
      nama: item.nama,
      kategori: item.kategori,
      alamat: item.alamat,
      dusun: item.dusun,
      deskripsi: item.deskripsi,
      kontak: item.kontak ?? '',
      jamLayanan: item.jamLayanan ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.alamat.trim() || !form.dusun.trim()) return;
    setSaving(true);
    try {
      const payload = {
        nama: form.nama,
        kategori: form.kategori,
                alamat: form.alamat,
        dusun: form.dusun,
        deskripsi: form.deskripsi,
        kontak: form.kontak || undefined,
        jamLayanan: form.jamLayanan || undefined,
      };
      if (editingId) {
        await updateFasilitasDesa(editingId, payload);
        showSuccess('Fasilitas berhasil diperbarui!');
      } else {
        await createFasilitasDesa(payload);
        showSuccess('Fasilitas baru berhasil disimpan!');
      }
      setModalOpen(false);
      await refresh();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Gagal menyimpan fasilitas.');
    } finally {
      setSaving(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<FasilitasDesa | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (item: FasilitasDesa) => setDeleteTarget(item);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFasilitasDesa(deleteTarget.id);
      showSuccess('Fasilitas berhasil dihapus.');
      await refresh();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Gagal menghapus fasilitas.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filtered = items.filter(
    (i) => !search || [i.nama, i.kategori, i.alamat, i.dusun].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Fasilitas Publik Desa</h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Kelola data fasilitas keperluan warga desa.</p>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd}>
          <Building2 className="w-4 h-4" /> Tambah Fasilitas
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <Input
          placeholder="Cari nama, kategori, dusun…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">Belum ada fasilitas. Tambahkan dari tombol di atas.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <Card key={item.id} className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-bold text-neutral-900 dark:text-white text-sm">{item.nama}</h3>
                  <p className="text-[11px] text-neutral-500">{item.kategori} • {item.dusun}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-1 min-w-0">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{item.alamat}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)} aria-label={`Ubah ${item.nama}`}>
                    <Edit className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void handleDelete(item)} aria-label={`Hapus ${item.nama}`}>
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                </div>
              </div>
              {item.deskripsi && <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">{item.deskripsi}</p>}
              {item.kontak && (
                <p className="text-[11px] text-neutral-500">Kontak: {item.kontak}</p>
              )}
              {item.jamLayanan && (
                <p className="text-[11px] text-neutral-500">Jam: {item.jamLayanan}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Ubah Fasilitas' : 'Tambah Fasilitas Baru'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Fasilitas"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              required
            />
            <Select
              label="Kategori"
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value as KategoriFasilitas })}
              options={KATEGORI_OPTIONS}
            />
          </div>
          <Input
            label="Alamat"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            placeholder="Jl. Poros Desa…"
            required
          />
          <Input
            label="Dusun"
            value={form.dusun}
            onChange={(e) => setForm({ ...form, dusun: e.target.value })}
            placeholder="Anabanua Utara"
            required
          />
          <Input
            label="Kontak (opsional)"
            value={form.kontak}
            onChange={(e) => setForm({ ...form, kontak: e.target.value })}
            placeholder="0812-3456-7890"
          />
          <Input
            label="Jam Layanan (opsional)"
            value={form.jamLayanan}
            onChange={(e) => setForm({ ...form, jamLayanan: e.target.value })}
            placeholder="Senin–Jumat, 08.00–16.00 WITA"
          />
          <Textarea
            label="Deskripsi"
            value={form.deskripsi}
            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            rows={3}
            placeholder="Deskripsikan fasilitas dan layanannya..."
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              <Save className="h-4 w-4" /> {editingId ? 'Simpan Perubahan' : 'Simpan Fasilitas'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Hapus Fasilitas"
        message={<>Yakin ingin menghapus fasilitas <strong>&quot;{deleteTarget?.nama}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.</>}
        isLoading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
