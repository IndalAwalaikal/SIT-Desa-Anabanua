'use client';

import React, { useEffect, useState } from 'react';
import {
  createSembakoPeriod,
  deleteSembakoPeriod,
  getSembakoPeriods,
  updateSembakoPeriod,
} from '@/lib/services/sembako.service';
import type { SembakoPeriod, SembakoStatus } from '@/types/sembako';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Package, Edit, Trash2, Save, Plus, Layers, CalendarDays } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

type ItemInput = { namaBarang: string; satuan: string; jumlahPerKK: number; keterangan?: string };

/** YYYY-MM-DD dari ISO agar cocok dengan <input type="date"> value. */
function toDateInput(v?: string): string {
  if (!v) return '';
  return v.slice(0, 10);
}

const STATUS_LABEL: Record<SembakoStatus, string> = {
  ongoing: 'Berjalan',
  upcoming: 'Terjadwal',
  completed: 'Selesai',
};

export default function DashboardSembakoPage() {
  const [items, setItems] = useState<SembakoPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SembakoPeriod | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showSuccess, showError } = useToastStore();

  const [form, setForm] = useState<{
    nama: string;
    periode: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    targetPenerima: string;
    lokasi: string;
    keterangan: string;
    barangs: ItemInput[];
  }>({
    nama: '',
    periode: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    targetPenerima: '',
    lokasi: '',
    keterangan: '',
    barangs: [{ namaBarang: '', satuan: 'kg', jumlahPerKK: 10 }],
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getSembakoPeriods();
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
    setForm({
      nama: '',
      periode: '',
      tanggalMulai: '',
      tanggalSelesai: '',
      targetPenerima: '',
      lokasi: '',
      keterangan: '',
      barangs: [{ namaBarang: '', satuan: 'kg', jumlahPerKK: 10 }],
    });
    setModalOpen(true);
  };

  const openEdit = (p: SembakoPeriod) => {
    setEditingId(p.id);
    setForm({
      nama: p.nama,
      periode: p.periode,
      tanggalMulai: toDateInput(p.tanggalMulai),
      tanggalSelesai: toDateInput(p.tanggalSelesai),
      targetPenerima: p.targetPenerima != null ? String(p.targetPenerima) : '',
      lokasi: p.lokasi ?? '',
      keterangan: p.keterangan ?? '',
      barangs: p.items.length
        ? p.items.map((it) => ({
            namaBarang: it.namaBarang,
            satuan: it.satuan,
            jumlahPerKK: it.jumlahPerKK,
            keterangan: it.keterangan ?? '',
          }))
        : [{ namaBarang: '', satuan: 'kg', jumlahPerKK: 10 }],
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.periode.trim() || !form.tanggalMulai) return;
    if (form.barangs.some((b) => !b.namaBarang.trim() || !b.satuan.trim())) return;
    setSaving(true);
    try {
      const payload = {
        nama: form.nama.trim(),
        periode: form.periode.trim(),
        tanggalMulai: form.tanggalMulai,
        tanggalSelesai: form.tanggalSelesai || undefined,
        targetPenerima: form.targetPenerima ? Number(form.targetPenerima) : undefined,
        lokasi: form.lokasi.trim() || undefined,
        keterangan: form.keterangan.trim() || undefined,
        items: form.barangs.map((b) => ({
          namaBarang: b.namaBarang.trim(),
          satuan: b.satuan.trim(),
          jumlahPerKK: Number(b.jumlahPerKK) || 0,
          keterangan: b.keterangan?.trim() || undefined,
        })),
      };
      if (editingId) {
        await updateSembakoPeriod(editingId, payload);
        showSuccess('Periode sembako berhasil diperbarui!');
      } else {
        await createSembakoPeriod(payload);
        showSuccess('Periode pembagian sembako berhasil dibuat!');
      }
      setModalOpen(false);
      await refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p: SembakoPeriod) => setDeleteTarget(p);
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSembakoPeriod(deleteTarget.id);
      showSuccess('Periode berhasil dihapus.');
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  const setBarang = (idx: number, patch: Partial<ItemInput>) =>
    setForm((prev) => ({
      ...prev,
      barangs: prev.barangs.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    }));

  const addBarang = () =>
    setForm((prev) => ({
      ...prev,
      barangs: [...prev.barangs, { namaBarang: '', satuan: 'kg', jumlahPerKK: 1 }],
    }));
  const removeBarang = (idx: number) =>
    setForm((prev) => ({ ...prev, barangs: prev.barangs.filter((_, i) => i !== idx) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" /> Pembagian Sembako
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Kelola periode distribusi sembako &amp; rincian barang per KK.
          </p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Tambah Periode
        </Button>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-sm text-neutral-500">Memuat data...</Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-neutral-500">
          Belum ada periode sembako. Tambahkan periode pertama.
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={p.status === 'ongoing' ? 'success' : p.status === 'upcoming' ? 'info' : 'neutral'}>
                      {STATUS_LABEL[p.status]}
                    </Badge>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">{p.periode}</span>
                  </div>
                  <h2 className="mt-2 text-sm font-bold text-neutral-900 dark:text-white line-clamp-2">{p.nama}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {toDateInput(p.tanggalMulai)}
                      {p.tanggalSelesai ? ` – ${toDateInput(p.tanggalSelesai)}` : ''}
                    </span>
                    {p.lokasi && (
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> {p.lokasi}
                      </span>
                    )}
                    {p.targetPenerima != null && (
                      <span>{p.targetPenerima.toLocaleString('id-ID')} KK • {p.items.length} item</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                    <Edit className="w-4 h-4" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} className="text-rose-600 hover:bg-rose-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {p.keterangan && <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-300">{p.keterangan}</p>}
              <ul className="mt-3 flex flex-wrap gap-2">
                {p.items.map((it) => (
                  <li
                    key={it.id || it.namaBarang}
                    className="rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200"
                  >
                    {it.namaBarang} — {it.jumlahPerKK} {it.satuan}/KK
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Periode Sembako' : 'Tambah Periode Sembako'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nama periode" value={form.nama} onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))} required />
          <Input label="Label periode" value={form.periode} onChange={(e) => setForm((p) => ({ ...p, periode: e.target.value }))} placeholder="mis. Tahun Ajaran 2025/2026 — Semester Ganjil" required />
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" label="Tanggal mulai" value={form.tanggalMulai} onChange={(e) => setForm((p) => ({ ...p, tanggalMulai: e.target.value }))} required />
            <Input type="date" label="Tanggal selesai (opsional)" value={form.tanggalSelesai} onChange={(e) => setForm((p) => ({ ...p, tanggalSelesai: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Target KK penerima"
              value={form.targetPenerima}
              onChange={(e) => setForm((p) => ({ ...p, targetPenerima: e.target.value }))}
              placeholder="mis. 812"
            />
            <Input label="Lokasi distribusi" value={form.lokasi} onChange={(e) => setForm((p) => ({ ...p, lokasi: e.target.value }))} placeholder="mis. Balai Desa" />
          </div>
          <Textarea label="Keterangan (opsional)" value={form.keterangan} onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))} rows={2} />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">Rincian barang per KK</span>
              <Button type="button" variant="ghost" size="sm" onClick={addBarang}>
                <Plus className="w-3.5 h-3.5" /> Tambah barang
              </Button>
            </div>
            {form.barangs.map((b, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 bg-neutral-50/60 dark:bg-neutral-800/40">
                <div className="col-span-5">
                  <Input label="Nama barang" value={b.namaBarang} onChange={(e) => setBarang(idx, { namaBarang: e.target.value })} required />
                </div>
                <div className="col-span-2">
                  <Input label="Satuan" value={b.satuan} onChange={(e) => setBarang(idx, { satuan: e.target.value })} placeholder="kg / liter" required />
                </div>
                <div className="col-span-3">
                  <Input
                    label="Jml / KK"
                    type="number"
                    step="0.01"
                    value={String(b.jumlahPerKK)}
                    onChange={(e) => setBarang(idx, { jumlahPerKK: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={form.barangs.length === 1}
                    onClick={() => removeBarang(idx)}
                    className="text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="col-span-12">
                  <Input label="Keterangan (opsional)" value={b.keterangan ?? ''} onChange={(e) => setBarang(idx, { keterangan: e.target.value })} placeholder="mis. premium / kemasan 1 liter" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              <Save className="w-4 h-4" /> {editingId ? 'Simpan Perubahan' : 'Buat Periode'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Hapus periode?"
        message={`Hapus periode “${deleteTarget?.nama ?? ''}” beserta seluruh rincian barangnya?`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
        variant="danger"
      />
    </div>
  );
}
