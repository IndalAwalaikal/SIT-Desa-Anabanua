'use client';

import React, { useEffect, useState } from 'react';
import { getApbdes, updateApbdesAdmin } from '@/lib/services/statistik.service';
import type { ApbdesRingkasan } from '@/types/statistik';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getCurrentYear, getTahunOptions } from '@/lib/utils/date';
import { formatRupiah } from '@/lib/utils/format';
import { Wallet, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';

const BULAN_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

interface ApbdesRow {
  key: string;
  kategori: 'pendapatan' | 'belanja';
  subKategori: string;
  jumlah: number;
}

export default function DashboardApbdesPage() {
  const [, setApbdes] = useState<ApbdesRingkasan | null>(null);
  const [rows, setRows] = useState<ApbdesRow[]>([]);
  const [tahun, setTahun] = useState<number>(getCurrentYear());
  const [periodeTipe, setPeriodeTipe] = useState<'tahunan' | 'bulan' | 'triwulan'>('tahunan');
  const [bulan, setBulan] = useState(1);
  const [triwulan, setTriwulan] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const periode = (): { bulan?: number; triwulan?: number } =>
    periodeTipe === 'bulan' ? { bulan } : periodeTipe === 'triwulan' ? { triwulan } : {};

  useEffect(() => {
    let active = true;
    const p: { bulan?: number; triwulan?: number } =
      periodeTipe === 'bulan' ? { bulan } : periodeTipe === 'triwulan' ? { triwulan } : {};
    getApbdes(tahun, p)
      .then((a) => {
        if (!active) return;
        setApbdes(a);
        setRows(a.items.map((item, index) => ({ key: `${item.kategori}-${index}`, kategori: item.kategori, subKategori: item.subKategori, jumlah: item.jumlah })));
      })
      .catch(() => {
        if (!active) return;
        setApbdes(null);
        setRows([]);
      });
    return () => { active = false; };
  }, [tahun, periodeTipe, bulan, triwulan]);

  const addRow = (kategori: 'pendapatan' | 'belanja') =>
    setRows((prev) => [...prev, { key: `${kategori}-${Date.now()}`, kategori, subKategori: '', jumlah: 0 }]);

  const updateRow = <K extends keyof ApbdesRow>(key: string, field: K, value: ApbdesRow[K]) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const removeRow = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

  const pendapatanTotal = rows.filter((r) => r.kategori === 'pendapatan').reduce((acc, r) => acc + r.jumlah, 0);
  const belanjaTotal = rows.filter((r) => r.kategori === 'belanja').reduce((acc, r) => acc + r.jumlah, 0);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateApbdesAdmin({
        tahun,
        ...(periodeTipe === 'bulan' ? { bulan } : {}),
        ...(periodeTipe === 'triwulan' ? { triwulan } : {}),
        items: rows.filter((r) => r.subKategori.trim()).map((r) => ({ kategori: r.kategori, subKategori: r.subKategori, jumlah: Number(r.jumlah) || 0 })),
      });
      setSaved(true);
      setApbdes((await getApbdes(tahun, periode())) ?? null);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const periodeLabel = periodeTipe === 'bulan' ? `Bulan ${BULAN_NAMES[bulan - 1]}` : periodeTipe === 'triwulan' ? `Triwulan ${triwulan}` : 'Tahunan';

  return (
<div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Kelola Data APBDes</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Input transparansi anggaran per tahun, per akhir bulan, atau per triwulan. Perubahan langsung tampil di
            halaman Transparansi Anggaran publik.
          </p>
        </div>
        <div className="w-40">
          <Select
            label="Tahun"
            value={String(tahun)}
            options={getTahunOptions().map((y) => ({ value: String(y), label: `Tahun ${y}` }))}
            onChange={(e) => setTahun(Number(e.target.value))}
          />
        </div>
        <div className="w-56">
          <Select
            label="Periode"
            value={periodeTipe}
            options={[
              { value: 'tahunan', label: 'Tahunan (keseluruhan)' },
              { value: 'bulan', label: 'Per-Bulan' },
              { value: 'triwulan', label: 'Per-Triwulan' },
            ]}
            onChange={(e) => setPeriodeTipe(e.target.value as 'tahunan' | 'bulan' | 'triwulan')}
          />
        </div>
        {periodeTipe === 'bulan' && (
          <div className="w-44">
            <Select
              label="Bulan"
              value={String(bulan)}
              options={BULAN_NAMES.map((n, i) => ({ value: String(i + 1), label: n }))}
              onChange={(e) => setBulan(Number(e.target.value))}
            />
          </div>
        )}
        {periodeTipe === 'triwulan' && (
          <div className="w-44">
            <Select
              label="Triwulan"
              value={String(triwulan)}
              options={[1, 2, 3, 4].map((q) => ({ value: String(q), label: `Triwulan ${q}` }))}
              onChange={(e) => setTriwulan(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <Card className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white text-base">
            <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Rincian APBDes — {periodeLabel} {tahun}
          </h3>
          <div className="flex gap-4 text-[11px]">
            <span>Pendapatan: <b className="text-emerald-600 dark:text-emerald-300">{formatRupiah(pendapatanTotal)}</b></span>
            <span>Belanja: <b className="text-primary-600 dark:text-primary-300">{formatRupiah(belanjaTotal)}</b></span>
          </div>
        </div>

        <div className="space-y-6 mt-4">
          {(['pendapatan', 'belanja'] as const).map((kategori) => (
            <div key={kategori} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">{kategori}</h4>
                <Button variant="ghost" size="sm" onClick={() => addRow(kategori)}>
                  <Plus className="w-4 h-4" /> Tambah
                </Button>
              </div>
              <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700">
                    <tr>
                      <th className="p-3">Sub Kategori</th>
                      <th className="p-3 w-44">Jumlah (Rp)</th>
                      <th className="p-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
{rows.filter((r) => r.kategori === kategori).map((r) => (
                      <tr key={r.key}>
                        <td className="p-2">
                          <Input aria-label="Nama sub kategori" value={r.subKategori} onChange={(e) => updateRow(r.key, 'subKategori', e.target.value)} className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
                        </td>
                        <td className="p-2">
                          <Input aria-label="Jumlah" type="number" value={r.jumlah} onChange={(e) => updateRow(r.key, 'jumlah', Number(e.target.value))} className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
                        </td>
                        <td className="p-2 text-center">
                          <button onClick={() => removeRow(r.key)} aria-label="Hapus baris" className="text-rose-500 hover:text-rose-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rows.filter((r) => r.kategori === kategori).length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-neutral-500">Belum ada baris untuk {periodeLabel} ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button onClick={handleSave} isLoading={saving}>
            <Save className="h-4 w-4" /> Simpan APBDes
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Tersimpan
            </span>
          )}
        </div>
        <p className="text-[11px] text-neutral-500 mt-2">
          Total dihitung ulang otomatis dari baris di atas untuk {periodeLabel} {tahun}. Filter triwulan ikut
          merangkum baris bulan dalam kuartalnya.
        </p>
      </Card>
    </div>
);
}