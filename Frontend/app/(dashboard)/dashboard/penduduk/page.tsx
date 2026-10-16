'use client';

import React, { useEffect, useState } from 'react';
import { getStatistikPenduduk, getTrenPenduduk, updateStatistikPendudukAdmin, updateTrenBulananAdmin } from '@/lib/services/statistik.service';
import type { StatistikBulanan } from '@/types/statistik';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getCurrentYear, getTahunOptions } from '@/lib/utils/date';
import { Users, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';

export type PerDusunRow = { dusun: string; jumlah: number };
export type UsiaRow = { rentang: string; jumlah: number };
export type PendRow = { jenjang: string; jumlah: number };
export type KerjaRow = { pekerjaan: string; jumlah: number };
export type AgamaRow = { agama: string; jumlah: number };
export type RincianRow = {
  dusun: string;
  lakiLaki: number;
  perempuan: number;
  kepalaKeluarga: number;
  kelahiran: number;
  kematian: number;
  pindahMasuk: number;
  pindahKeluar: number;
};

function JumlahTable<T extends { jumlah: number }>(props: {
  rows: T[];
  onRows: (rows: T[]) => void;
  newRow: () => T;
  labelKey: keyof T;
  labelHead: string;
  labelPlaceholder?: string;
}) {
  const { rows, onRows, newRow, labelKey, labelHead, labelPlaceholder } = props;
  const setLabel = (i: number, value: string) =>
    onRows(rows.map((row, j) => (j === i ? ({ ...row, [labelKey as string]: value } as T) : row)));
  const setJumlah = (i: number, value: number) =>
    onRows(rows.map((row, j) => (j === i ? ({ ...row, jumlah: value } as T) : row)));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">{labelHead}</h4>
        <Button variant="ghost" size="sm" onClick={() => onRows([...rows, newRow()])}>
          <Plus className="w-4 h-4" /> Tambah
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700">
            <tr>
              <th className="p-3">{labelHead}</th>
              <th className="p-3 w-40">Jumlah</th>
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="p-2">
                  <Input
                    aria-label={labelHead}
                    placeholder={labelPlaceholder}
                    value={String((row as Record<string, unknown>)[labelKey as string] ?? '')}
                    onChange={(e) => setLabel(i, e.target.value)}
                    className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </td>
                <td className="p-2">
                  <Input aria-label="Jumlah" type="number" value={row.jumlah} onChange={(e) => setJumlah(i, Number(e.target.value))} className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => onRows(rows.filter((_, j) => j !== i))} aria-label="Hapus baris" className="text-rose-500 hover:text-rose-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-neutral-500">Belum ada data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPendudukPage() {
  const [tahun, setTahun] = useState<number>(getCurrentYear());
  const [totalPenduduk, setTotalPenduduk] = useState(0);
  const [lakiLaki, setLakiLaki] = useState(0);
  const [, setPerempuan] = useState(0);
  const [jumlahKK, setJumlahKK] = useState(0);
  const [perDusun, setPerDusun] = useState<PerDusunRow[]>([]);
  const [rincianDusun, setRincianDusun] = useState<RincianRow[]>([]);
  const [perKelompokUsia, setPerKelompokUsia] = useState<UsiaRow[]>([]);
  const [perPendidikan, setPerPendidikan] = useState<PendRow[]>([]);
  const [perPekerjaan, setPerPekerjaan] = useState<KerjaRow[]>([]);
  const [perAgama, setPerAgama] = useState<AgamaRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

    useEffect(() => {
    getStatistikPenduduk(tahun).then((s) => {
      setTotalPenduduk(s.totalPenduduk || 0);
      setLakiLaki(s.lakiLaki || 0);
      setPerempuan(s.perempuan || 0);
      setJumlahKK(s.jumlahKK || 0);
      setPerDusun([...(s.perDusun || [])]);
      setRincianDusun([...(s.rincianDusun || [])]);
      setPerKelompokUsia([...(s.perKelompokUsia || [])]);
      setPerPendidikan([...(s.perPendidikan || [])]);
      setPerPekerjaan([...(s.perPekerjaan || [])]);
      setPerAgama([...(s.perAgama || [])]);
    });
  }, [tahun]);

  // ---- Tren bulanan (kelahiran / kematian / pindah) ----
  const [tren, setTren] = useState<StatistikBulanan[]>([]);
  const [savingTren, setSavingTren] = useState(false);
  const [savedTren, setSavedTern] = useState(false);

  useEffect(() => {
    getTrenPenduduk(tahun).then((t) => {
      const by = new Map((t.data || []).map((x) => [x.bulan, x]));
      const arr: StatistikBulanan[] = [];
      for (let b = 1; b <= 12; b++) {
        arr.push(by.get(b) ?? { bulan: b, lahir: 0, meninggal: 0, pindahMasuk: 0, pindahKeluar: 0 });
      }
      setTren(arr);
    });
  }, [tahun]);

  const BULAN_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const setTrenField = (bulan: number, key: 'lahir' | 'meninggal' | 'pindahMasuk' | 'pindahKeluar', v: number) =>
    setTren((prev) => prev.map((t) => (t.bulan === bulan ? { ...t, [key]: v } : t)));
  const handleSaveTren = async () => {
    setSavingTren(true);
    setSavedTern(false);
    try {
      await updateTrenBulananAdmin({ tahun, data: tren });
      setSavedTern(true);
      setTimeout(() => setSavedTern(false), 3000);
    } finally {
      setSavingTren(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const total = Math.max(0, Number(totalPenduduk) || 0);
      const laki = Math.max(0, Number(lakiLaki) || 0);
      const perem = Math.max(0, total - laki); // backend mewajibkan total = laki + perempuan
      setPerempuan(perem);

      const cleanRincianDusun = rincianDusun.filter((x) => x.dusun.trim());
      let cleanPerDusun = perDusun.filter((x) => x.dusun.trim());
      
      // Auto-sync perDusun from rincianDusun if rincianDusun entries exist
      if (cleanRincianDusun.length > 0) {
        cleanPerDusun = cleanRincianDusun.map((r) => ({
          dusun: r.dusun,
          jumlah: r.lakiLaki + r.perempuan,
        }));
        setPerDusun(cleanPerDusun);
      }

      const cleanKelompokUsia = perKelompokUsia.filter((x) => x.rentang.trim());
      const cleanPendidikan = perPendidikan.filter((x) => x.jenjang.trim());
      const cleanPekerjaan = perPekerjaan.filter((x) => x.pekerjaan.trim());
      const cleanAgama = perAgama.filter((x) => x.agama.trim());

      await updateStatistikPendudukAdmin({
        tahun,
        totalPenduduk: total,
        lakiLaki: laki,
        perempuan: perem,
        jumlahKK: Math.max(0, Number(jumlahKK) || 0),
        perDusun: cleanPerDusun,
        rincianDusun: cleanRincianDusun,
        perKelompokUsia: cleanKelompokUsia,
        perPendidikan: cleanPendidikan,
        perPekerjaan: cleanPekerjaan,
        perAgama: cleanAgama,
      });
      setSaved(true);
      setTotalPenduduk(total);
      setLakiLaki(laki);
      setJumlahKK(Math.max(0, Number(jumlahKK) || 0));
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
<div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Kelola Data Penduduk</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Isi seluruh data yang tampil di halaman Statistik Penduduk publik: agregat, rincian per dusun, usia,
            pendidikan, pekerjaan, dan agama.
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
      </div>

      <Card className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-bold text-neutral-900 dark:text-white text-base">Agregat Kependudukan — Tahun {tahun}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Input label="Total Penduduk" type="number" value={totalPenduduk} onChange={(e) => setTotalPenduduk(Number(e.target.value))} />
          <Input label="Laki-laki" type="number" value={lakiLaki} onChange={(e) => setLakiLaki(Number(e.target.value))} />
          <Input label="Perempuan (otomatis = total − laki-laki)" type="number" value={Math.max(0, totalPenduduk - lakiLaki)} disabled onChange={() => {}} />
          <Input label="Jumlah KK" type="number" value={jumlahKK} onChange={(e) => setJumlahKK(Number(e.target.value))} />
        </div>
        <p className="text-[11px] text-neutral-500">
          Perempuan dihitung otomatis agar konsisten dengan validasi data & tampilan publik (total = laki-laki + perempuan).
        </p>
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <JumlahTable
            labelHead="Per Dusun (jumlah penduduk)"
            labelKey="dusun"
            labelPlaceholder="cth. Anabanua Utara"
            rows={perDusun}
            onRows={setPerDusun}
            newRow={(): PerDusunRow => ({ dusun: '', jumlah: 0 })}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-300">Rincian Per Dusun</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setRincianDusun((prev) => [...prev, { dusun: '', lakiLaki: 0, perempuan: 0, kepalaKeluarga: 0, kelahiran: 0, kematian: 0, pindahMasuk: 0, pindahKeluar: 0 }])
                }
              >
                <Plus className="w-4 h-4" /> Tambah
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="p-3">Dusun</th>
                    <th className="p-3">Laki</th>
                    <th className="p-3">Perempuan</th>
                    <th className="p-3">KK</th>
                    <th className="p-3">Lahir</th>
                    <th className="p-3">Meninggal</th>
                    <th className="p-3">Masuk</th>
                    <th className="p-3">Keluar</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {rincianDusun.map((r, i) => (
                    <tr key={i}>
                      <td className="p-2"><Input value={r.dusun} onChange={(e) => setRincianDusun(rincianDusun.map((x, j) => (j === i ? { ...x, dusun: e.target.value } : x)))} className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800" /></td>
                      <td className="p-2"><Input type="number" value={r.lakiLaki} onChange={(e) => setRincianDusun(rincianDusun.map((x, j) => (j === i ? { ...x, lakiLaki: Number(e.target.value) } : x)))} className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800" /></td>
                      <td className="p-2"><Input type="number" value={r.perempuan} onChange={(e) => setRincianDusun(rincianDusun.map((x, j) => (j === i ? { ...x, perempuan: Number(e.target.value) } : x)))} className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800" /></td>
                      <td className="p-2"><Input type="number" value={r.kepalaKeluarga} onChange={(e) => setRincianDusun(rincianDusun.map((x, j) => (j === i ? { ...x, kepalaKeluarga: Number(e.target.value) } : x)))} className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800" /></td>
                      <td className="p-2"><Input type="number" value={r.kelahiran} onChange={(e) => setRincianDusun(rincianDusun.map((x, j) => (j === i ? { ...x, kelahiran: Number(e.target.value) } : x)))} className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800" /></td>
                      <td className="p-2"><Input type="number" value={r.kematian} onChange={(e) => setRincianDusun(rincianDusun.map((x, j) => (j === i ? { ...x, kematian: Number(e.target.value) } : x)))} className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800" /></td>
                      <td className="p-2"><Input type="number" value={r.pindahMasuk} onChange={(e) => setRincianDusun(rincianDusun.map((x, j) => (j === i ? { ...x, pindahMasuk: Number(e.target.value) } : x)))} className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800" /></td>
                      <td className="p-2"><Input type="number" value={r.pindahKeluar} onChange={(e) => setRincianDusun(rincianDusun.map((x, j) => (j === i ? { ...x, pindahKeluar: Number(e.target.value) } : x)))} className="border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800" /></td>
                      <td className="p-2 text-center"><button onClick={() => setRincianDusun(rincianDusun.filter((_, j) => j !== i))} aria-label="Hapus baris" className="text-rose-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                  {rincianDusun.length === 0 && (
                    <tr><td colSpan={9} className="p-4 text-center text-neutral-500">Belum ada rincian dusun.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
<div className="space-y-6">
          <JumlahTable
            labelHead="Kelompok Usia"
            labelKey="rentang"
            labelPlaceholder="cth. 0-4 Tahun"
            rows={perKelompokUsia}
            onRows={setPerKelompokUsia}
            newRow={(): UsiaRow => ({ rentang: '', jumlah: 0 })}
          />
          <JumlahTable
            labelHead="Pendidikan"
            labelKey="jenjang"
            labelPlaceholder="cth. SMA / SMK"
            rows={perPendidikan}
            onRows={setPerPendidikan}
            newRow={(): PendRow => ({ jenjang: '', jumlah: 0 })}
          />
          <JumlahTable
            labelHead="Pekerjaan"
            labelKey="pekerjaan"
            labelPlaceholder="cth. Petani / Pekebun"
            rows={perPekerjaan}
            onRows={setPerPekerjaan}
            newRow={(): KerjaRow => ({ pekerjaan: '', jumlah: 0 })}
          />
          <JumlahTable
            labelHead="Agama"
            labelKey="agama"
            labelPlaceholder="cth. Kristen Protestan"
            rows={perAgama}
            onRows={setPerAgama}
            newRow={(): AgamaRow => ({ agama: '', jumlah: 0 })}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} isLoading={saving}>
            <Save className="h-4 w-4" /> Simpan Data Penduduk
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Tersimpan
            </span>
          )}
        </div>
                <p className="text-[11px] text-neutral-500">
          Data tersimpan per tahun dan langsung tampil di halaman Statistik Penduduk publik.
        </p>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Tren Bulanan</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Kelahiran, kematian, dan pindah (masuk/keluar) per bulan untuk tahun {tahun}. Langsung tampil di
              grafik Statistik Penduduk publik.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={handleSaveTren} isLoading={savingTren}>
              <Save className="h-4 w-4" /> Simpan Tren
            </Button>
            {savedTren && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Tersimpan
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="p-2">Bulan</th>
                <th className="p-2 w-24">Kelahiran</th>
                <th className="p-2 w-24">Kematian</th>
                <th className="p-2 w-28">Pindah Masuk</th>
                <th className="p-2 w-28">Pindah Keluar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {tren.map((t) => (
                <tr key={t.bulan} className="bg-white dark:bg-neutral-900">
                  <td className="p-1.5 font-medium text-neutral-700 dark:text-neutral-200">{BULAN_LABELS[t.bulan - 1]}</td>
                  <td className="p-1">
                    <Input type="number" value={t.lahir} onChange={(e) => setTrenField(t.bulan, 'lahir', Number(e.target.value))} className="border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
                  </td>
                  <td className="p-1">
                    <Input type="number" value={t.meninggal} onChange={(e) => setTrenField(t.bulan, 'meninggal', Number(e.target.value))} className="border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
                  </td>
                  <td className="p-1">
                    <Input type="number" value={t.pindahMasuk} onChange={(e) => setTrenField(t.bulan, 'pindahMasuk', Number(e.target.value))} className="border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
                  </td>
                  <td className="p-1">
                    <Input type="number" value={t.pindahKeluar} onChange={(e) => setTrenField(t.bulan, 'pindahKeluar', Number(e.target.value))} className="border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
);
}