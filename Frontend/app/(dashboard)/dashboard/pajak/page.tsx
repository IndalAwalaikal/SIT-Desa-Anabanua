"use client";

import React, { useState, useEffect, useCallback } from "react";
import { pajakService, DetailSetoranBatch } from "@/lib/services/pajak.service";
import type {
  JenisPajak,
  WajibPajak,
  TransaksiPajak,
  SetoranPajak,
  AuditLogPajak,
  RingkasanPajak,
} from "@/types/pajak";
import { Card } from "@/components/ui/Card";
import { formatRupiah, formatDate } from "@/lib/utils/format";
import { getCurrentYear, getTahunOptions } from "@/lib/utils/date";
import {
  Receipt,
  Plus,
  Clock,
  ShieldCheck,
  Building2,
  History,
  Layers,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { CountUp } from "@/components/ui/CountUp";

const TAHUN_OPTIONS = getTahunOptions();

export default function AdminPajakPage() {
  const [activeTab, setActiveTab] = useState<
    "transaksi" | "setoran" | "master" | "audit"
  >("transaksi");
  const [selectedTahun, setSelectedTahun] = useState<number>(getCurrentYear());

  // Data states
  const [ringkasan, setRingkasan] = useState<RingkasanPajak | null>(null);
  const [transaksiList, setTransaksiList] = useState<TransaksiPajak[]>([]);
  const [, setTotalTrx] = useState<number>(0);
  const [setoranList, setSetoranList] = useState<SetoranPajak[]>([]);
  const [jenisList, setJenisList] = useState<JenisPajak[]>([]);
  const [wajibList, setWajibList] = useState<WajibPajak[]>([]);
  const [totalWajib, setTotalWajib] = useState<number>(0);
  const [auditList, setAuditList] = useState<AuditLogPajak[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [trxStatusFilter, setTrxStatusFilter] = useState<string>("");
  const [trxJenisFilter, setTrxJenisFilter] = useState<string>("");
  const [trxSearch, setTrxSearch] = useState<string>("");
  const [pageTrx, setPageTrx] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPageTrx(1);
  };

  const [wpSearch] = useState<string>("");
  const [pageWp] = useState<number>(1);

  // Selection for Batch Setoran
  const [selectedTrxIds, setSelectedTrxIds] = useState<string[]>([]);

  // Modals
  const [showCatatModal, setShowCatatModal] = useState<boolean>(false);
  const [showSetoranModal, setShowSetoranModal] = useState<boolean>(false);
  const [showKonfirmasiModal, setShowKonfirmasiModal] =
    useState<boolean>(false);
  const [selectedSetoranForKonf, setSelectedSetoranForKonf] =
    useState<SetoranPajak | null>(null);
  const [showJenisModal, setShowJenisModal] = useState<boolean>(false);
  const [editJenis, setEditJenis] = useState<JenisPajak | null>(null);
  const [showWpModal, setShowWpModal] = useState<boolean>(false);
  const [editWp, setEditWp] = useState<WajibPajak | null>(null);
  const [showDetailSetoran, setShowDetailSetoran] =
    useState<DetailSetoranBatch | null>(null);

  // Form Inputs
  const [formTrx, setFormTrx] = useState({
    jenisPajakId: "",
    wajibPajakId: "",
    tahun: getCurrentYear(),
    periode: "TAHUNAN",
    nominal: 0,
    tanggalBayar: new Date().toISOString().split("T")[0],
    catatan: "",
  });

  const [formSetoran, setFormSetoran] = useState({
    tujuan: "BPD (Bank Pembangunan Daerah / Bank Jatim)",
    tanggalSetor: new Date().toISOString().split("T")[0],
    catatan: "",
  });

  const [formKonfirmasi, setFormKonfirmasi] = useState({
    nomorBuktiPenerimaan: "",
    diterimaOleh: "",
    catatan: "",
    urlBukti: "",
  });

  const [formJenis, setFormJenis] = useState({
    kode: "",
    nama: "",
    kategori: "pajak_daerah",
    satuan: "",
    periode: "TAHUNAN",
    aktif: true,
  });

  const [formWp, setFormWp] = useState({
    noObjek: "",
    nama: "",
    nik: "",
    alamat: "",
    rt: "",
    rw: "",
    dusun: "",
  });

  // Action status message
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchAllData = useCallback(() => {
    setLoading(true);
    Promise.all([
      pajakService.getRingkasan(selectedTahun),
      pajakService.getTransaksiAdmin({
        tahun: selectedTahun,
        status: trxStatusFilter,
        jenisPajakId: trxJenisFilter,
        search: trxSearch,
        page: pageTrx,
        limit: 10,
        includeBatal: true,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
      }),
      pajakService.getSetoranListAdmin(selectedTahun),
      pajakService.getJenisPajakAdmin(),
      pajakService.getWajibPajakAdmin(wpSearch, pageWp, 10),
      pajakService.getAuditLogs(),
    ])
      .then(([ringkasanRes, trxRes, setoranRes, jenisRes, wpRes, auditRes]) => {
        setRingkasan(ringkasanRes);
        setTransaksiList(trxRes.data);
        setTotalTrx(trxRes.total);
        setSetoranList(setoranRes);
        setJenisList(jenisRes);
        setWajibList(wpRes.data);
        setTotalWajib(wpRes.total);
        setAuditList(auditRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error("fetchAllData: Error", err);
        setMessage({
          type: "error",
          text: err?.message || "Gagal memuat data pajak.",
        });
        setLoading(false);
      });
  }, [selectedTahun, trxStatusFilter, trxJenisFilter, trxSearch, pageTrx, wpSearch, pageWp, sortBy, sortOrder]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Actions
  const handleCatatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pajakService.createTransaksi(formTrx);
      setMessage({
        type: "success",
        text: "Pembayaran pajak berhasil dicatat!",
      });
      setShowCatatModal(false);
      fetchAllData();
    } catch (err) {
      console.error("handleCatatSubmit: Error", err);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal mencatat transaksi.",
      });
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await pajakService.updateStatusTransaksi(
        id,
        "diverifikasi",
        "Diverifikasi oleh admin",
      );
      setMessage({ type: "success", text: "Transaksi berhasil diverifikasi!" });
      fetchAllData();
    } catch (err) {
      console.error("handleVerify: Error", err);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal memverifikasi transaksi.",
      });
    }
  };

  const handleBatal = async (id: string) => {
    const alasan = prompt("Masukkan alasan pembatalan pencatatan pajak ini:");
    if (!alasan) return;
    try {
      await pajakService.updateStatusTransaksi(id, "dibatalkan", alasan);
      setMessage({ type: "success", text: "Pencatatan transaksi dibatalkan." });
      fetchAllData();
    } catch (err) {
      console.error("handleBatal: Error", err);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal membatalkan transaksi.",
      });
    }
  };

  const handleCreateSetoran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTrxIds.length === 0) {
      alert("Pilih minimal 1 transaksi yang diverifikasi untuk disetorkan.");
      return;
    }
    try {
      await pajakService.createSetoran({
        tujuan: formSetoran.tujuan,
        tanggalSetor: formSetoran.tanggalSetor,
        transaksiIds: selectedTrxIds,
        catatan: formSetoran.catatan,
      });
      setMessage({
        type: "success",
        text: "Batch penyetoran ke BPD berhasil dibuat!",
      });
      setShowSetoranModal(false);
      setSelectedTrxIds([]);
      fetchAllData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal membuat setoran BPD.",
      });
    }
  };

  const handleKonfirmasiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetoranForKonf) return;
    try {
      await pajakService.konfirmasiSetoran(
        selectedSetoranForKonf.id,
        formKonfirmasi,
      );
      setMessage({
        type: "success",
        text: "Setoran BPD berhasil dikonfirmasi!",
      });
      setShowKonfirmasiModal(false);
      setSelectedSetoranForKonf(null);
      fetchAllData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal mengonfirmasi setoran.",
      });
    }
  };

  const handleJenisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pajakService.saveJenisPajak(formJenis, editJenis?.id);
      setMessage({ type: "success", text: "Jenis pajak berhasil disimpan!" });
      setShowJenisModal(false);
      setEditJenis(null);
      fetchAllData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan jenis pajak.",
      });
    }
  };

  const handleWpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pajakService.saveWajibPajak(formWp, editWp?.id);
      setMessage({
        type: "success",
        text: "Data wajib pajak berhasil disimpan!",
      });
      setShowWpModal(false);
      setEditWp(null);
      fetchAllData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan wajib pajak.",
      });
    }
  };

  const handleSelectAllVerif = () => {
    const verifIds = transaksiList
      .filter((t) => t.status === "diverifikasi")
      .map((t) => t.id);
    if (selectedTrxIds.length === verifIds.length) {
      setSelectedTrxIds([]);
    } else {
      setSelectedTrxIds(verifIds);
    }
  };

  return (
    <div className="space-y-8 p-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dashboard Admin Pajak Desa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
            Kelola &amp; Verifikasi Transparansi Pajak
          </h1>
          <p className="text-xs text-neutral-500">
            Pencatatan pembayaran warga, verifikasi, penyetoran kolektif ke BPD,
            dan audit trail.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-extrabold text-neutral-900 dark:text-white outline-none"
          >
            {TAHUN_OPTIONS.map((th) => (
              <option key={th} value={th}>
                Tahun {th}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCatatModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" /> Catat Pajak Baru
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200"
              : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-200"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-neutral-500 hover:text-neutral-900"
          >
            &times;
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
              Total Penerimaan
            </span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-neutral-900 dark:text-white">
            {loading ? (
              <Skeleton className="h-7 w-3/4 bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <CountUp
                to={
                  (ringkasan?.totalTercatat || 0) +
                  (ringkasan?.totalDiverifikasi || 0) +
                  (ringkasan?.totalSetoran || 0)
                }
                formatter={formatRupiah}
              />
            )}
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
            Tahun {selectedTahun}
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-extrabold uppercase bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
              Menunggu Verifikasi
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-neutral-900 dark:text-white">
            {loading ? (
              <Skeleton className="h-7 w-3/4 bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <CountUp to={ringkasan?.totalTercatat || 0} formatter={formatRupiah} />
            )}
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
            Tercatat, perlu diverifikasi
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-extrabold uppercase bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
              Siap Disetor BPD
            </span>
            <ShieldCheck className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-xl font-black text-neutral-900 dark:text-white">
            {loading ? (
              <Skeleton className="h-7 w-3/4 bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <CountUp to={ringkasan?.totalDiverifikasi || 0} formatter={formatRupiah} />
            )}
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
            Diverifikasi, belum disetorkan
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-extrabold uppercase bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
              Total Setoran BPD
            </span>
            <Building2 className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-xl font-black text-neutral-900 dark:text-white">
            {loading ? (
              <Skeleton className="h-7 w-3/4 bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <CountUp to={ringkasan?.totalSetoran || 0} formatter={formatRupiah} />
            )}
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
            Disetor &amp; dikonfirmasi BPD
          </div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab("transaksi")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            activeTab === "transaksi"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Receipt className="w-4 h-4" /> Pencatatan &amp; Verifikasi
        </button>

        <button
          onClick={() => setActiveTab("setoran")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            activeTab === "setoran"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Building2 className="w-4 h-4" /> Penyetoran ke BPD (
          {setoranList.length})
        </button>

        <button
          onClick={() => setActiveTab("master")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            activeTab === "master"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Layers className="w-4 h-4" /> Master Jenis &amp; Wajib Pajak
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            activeTab === "audit"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <History className="w-4 h-4" /> Audit Trail Log ({auditList.length})
        </button>
      </div>

      {/* TAB 1: PENCATATAN & VERIFIKASI TRANSAKSI */}
      {activeTab === "transaksi" && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                Daftar Pencatatan Pembayaran Pajak
              </h3>
              <p className="text-xs text-neutral-500">
                Verifikasi pencatatan atau kelompokkan transaksi diverifikasi
                untuk disetorkan ke BPD.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {selectedTrxIds.length > 0 && (
                <button
                  onClick={() => setShowSetoranModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-extrabold text-xs shadow transition flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" /> Buat Batch Setoran BPD (
                  {selectedTrxIds.length})
                </button>
              )}

              <input
                type="text"
                value={trxSearch}
                onChange={(e) => {
                  setTrxSearch(e.target.value);
                  setPageTrx(1);
                }}
                placeholder="Cari Resi / Nama..."
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs outline-none"
              />

              <select
                value={trxStatusFilter}
                onChange={(e) => {
                  setTrxStatusFilter(e.target.value);
                  setPageTrx(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs outline-none"
              >
                <option value="">Semua Status</option>
                <option value="tercatat">Tercatat</option>
                <option value="diverifikasi">Diverifikasi</option>
                <option value="disetor">Disetor ke BPD</option>
                <option value="dikonfirmasi_bpd">Dikonfirmasi BPD</option>
                <option value="dibatalkan">Dibatalkan</option>
              </select>

              <select
                value={trxJenisFilter}
                onChange={(e) => {
                  setTrxJenisFilter(e.target.value);
                  setPageTrx(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs outline-none"
              >
                <option value="">Semua Jenis Pajak</option>
                {jenisList.map((jp) => (
                  <option key={jp.id} value={jp.id}>
                    {jp.kode} - {jp.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-950">
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      onChange={handleSelectAllVerif}
                      checked={
                        selectedTrxIds.length > 0 &&
                        selectedTrxIds.length ===
                          transaksiList.filter(
                            (t) => t.status === "diverifikasi",
                          ).length
                      }
                    />
                  </th>
                  <SortableHeader
                    sortKey="nomor_bukti"
                    activeKey={sortBy}
                    direction={sortOrder}
                    onSort={handleSort}
                    className="py-3 px-3 text-left"
                  >
                    No. Resi
                  </SortableHeader>
                  <SortableHeader
                    sortKey="wajib_pajak_nama"
                    activeKey={sortBy}
                    direction={sortOrder}
                    onSort={handleSort}
                    className="py-3 px-3 text-left"
                  >
                    Wajib Pajak
                  </SortableHeader>
                  <th className="py-3 px-3 text-left">Jenis Pajak</th>
                  <SortableHeader
                    sortKey="nominal"
                    activeKey={sortBy}
                    direction={sortOrder}
                    onSort={handleSort}
                    className="py-3 px-3 text-left"
                  >
                    Nominal
                  </SortableHeader>
                  <SortableHeader
                    sortKey="tanggal_bayar"
                    activeKey={sortBy}
                    direction={sortOrder}
                    onSort={handleSort}
                    className="py-3 px-3 text-left"
                  >
                    Tgl Bayar
                  </SortableHeader>
                  <SortableHeader
                    sortKey="status"
                    activeKey={sortBy}
                    direction={sortOrder}
                    onSort={handleSort}
                    className="py-3 px-3 text-left"
                  >
                    Status
                  </SortableHeader>
                  <th className="py-3 px-3 text-right">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="py-3 px-3">
                        <Skeleton className="h-6 w-full rounded" />
                      </td>
                    </tr>
                  ))
                ) : transaksiList.length > 0 ? (
                  transaksiList.map((t) => {
                    const isChecked = selectedTrxIds.includes(t.id);
                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition"
                      >
                        <td className="py-3 px-3">
                          {t.status === "diverifikasi" && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTrxIds([...selectedTrxIds, t.id]);
                                } else {
                                  setSelectedTrxIds(
                                    selectedTrxIds.filter((id) => id !== t.id),
                                  );
                                }
                              }}
                            />
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {t.nomorBukti}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-neutral-900 dark:text-white">
                            {t.wajibPajakNama}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            Objek: {t.noObjek} {t.nik ? `• NIK: ${t.nik}` : ""}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold">{t.jenisPajakKode}</span>{" "}
                          - {t.jenisPajakNama}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-neutral-900 dark:text-white">
                          {formatRupiah(t.nominal)}
                        </td>
                        <td className="py-3 px-3 text-neutral-500">
                          {formatDate(t.tanggalBayar)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="capitalize font-bold text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {t.status === "tercatat" && (
                            <>
                              <button
                                onClick={() => handleVerify(t.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                              >
                                Verifikasi
                              </button>
                              <button
                                onClick={() => handleBatal(t.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
                              >
                                Batal
                              </button>
                            </>
                          )}
                          <a
                            href={`/informasi/pajak/bukti/${encodeURIComponent(t.nomorBukti)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-[11px]"
                          >
                            Resi
                          </a>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-xs text-neutral-500"
                    >
                      Tidak ada transaksi pajak tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: PENYETORAN KE BPD */}
      {activeTab === "setoran" && (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                Daftar Penyetoran Kolektif ke BPD / Bank Mitra
              </h3>
              <p className="text-xs text-neutral-500">
                Penyetoran batch dana pajak warga dari Kas Desa ke BPD/pihak
                terkait.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-950">
                  <th className="py-3 px-3">No. Batch Setoran</th>
                  <th className="py-3 px-3">Tujuan Bank / Lembaga</th>
                  <th className="py-3 px-3">Tgl Setor</th>
                  <th className="py-3 px-3">Jml Transaksi</th>
                  <th className="py-3 px-3">Total Setoran</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="py-3 px-3">
                        <Skeleton className="h-6 w-full rounded" />
                      </td>
                    </tr>
                  ))
                ) : setoranList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                      Belum ada data setoran BPD.
                    </td>
                  </tr>
                ) : (
                  setoranList.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-primary-600 dark:text-primary-400">
                        {s.nomorSetoran}
                      </td>
                      <td className="py-3 px-3 font-bold text-neutral-900 dark:text-white">
                        {s.tujuan}
                      </td>
                      <td className="py-3 px-3 text-neutral-500">
                        {formatDate(s.tanggalSetor)}
                      </td>
                      <td className="py-3 px-3 font-bold">
                        {s.jumlahTransaksi} Trx
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-600">
                        {formatRupiah(s.totalSetor)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            s.status === "dikonfirmasi"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {s.status === "dikonfirmasi"
                            ? "Dikonfirmasi BPD"
                            : "Sedang Disetorkan"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1">
                        {s.status === "disetor" && (
                          <button
                            onClick={() => {
                              setSelectedSetoranForKonf(s);
                              setShowKonfirmasiModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                          >
                            Konfirmasi BPD
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            const res = await pajakService.getSetoranDetail(s.id);
                            setShowDetailSetoran(res);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-[11px]"
                        >
                          Rincian
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: MASTER JENIS & WAJIB PAJAK */}
      {activeTab === "master" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Master Jenis Pajak */}
          <Card className="lg:col-span-6 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                  Master Jenis Pajak &amp; Retribusi
                </h3>
                <p className="text-xs text-neutral-500">
                  Kategori pajak yang dikelola Desa Anabanua.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditJenis(null);
                  setFormJenis({
                    kode: "",
                    nama: "",
                    kategori: "pajak_daerah",
                    satuan: "",
                    periode: "TAHUNAN",
                    aktif: true,
                  });
                  setShowJenisModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs"
              >
                + Jenis Pajak
              </button>
            </div>

            <div className="space-y-2">
              {jenisList.map((jp) => (
                <div
                  key={jp.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs"
                >
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      {jp.kode} - {jp.nama}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      Kategori: {jp.kategori} | Periode: {jp.periode}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditJenis(jp);
                        setFormJenis({
                          kode: jp.kode,
                          nama: jp.nama,
                          kategori: jp.kategori,
                          satuan: jp.satuan || "",
                          periode: jp.periode,
                          aktif: jp.aktif,
                        });
                        setShowJenisModal(true);
                      }}
                      className="text-primary-600 font-bold hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Data Wajib Pajak */}
          <Card className="lg:col-span-6 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                  Data Wajib Pajak ({totalWajib})
                </h3>
                <p className="text-xs text-neutral-500">
                  Warga / Subjek pembayar pajak desa.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditWp(null);
                  setFormWp({
                    noObjek: "",
                    nama: "",
                    nik: "",
                    alamat: "",
                    rt: "",
                    rw: "",
                    dusun: "",
                  });
                  setShowWpModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs"
              >
                + Wajib Pajak
              </button>
            </div>

            <div className="space-y-2">
              {wajibList.map((wp) => (
                <div
                  key={wp.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs"
                >
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      {wp.nama}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      No. Objek: {wp.noObjek} {wp.nik ? `| NIK: ${wp.nik}` : ""}{" "}
                      | Dusun {wp.dusun}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditWp(wp);
                      setFormWp({
                        noObjek: wp.noObjek,
                        nama: wp.nama,
                        nik: wp.nik || "",
                        alamat: wp.alamat,
                        rt: wp.rt,
                        rw: wp.rw,
                        dusun: wp.dusun,
                      });
                      setShowWpModal(true);
                    }}
                    className="text-primary-600 font-bold hover:underline"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL LOG */}
      {activeTab === "audit" && (
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
              Audit Trail Append-Only Pajak
            </h3>
            <p className="text-xs text-neutral-500">
              Setiap perubahan status dan aksi admin tercatat permanen untuk
              audit akuntabilitas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-neutral-950">
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Ref Tipe</th>
                  <th className="py-3 px-3">Ref ID</th>
                  <th className="py-3 px-3">Aksi / Perubahan</th>
                  <th className="py-3 px-3">Status Lama &rarr; Baru</th>
                  <th className="py-3 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono text-[11px]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="py-3 px-3">
                        <Skeleton className="h-5 w-full rounded" />
                      </td>
                    </tr>
                  ))
                ) : auditList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-neutral-500">
                      Belum ada log audit aktivitas pajak.
                    </td>
                  </tr>
                ) : (
                  auditList.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                    >
                      <td className="py-3 px-3 text-neutral-500">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="py-3 px-3 font-bold">{a.refTipe}</td>
                      <td className="py-3 px-3 text-emerald-600">{a.refId}</td>
                      <td className="py-3 px-3 font-bold text-neutral-900 dark:text-white">
                        {a.perubahan}
                      </td>
                      <td className="py-3 px-3">
                        {a.statusLama || "-"} &rarr;{" "}
                        <span className="font-bold text-emerald-600">
                          {a.statusBaru}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-600 dark:text-neutral-400 italic font-sans">
                        {a.catatan || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: CATAT PAJAK BARU */}
      {showCatatModal && (
        <div className="fixed inset-0 bg-neutral-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
              Catat Pembayaran Pajak Baru
            </h3>
            <form onSubmit={handleCatatSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">
                  Jenis Pajak / Retribusi:
                </label>
                <select
                  required
                  value={formTrx.jenisPajakId}
                  onChange={(e) =>
                    setFormTrx({ ...formTrx, jenisPajakId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-semibold"
                >
                  <option value="">-- Pilih Jenis Pajak --</option>
                  {jenisList.map((jp) => (
                    <option key={jp.id} value={jp.id}>
                      {jp.kode} - {jp.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Wajib Pajak:</label>
                <select
                  required
                  value={formTrx.wajibPajakId}
                  onChange={(e) =>
                    setFormTrx({ ...formTrx, wajibPajakId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-semibold"
                >
                  <option value="">-- Pilih Wajib Pajak --</option>
                  {wajibList.map((wp) => (
                    <option key={wp.id} value={wp.id}>
                      {wp.nama} (Objek: {wp.noObjek} - Dusun {wp.dusun})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">
                    Tahun Anggaran:
                  </label>
                  <input
                    type="number"
                    required
                    value={formTrx.tahun}
                    onChange={(e) =>
                      setFormTrx({ ...formTrx, tahun: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Nominal (Rp):</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formTrx.nominal}
                    onChange={(e) =>
                      setFormTrx({
                        ...formTrx,
                        nominal: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Tanggal Bayar:</label>
                <input
                  type="date"
                  required
                  value={formTrx.tanggalBayar}
                  onChange={(e) =>
                    setFormTrx({ ...formTrx, tanggalBayar: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Catatan Tambahan:
                </label>
                <input
                  type="text"
                  value={formTrx.catatan}
                  onChange={(e) =>
                    setFormTrx({ ...formTrx, catatan: e.target.value })
                  }
                  placeholder="Keterangan tambahan pencatatan..."
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatatModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold"
                >
                  Simpan Pencatatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUAT BATCH SETORAN BPD */}
      {showSetoranModal && (
        <div className="fixed inset-0 bg-neutral-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
              Buat Batch Setoran Pajak ke BPD
            </h3>
            <p className="text-xs text-neutral-500">
              Menyetorkan {selectedTrxIds.length} transaksi yang telah
              diverifikasi ke BPD.
            </p>
            <form onSubmit={handleCreateSetoran} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">
                  Tujuan Bank / Lembaga:
                </label>
                <input
                  type="text"
                  required
                  value={formSetoran.tujuan}
                  onChange={(e) =>
                    setFormSetoran({ ...formSetoran, tujuan: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Tanggal Setor:</label>
                <input
                  type="date"
                  required
                  value={formSetoran.tanggalSetor}
                  onChange={(e) =>
                    setFormSetoran({
                      ...formSetoran,
                      tanggalSetor: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Catatan Batch:</label>
                <input
                  type="text"
                  value={formSetoran.catatan}
                  onChange={(e) =>
                    setFormSetoran({ ...formSetoran, catatan: e.target.value })
                  }
                  placeholder="Keterangan penyetoran..."
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSetoranModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 text-white font-extrabold"
                >
                  Proses Setor BPD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI BPD */}
      {showKonfirmasiModal && selectedSetoranForKonf && (
        <div className="fixed inset-0 bg-neutral-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
              Konfirmasi Penerimaan dari BPD
            </h3>
            <p className="text-xs text-neutral-500">
              Input bukti penerimaan resmi BPD untuk Batch Setoran{" "}
              <code className="font-mono font-bold text-emerald-600">
                {selectedSetoranForKonf.nomorSetoran}
              </code>
              .
            </p>

            <form
              onSubmit={handleKonfirmasiSubmit}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold block mb-1">
                  Nomor Bukti Penerimaan BPD:
                </label>
                <input
                  type="text"
                  required
                  value={formKonfirmasi.nomorBuktiPenerimaan}
                  onChange={(e) =>
                    setFormKonfirmasi({
                      ...formKonfirmasi,
                      nomorBuktiPenerimaan: e.target.value,
                    })
                  }
                  placeholder="Contoh: BPD-TRF-2026-9901"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Petugas Penerima BPD:
                </label>
                <input
                  type="text"
                  required
                  value={formKonfirmasi.diterimaOleh}
                  onChange={(e) =>
                    setFormKonfirmasi({
                      ...formKonfirmasi,
                      diterimaOleh: e.target.value,
                    })
                  }
                  placeholder="Nama Teller / Pejabat BPD"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">
                  URL Bukti Transfer / Dokumen (Opsional):
                </label>
                <input
                  type="text"
                  value={formKonfirmasi.urlBukti}
                  onChange={(e) =>
                    setFormKonfirmasi({
                      ...formKonfirmasi,
                      urlBukti: e.target.value,
                    })
                  }
                  placeholder="https://... /uploads/..."
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Catatan Konfirmasi:
                </label>
                <input
                  type="text"
                  value={formKonfirmasi.catatan}
                  onChange={(e) =>
                    setFormKonfirmasi({
                      ...formKonfirmasi,
                      catatan: e.target.value,
                    })
                  }
                  placeholder="Catatan penerimaan..."
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKonfirmasiModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold"
                >
                  Konfirmasi Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH/EDIT JENIS PAJAK */}
      {showJenisModal && (
        <div className="fixed inset-0 bg-neutral-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
              {editJenis ? "Edit Jenis Pajak" : "Tambah Jenis Pajak Baru"}
            </h3>
            <form onSubmit={handleJenisSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">
                  Kode Jenis Pajak:
                </label>
                <input
                  type="text"
                  required
                  value={formJenis.kode}
                  onChange={(e) =>
                    setFormJenis({ ...formJenis, kode: e.target.value })
                  }
                  placeholder="PBB / RETRI_PASAR"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 uppercase font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">
                  Nama Jenis Pajak:
                </label>
                <input
                  type="text"
                  required
                  value={formJenis.nama}
                  onChange={(e) =>
                    setFormJenis({ ...formJenis, nama: e.target.value })
                  }
                  placeholder="Pajak Bumi dan Bangunan"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Kategori:</label>
                  <select
                    value={formJenis.kategori}
                    onChange={(e) =>
                      setFormJenis({ ...formJenis, kategori: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                  >
                    <option value="pajak_daerah">Pajak Daerah</option>
                    <option value="retribusi">Retribusi</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Periode:</label>
                  <select
                    value={formJenis.periode}
                    onChange={(e) =>
                      setFormJenis({ ...formJenis, periode: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                  >
                    <option value="TAHUNAN">TAHUNAN</option>
                    <option value="BULANAN">BULANAN</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJenisModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH/EDIT WAJIB PAJAK */}
      {showWpModal && (
        <div className="fixed inset-0 bg-neutral-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
              {editWp ? "Edit Data Wajib Pajak" : "Tambah Wajib Pajak Baru"}
            </h3>
            <form onSubmit={handleWpSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">
                  Nama Lengkap Subjek / Warga:
                </label>
                <input
                  type="text"
                  required
                  value={formWp.nama}
                  onChange={(e) =>
                    setFormWp({ ...formWp, nama: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">
                    No. Objek Pajak:
                  </label>
                  <input
                    type="text"
                    required
                    value={formWp.noObjek}
                    onChange={(e) =>
                      setFormWp({ ...formWp, noObjek: e.target.value })
                    }
                    placeholder="NOP-3515-..."
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">
                    NIK (Opsional):
                  </label>
                  <input
                    type="text"
                    value={formWp.nik}
                    onChange={(e) =>
                      setFormWp({ ...formWp, nik: e.target.value })
                    }
                    placeholder="3515..."
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Alamat Lengkap:</label>
                <input
                  type="text"
                  value={formWp.alamat}
                  onChange={(e) =>
                    setFormWp({ ...formWp, alamat: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1">RT:</label>
                  <input
                    type="text"
                    value={formWp.rt}
                    onChange={(e) =>
                      setFormWp({ ...formWp, rt: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">RW:</label>
                  <input
                    type="text"
                    value={formWp.rw}
                    onChange={(e) =>
                      setFormWp({ ...formWp, rw: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Dusun:</label>
                  <input
                    type="text"
                    value={formWp.dusun}
                    onChange={(e) =>
                      setFormWp({ ...formWp, dusun: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWpModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL BATCH SETORAN BPD */}
      {showDetailSetoran && (
        <div className="fixed inset-0 bg-neutral-950/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                Rincian Batch Setoran {showDetailSetoran.setoran.nomorSetoran}
              </h3>
              <button
                onClick={() => setShowDetailSetoran(null)}
                className="text-neutral-500 font-bold"
              >
                Tutup &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl">
              <div>
                <span className="text-neutral-500">Bank / Tujuan:</span>
                <div className="font-bold text-neutral-900 dark:text-white">
                  {showDetailSetoran.setoran.tujuan}
                </div>
              </div>
              <div>
                <span className="text-neutral-500">Total Setoran:</span>
                <div className="font-black text-emerald-600 text-sm">
                  {formatRupiah(showDetailSetoran.setoran.totalSetor)}
                </div>
              </div>
              <div>
                <span className="text-neutral-500">Disetor Oleh:</span>
                <div className="font-semibold">
                  {showDetailSetoran.setoran.disetorOleh}
                </div>
              </div>
              <div>
                <span className="text-neutral-500">Bukti BPD:</span>
                <div className="font-semibold">
                  {showDetailSetoran.setoran.nomorBuktiPenerimaan || "-"}
                </div>
              </div>
            </div>

            <h4 className="font-extrabold text-neutral-900 dark:text-white pt-2">
              Daftar Transaksi Terkandung:
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase font-bold text-neutral-500">
                    <th className="py-2 px-2">No. Resi</th>
                    <th className="py-2 px-2">Wajib Pajak</th>
                    <th className="py-2 px-2">Jenis</th>
                    <th className="py-2 px-2">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {showDetailSetoran.transaksi.map((t) => (
                    <tr key={t.id}>
                      <td className="py-2 px-2 font-mono font-bold text-emerald-600">
                        {t.nomorBukti}
                      </td>
                      <td className="py-2 px-2 font-bold">
                        {t.wajibPajakNama}
                      </td>
                      <td className="py-2 px-2">{t.jenisPajakKode}</td>
                      <td className="py-2 px-2 font-extrabold">
                        {formatRupiah(t.nominal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
