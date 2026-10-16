"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pajakService } from "@/lib/services/pajak.service";
import type { RingkasanPajak, TransaksiPajak, JenisPajak } from "@/types/pajak";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { formatRupiah, formatDate } from "@/lib/utils/format";
import { getCurrentYear, getTahunOptions } from "@/lib/utils/date";
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  ShieldCheck,
  Building2,
  Calendar,
  FileCheck,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { lightTooltipRupiahProps } from "@/lib/utils/chartTooltip";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";

const COLORS = ["#37AB34", "#2c9029", "#334e75", "#1d5e1c", "#112642"];
const TAHUN_OPTIONS = getTahunOptions();
const BULAN_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export default function PajakPublicPage() {
  const router = useRouter();
  const [selectedTahun, setSelectedTahun] = useState<number>(getCurrentYear());
  const [ringkasan, setRingkasan] = useState<RingkasanPajak | null>(null);
  const [jenisList, setJenisList] = useState<JenisPajak[]>([]);
  const [transaksi, setTransaksi] = useState<TransaksiPajak[]>([]);
  const [totalTrx, setTotalTrx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filters for Public Table
  const [searchNomor, setSearchNomor] = useState<string>("");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [tableStatus, setTableStatus] = useState<string>("");
  const [tableJenis, setTableJenis] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    pajakService
      .getJenisPajakPublic()
      .then(setJenisList)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      pajakService.getRingkasan(selectedTahun),
      pajakService.getTransaksiPublic({
        tahun: selectedTahun,
        jenisPajakId: tableJenis,
        status: tableStatus,
        search: tableSearch,
        page,
        limit: 10,
      }),
    ])
      .then(([ringkasanRes, trxRes]) => {
        if (active) {
          setRingkasan(ringkasanRes);
          setTransaksi(trxRes.data);
          setTotalTrx(trxRes.total);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTahun, tableJenis, tableStatus, tableSearch, page]);

  const handleCekNomorResi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNomor.trim()) return;
    router.push(
      `/informasi/pajak/bukti/${encodeURIComponent(searchNomor.trim().toUpperCase())}`,
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "tercatat":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-950 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
            <Clock className="w-3 h-3" /> Tercatat (Desa)
          </span>
        );
      case "diverifikasi":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-950 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
            <ShieldCheck className="w-3 h-3" /> Diverifikasi
          </span>
        );
      case "disetor":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-100 dark:bg-secondary-950 text-secondary-800 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-800">
            <ArrowRightLeft className="w-3 h-3" /> Disetor ke BPD
          </span>
        );
      case "dikonfirmasi_bpd":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-950 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
            <CheckCircle2 className="w-3 h-3" /> Dikonfirmasi BPD
          </span>
        );
      case "dibatalkan":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold text-neutral-500">
            {status}
          </span>
        );
    }
  };

  const totalTerkumpul = ringkasan
    ? ringkasan.totalTercatat +
      ringkasan.totalDiverifikasi +
      ringkasan.totalSetoran
    : 0;

  const transparansiRatio =
    totalTerkumpul > 0 && ringkasan
      ? Math.round((ringkasan.totalSetoran / totalTerkumpul) * 100)
      : 0;

  const chartBulanData =
    ringkasan?.perBulan?.map((b) => ({
      name: BULAN_NAMES[b.bulan - 1] || `Bln ${b.bulan}`,
      total: b.total,
      transaksi: b.jumlahTransaksi,
    })) || [];

  return (
    <div className="py-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="container-desa space-y-10">
        {/* Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold border border-primary-200 dark:border-primary-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transparansi & Akuntabilitas Pajak Desa</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Monitoring Pencatatan & Penyetoran Pajak Desa
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Pantau alur penerimaan pajak warga Desa Anabanua secara transparan
              dari pencatatan di Pemerintah Desa hingga penyetoran resmi ke BPD
              / Bank Mitra.
            </p>
          </div>
        </Reveal>

        {/* Quick Receipt Tracker Card */}
        <Reveal delay={40}>
          <Card className="p-6 bg-slate-900 text-white shadow-xl rounded-3xl border border-slate-800">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-primary-300 font-bold text-xs uppercase tracking-wider">
                  <Receipt className="w-4 h-4" /> Cek Resi / Verifikasi Bukti
                  Bayar
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  Lacak Status Penyetoran Pajak Anda
                </h2>
                <p className="text-xs text-slate-300 max-w-xl">
                  Masukkan Nomor Bukti Pembayaran (Contoh:{" "}
                  <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono">
                    PK-2026-00001
                  </code>
                  ) untuk mengecek apakah pajak yang Anda bayarkan sudah
                  diverifikasi dan disetor ke BPD.
                </p>
              </div>

              <form
                onSubmit={handleCekNomorResi}
                className="w-full lg:w-auto flex flex-col sm:flex-row gap-2"
              >
                <div className="relative flex-1 min-w-[280px]">
                  <input
                    type="text"
                    value={searchNomor}
                    onChange={(e) => setSearchNomor(e.target.value)}
                    placeholder="Masukkan Nomor Bukti Resi Pajak..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-semibold text-white placeholder-slate-400 outline-none focus:bg-white/10 focus:border-primary-400 transition"
                  />
                  <Search className="w-4 h-4 text-primary-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-primary-500 hover:bg-primary-400 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" /> Cek Bukti Resi
                </button>
              </form>
            </div>
          </Card>
        </Reveal>

        {/* Filter Year Selector */}
        <Reveal delay={60}>
          <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-white">
              <Calendar className="w-4 h-4 text-primary-600" />
              <span>Tahun Anggaran Pajak:</span>
            </div>
            <Select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              options={TAHUN_OPTIONS.map((th) => ({ value: String(th), label: `Tahun ${th}` }))}
              wrapperClassName="w-auto"
              className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-xs font-extrabold focus:border-primary-500"
            />
          </div>
        </Reveal>

        {/* Summary Metrics Grid */}
        <Reveal delay={80}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Metric 1 */}
            <Card className="p-5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 px-2.5 py-0.5 rounded-full">
                  Total Penerimaan
                </span>
                <Receipt className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                {loading ? (
                  <Skeleton className="h-8 w-3/4 bg-neutral-200 dark:bg-neutral-800" />
                ) : (
                  <AnimatedCounter
                    value={totalTerkumpul}
                    formatter={formatRupiah}
                  />
                )}
              </h3>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                Seluruh pembayaran pajak tercatat
              </p>
            </Card>

            {/* Metric 2 */}
            <Card className="p-5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 px-2.5 py-0.5 rounded-full">
                  Disetorkan ke BPD
                </span>
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                {loading ? (
                  <Skeleton className="h-8 w-3/4 bg-neutral-200 dark:bg-neutral-800" />
                ) : (
                  <AnimatedCounter
                    value={ringkasan?.totalSetoran || 0}
                    formatter={formatRupiah}
                  />
                )}
              </h3>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                Sudah disetor & dikonfirmasi BPD
              </p>
            </Card>

            {/* Metric 3 */}
            <Card className="p-5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 px-2.5 py-0.5 rounded-full">
                  Belum Disetorkan
                </span>
                <Clock className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                {loading ? (
                  <Skeleton className="h-8 w-3/4 bg-neutral-200 dark:bg-neutral-800" />
                ) : (
                  <AnimatedCounter
                    value={ringkasan?.sisaBelumDisetor || 0}
                    formatter={formatRupiah}
                  />
                )}
              </h3>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                Tercatat/terverifikasi di Kas Desa
              </p>
            </Card>

            {/* Metric 4 */}
            <Card className="p-5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 px-2.5 py-0.5 rounded-full">
                  Transparansi Ratio
                </span>
                <ShieldCheck className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                {loading ? (
                  <Skeleton className="h-8 w-1/2 bg-neutral-200 dark:bg-neutral-800" />
                ) : (
                  `${transparansiRatio}%`
                )}
              </h3>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                Persentase penyetoran end-to-end
              </p>
            </Card>
          </div>
        </Reveal>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Breakdown per Jenis Pajak */}
          <Reveal className="lg:col-span-6" delay={100}>
            <Card className="p-6 h-full" hoverable>
              <CardHeader className="px-0 pt-0 mb-4">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary-600" /> Realisasi Per
                  Jenis Pajak & Retribusi
                </h3>
              </CardHeader>
              <CardBody className="px-0 space-y-4">
                {loading ? (
                  <Skeleton
                    variant="rectangular"
                    className="h-64 w-full rounded-2xl"
                  />
                ) : ringkasan?.perJenis && ringkasan.perJenis.length > 0 ? (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={ringkasan.perJenis}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            dataKey="total"
                            nameKey="nama"
                          >
                            {ringkasan.perJenis.map((_, idx) => (
                              <Cell
                                key={idx}
                                fill={COLORS[idx % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip {...lightTooltipRupiahProps} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      {ringkasan.perJenis.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs"
                        >
                          <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                            {item.nama} ({item.kode})
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {formatRupiah(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-xs text-neutral-500">
                    Belum ada data transaksi pajak untuk tahun {selectedTahun}.
                  </div>
                )}
              </CardBody>
            </Card>
          </Reveal>

          {/* Tren Pembayaran Per Bulan */}
          <Reveal className="lg:col-span-6" delay={120}>
            <Card className="p-6 h-full" hoverable>
              <CardHeader className="px-0 pt-0 mb-4">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-primary-600" /> Tren Penerimaan
                  Pajak Bulanan ({selectedTahun})
                </h3>
              </CardHeader>
              <CardBody className="px-0 space-y-4">
                {loading ? (
                  <Skeleton
                    variant="rectangular"
                    className="h-64 w-full rounded-2xl"
                  />
                ) : chartBulanData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartBulanData}>
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <YAxis
                          tickFormatter={(v) =>
                            `${Math.round((v as number) / 1000)}k`
                          }
                          width={50}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                        />
                        <Tooltip {...lightTooltipRupiahProps} />
                        <Bar
                          dataKey="total"
                          fill="#16a34a"
                          radius={[6, 6, 0, 0]}
                          name="Total Penerimaan"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-neutral-500">
                    Belum ada tren data pembayaran bulanan.
                  </div>
                )}
              </CardBody>
            </Card>
          </Reveal>
        </div>

        {/* Transparansi Data Table Section */}
        <Reveal delay={140}>
          <Card className="p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">
                  Daftar Transparansi Pembayaran Pajak Warga
                </h2>
                <p className="text-xs text-neutral-500">
                  Data pembayaran pajak tercatat di Desa Anabanua. Data NIK
                  dilindungi sesuai standar privasi publik.
                </p>
              </div>

              {/* Filter Toolbars */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Cari NAMA / No. Bukti..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white outline-none focus:border-primary-500"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <Select
                  value={tableJenis}
                  onChange={(e) => {
                    setTableJenis(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: '', label: 'Semua Jenis Pajak' },
                    ...jenisList.map((jp) => ({ value: jp.id, label: `${jp.kode} - ${jp.nama}` })),
                  ]}
                  wrapperClassName="w-auto"
                  className="py-1.5 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 focus:border-primary-500"
                />

                <Select
                  value={tableStatus}
                  onChange={(e) => {
                    setTableStatus(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: '', label: 'Semua Status' },
                    { value: 'tercatat', label: 'Tercatat' },
                    { value: 'diverifikasi', label: 'Diverifikasi' },
                    { value: 'disetor', label: 'Disetor ke BPD' },
                    { value: 'dikonfirmasi_bpd', label: 'Dikonfirmasi BPD' },
                  ]}
                  wrapperClassName="w-auto"
                  className="py-1.5 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-950/50">
                    <th className="py-3 px-3">No. Resi</th>
                    <th className="py-3 px-3">Wajib Pajak</th>
                    <th className="py-3 px-3">Jenis Pajak</th>
                    <th className="py-3 px-3">Periode</th>
                    <th className="py-3 px-3">Nominal</th>
                    <th className="py-3 px-3">Tgl Bayar</th>
                    <th className="py-3 px-3">Status Penyetoran</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx}>
                        <td colSpan={8} className="py-3 px-3">
                          <Skeleton className="h-6 w-full rounded" />
                        </td>
                      </tr>
                    ))
                  ) : transaksi.length > 0 ? (
                    transaksi.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-primary-700 dark:text-primary-400">
                          {t.nomorBukti}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-neutral-900 dark:text-white">
                            {t.wajibPajakNama}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            Objek: {t.noObjek}{" "}
                            {t.dusun ? `• Dusun ${t.dusun}` : ""}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-neutral-700 dark:text-neutral-300">
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {t.jenisPajakKode}
                          </span>{" "}
                          - {t.jenisPajakNama}
                        </td>
                        <td className="py-3 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                          Thn {t.tahun} {t.periode ? `(${t.periode})` : ""}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-neutral-900 dark:text-white">
                          {formatRupiah(t.nominal)}
                        </td>
                        <td className="py-3 px-3 text-neutral-600 dark:text-neutral-400">
                          {formatDate(t.tanggalBayar)}
                        </td>
                        <td className="py-3 px-3">
                          {getStatusBadge(t.status)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/informasi/pajak/bukti/${encodeURIComponent(t.nomorBukti)}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline bg-primary-50 dark:bg-primary-950/60 px-2.5 py-1 rounded-xl border border-primary-200 dark:border-primary-800"
                          >
                            Resi <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-xs text-neutral-500"
                      >
                        Tidak ada transaksi pajak yang sesuai dengan filter
                        pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalTrx > 10 && (
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                <span className="text-neutral-500">
                  Menampilkan {transaksi.length} dari {totalTrx} transaksi
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 font-bold"
                  >
                    Sebelumnya
                  </button>
                  <span className="font-bold text-neutral-900 dark:text-white px-2">
                    Hal {page}
                  </span>
                  <button
                    disabled={page * 10 >= totalTrx}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 font-bold"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
