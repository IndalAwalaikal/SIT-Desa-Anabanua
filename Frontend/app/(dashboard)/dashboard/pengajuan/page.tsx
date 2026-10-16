"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getAllPengajuanAdmin,
  terbitkanSuratAdmin,
  updateStatusPengajuanAdmin,
  deletePengajuanAdmin,
  getLampiranBlob,
  isLampiranImage,
  isLampiranPdf,
} from "@/lib/services/persuratan.service";
import type { LampiranFile, PengajuanSurat, StatusPengajuan } from "@/types/persuratan";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DynamicImage } from "@/components/ui/DynamicImage";
import { formatTanggal } from "@/lib/utils/format";
import SuratTemplate from "@/components/surat/SuratTemplate";
import { useToastStore } from "@/store/toastStore";
import { PaginationControls } from "@/components/ui/PaginationControls";
import {
  FileText,
  FileImage,
  Paperclip,
  Loader2,
  Eye,
  ExternalLink,
  Send,
  Search,
  Filter,
  Trash2,
  AlertTriangle,
  Download,
  Printer,
} from "lucide-react";


const BULAN_ROMAWI = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

function getStatusBadgeStyle(status: StatusPengajuan) {
  switch (status) {
    case "diajukan":
      return "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    case "diverifikasi":
      return "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800";
    case "diproses":
      return "bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800";
    case "selesai":
      return "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    case "ditolak":
      return "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700";
  }
}

export default function DashboardPengajuanPage() {
  const [list, setList] = useState<PengajuanSurat[]>([]);
  const [selected, setSelected] = useState<PengajuanSurat | null>(null);
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToastStore();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [sortBy, setSortBy] = useState<'tanggal-desc' | 'tanggal-asc' | 'nama-asc' | 'nama-desc' | 'status'>('tanggal-desc');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Status Change Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] =
    useState<StatusPengajuan>("diverifikasi");

  // Publish Modal State
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [nomorSuratInput, setNomorSuratInput] = useState("");
  const [publishCatatan, setPublishCatatan] = useState("");

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedToDelete, setSelectedToDelete] =
    useState<PengajuanSurat | null>(null);

  // Letter Preview Modal State
  const [previewSurat, setPreviewSurat] = useState<PengajuanSurat | null>(null);

  // File Attachment Preview Modal State
  const [previewAttachment, setPreviewAttachment] = useState<{
    pengajuanId: string;
    id: string;
    nama: string;
    url: string;
    tipe: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const refreshList = useCallback(async (requestedPage = page) => {
    try {
      const result = await getAllPengajuanAdmin({
        page: requestedPage,
        limit: 20,
        status: filterStatus === "semua" ? undefined : filterStatus as StatusPengajuan,
        search: searchQuery,
        sort: sortBy,
      });
      setList(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (requestedPage > Math.max(1, result.totalPages)) setPage(Math.max(1, result.totalPages));
      return result.data;
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal memuat daftar pengajuan.");
      return null;
    }
  }, [page, filterStatus, searchQuery, sortBy, showError]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshList(); }, searchQuery ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [refreshList, searchQuery]);

  // Buka pratinjau lampiran: ambil Blob via endpoint ber-autentikasi lalu
  // tampilkan lewat object URL (tag <img>/<iframe> biasa tidak bisa membawa
  // header Authorization sehingga selalu gagal dimuat).
  const openPreviewAttachment = async (item: PengajuanSurat, lamp: LampiranFile) => {
    if (!item.id || !lamp.id) {
      showError("Berkas lampiran tidak memiliki identitas yang valid.");
      return;
    }
    setPreviewAttachment({ pengajuanId: item.id, id: lamp.id, nama: lamp.nama, url: lamp.url, tipe: lamp.tipe });
    setPreviewLoading(true);
    try {
      const blob = await getLampiranBlob(item.id, lamp.id);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Gagal memuat berkas lampiran.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreviewAttachment = () => {
    setPreviewAttachment(null);
    setPreviewLoading(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  // Unduh berkas lampiran (fetch ber-auth lalu trigger download).
  const downloadLampiran = async (item: PengajuanSurat, lamp: LampiranFile) => {
    try {
      const blob = await getLampiranBlob(item.id, lamp.id);
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = lamp.nama || "berkas-lampiran";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Gagal mengunduh berkas lampiran.",
      );
    }
  };

  // Buka berkas di tab baru (menggunakan object URL hasil fetch ber-auth).
  const openLampiranTab = async (item: PengajuanSurat, lamp: LampiranFile) => {
    try {
      const blob = await getLampiranBlob(item.id, lamp.id);
      const objUrl = URL.createObjectURL(blob);
      window.open(objUrl, "_blank", "noopener");
      window.setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Gagal membuka berkas lampiran.",
      );
    }
  };

  /** Cetak surat via browser print dialog — hanya SuratTemplate yang tercetak. */
  const handlePrintSurat = (surat: PengajuanSurat) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    const container = document.getElementById('surat-print-content');
    if (!container) return;
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Surat Resmi — ${surat.jenisSuratNama}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; background: #fff; color: #000; }
    @page { size: A4; margin: 14mm; }
  </style>
</head>
<body>${container.innerHTML}</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  const openActionModal = (item: PengajuanSurat, status: StatusPengajuan) => {
    setSelected(item);
    setTargetStatus(status);
    setCatatan("");
    setModalOpen(true);
  };


  const openPublishModal = (item: PengajuanSurat) => {
    setSelected(item);
    const now = new Date();
    const defaultNomor = `140/${item.jenisSuratKode}/DB/${BULAN_ROMAWI[now.getMonth() + 1]}/${now.getFullYear()}`;
    setNomorSuratInput(item.dokumenHasil?.nomorSurat || defaultNomor);
    setPublishCatatan(
      "Surat telah disetujui, diverifikasi, dan diterbitkan resmi oleh Pemerintah Desa Anabanua.",
    );
    setPublishModalOpen(true);
  };

  const openDeleteModal = (item: PengajuanSurat) => {
    setSelectedToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmStatus = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const updated = await updateStatusPengajuanAdmin(
        selected.id,
        targetStatus,
        catatan,
        "Admin Desa",
      );
      setList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      await refreshList();
      setModalOpen(false);
      showSuccess(
        `Status permohonan surat berhasil diubah ke "${targetStatus.toUpperCase()}"!`,
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal mengubah status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPublish = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const updated = await terbitkanSuratAdmin(
        selected.id,
        nomorSuratInput,
        publishCatatan,
        "Admin Desa Anabanua",
      );
      setList((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      await refreshList();
      setPublishModalOpen(false);
      showSuccess(
        `Surat resmi berhasil diterbitkan dengan Nomor: ${nomorSuratInput}!`,
      );
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Gagal menerbitkan surat.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedToDelete) return;
    setSubmitting(true);
    try {
      await deletePengajuanAdmin(selectedToDelete.id);
      await refreshList();
      setDeleteModalOpen(false);
      setSelectedToDelete(null);
      showSuccess("Permohonan surat berhasil dihapus secara permanen!");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal menghapus pengajuan surat.");
    } finally {
      setSubmitting(false);
    }
  };

  const sortedList = list;

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
          Kelola Permohonan Surat Desa
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Verifikasi berkas lampiran pemohon, pratinjau surat resmi, tetapkan
          Nomor Surat, terbitkan PDF, dan hapus pengajuan yang tidak dibutuhkan.
        </p>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor resi, nama pemohon, atau jenis surat..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-400 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
          {[
            "semua",
            "diajukan",
            "diverifikasi",
            "diproses",
            "selesai",
            "ditolak",
          ].map((st) => (
            <button
              key={st}
              onClick={() => { setFilterStatus(st); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                filterStatus === st
                  ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                  : "bg-neutral-100 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        {/* Sort Control */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-neutral-500 font-medium hidden sm:inline">Urut:</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
            className="text-xs font-bold bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-primary-500 transition-colors"
            aria-label="Urutkan daftar pengajuan"
          >
            <option value="tanggal-desc">Terbaru</option>
            <option value="tanggal-asc">Terlama</option>
            <option value="nama-asc">Nama A→Z</option>
            <option value="nama-desc">Nama Z→A</option>
            <option value="status">Per Status</option>
          </select>
        </div>
      </div>

      {/* Pengajuan Cards List */}
      <div className="space-y-4">
        {sortedList.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs">
            Tidak ada data permohonan surat yang cocok dengan pencarian /
            filter.
          </div>
        ) : (
          sortedList.map((item) => (
            <Card
              key={item.id}
              className="p-5 sm:p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 space-y-4 shadow-sm rounded-2xl"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/80 px-2.5 py-1 rounded-lg border border-primary-200 dark:border-primary-800">
                      {item.nomorResi}
                    </span>
                    <span className="text-xs font-extrabold text-neutral-800 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      {item.jenisSuratKode}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white mt-1.5">
                    {item.jenisSuratNama}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Pemohon:{" "}
                    <strong className="text-neutral-900 dark:text-white font-bold">
                      {item.pemohonNama}
                    </strong>{" "}
                    • Masuk pada{" "}
                    {formatTanggal(item.dibuatPada, { withTime: true })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase border ${getStatusBadgeStyle(item.status)}`}
                  >
                    STATUS: {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(item)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-all shrink-0"
                    title="Hapus Permohonan Surat Ini"
                    aria-label="Hapus Permohonan Surat Ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Isian Form Data - High Text Contrast */}
              <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl space-y-2 text-xs border border-neutral-200 dark:border-neutral-800">
                <p className="font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[11px]">
                  Isian Form Pemohon:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(item.data).map(([key, val]) => (
                    <div
                      key={key}
                      className="bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800/80"
                    >
                      <span className="text-neutral-700 dark:text-neutral-300 font-bold uppercase tracking-wider text-[11px] block">
                        {key.replace(/([A-Z])/g, " $1")}:
                      </span>
                      <span className="font-extrabold text-neutral-950 dark:text-white text-xs sm:text-sm block mt-0.5">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Berkas Lampiran Dokumen Pemohon - Enhanced Attachment Gallery */}
              <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl space-y-3 text-xs border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2 text-[11px]">
                    <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                    Berkas Lampiran Dokumen Pemohon (
                    {item.lampiran?.length || 0} berkas)
                  </p>
                  {item.lampiran && item.lampiran.length > 0 && (
                    <button
                      type="button"
                      onClick={() => void openPreviewAttachment(item, item.lampiran[0])}
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary-700 dark:text-primary-300 hover:text-primary-800 px-2.5 py-1.5 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 rounded-lg border border-primary-300 dark:border-primary-800 transition-colors"
                      title="Pratinjau berkas lampiran pemohon"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Pratinjau
                    </button>
                  )}
                </div>

                {item.lampiran && item.lampiran.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.lampiran.map((lamp, idx) => {
                        return (
                          <div
                            key={idx}
                            className="flex flex-col p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-start gap-2 truncate flex-1">
                                {isLampiranImage(lamp) ? (
                                  <div className="w-8 h-8 rounded bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                                    <FileImage className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  </div>
                                ) : isLampiranPdf(lamp) ? (
                                  <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded bg-primary-100 dark:bg-primary-950 flex items-center justify-center shrink-0">
                                    <Paperclip className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-neutral-900 dark:text-white text-xs truncate">
                                    {lamp.nama}
                                  </p>
                                  {lamp.ukuran && (
                                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                      {(lamp.ukuran / 1024 / 1024).toFixed(2)}{" "}
                                      MB
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => void openPreviewAttachment(item, lamp)}
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 shrink-0 transition-colors"
                                title="Pratinjau berkas"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void openLampiranTab(item, lamp)}
                                className="flex-1 inline-flex items-center justify-center gap-1 text-[10px] font-extrabold text-primary-700 dark:text-primary-300 hover:text-primary-800 px-2 py-1.5 bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 rounded border border-primary-200 dark:border-primary-800 transition-colors"
                                title="Buka di tab baru"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Tab Baru
                              </button>
                              <button
                                type="button"
                                onClick={() => void downloadLampiran(item, lamp)}
                                className="flex-1 inline-flex items-center justify-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded border border-emerald-200 dark:border-emerald-800 transition-colors"
                                title="Download berkas"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {item.lampiran.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => void openPreviewAttachment(item, item.lampiran[0])}
                        >
                          <FileText className="w-3.5 h-3.5" /> Lihat Galeri
                          Lengkap ({item.lampiran.length} berkas)
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-neutral-500 italic text-[11px] py-2">
                    Tidak ada berkas lampiran diunggah.
                  </p>
                )}
              </div>

              {/* Action Buttons & Status Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewSurat(item)}
                  >
                    <Eye className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />{" "}
                    Pratinjau Surat Resmi
                  </Button>

                  {item.dokumenHasil?.nomorSurat && (
                    <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-lg">
                      Nomor: {item.dokumenHasil.nomorSurat}
                    </span>
                  )}
                </div>

                {/* State machine admin action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {item.status === "diajukan" && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openActionModal(item, "diverifikasi")}
                      >
                        Verifikasi Berkas Complete
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openActionModal(item, "ditolak")}
                      >
                        Tolak Permohonan
                      </Button>
                    </>
                  )}

                  {item.status === "diverifikasi" && (
                    <>
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => openActionModal(item, "diproses")}
                      >
                        Proses Pembuatan Surat
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openActionModal(item, "ditolak")}
                      >
                        Tolak
                      </Button>
                    </>
                  )}

                  {item.status === "diproses" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openPublishModal(item)}
                      isLoading={submitting}
                    >
                      <Send className="w-3.5 h-3.5" /> Terbitkan &amp; Atur
                      Nomor Surat
                    </Button>
                  )}

                  {item.status === "selesai" && item.dokumenHasil && (
                    <Link href={`/surat/${item.nomorResi}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <FileText className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />{" "}
                        Lihat Surat Publik
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => openDeleteModal(item)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <PaginationControls page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      {/* Confirmation / Status Change Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Ubah Status Permohonan ke "${targetStatus.toUpperCase()}"`}
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            Nomor Resi:{" "}
            <strong className="text-neutral-900 dark:text-white font-mono text-sm">
              {selected?.nomorResi}
            </strong>
          </p>

          <Textarea
            label="Catatan Admin / Catatan Penolakan (Opsional)"
            placeholder="Contoh: Berkas sudah diverifikasi lengkap / Mohon lengkapi lampiran KK"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmStatus}
              isLoading={submitting}
            >
              Konfirmasi Perubahan Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Publish & Set Nomor Surat Modal */}
      <Modal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Terbitkan Surat Resmi Desa Anabanua"
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            Penerbitan surat resmi untuk pemohon{" "}
            <strong className="text-neutral-900 dark:text-white font-bold">
              {selected?.pemohonNama}
            </strong>{" "}
            ({selected?.jenisSuratNama}).
          </p>

          <Input
            label="Nomor Surat Resmi (Bisa Diubah)"
            placeholder="Contoh: 140/SKH/DB/VIII/2026"
            value={nomorSuratInput}
            onChange={(e) => setNomorSuratInput(e.target.value)}
            required
          />

          <Textarea
            label="Catatan Penerbitan"
            placeholder="Contoh: Surat telah disetujui dan dikirim ke akun pemohon."
            value={publishCatatan}
            onChange={(e) => setPublishCatatan(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setPublishModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmPublish}
              isLoading={submitting}
            >
              <Send className="w-4 h-4" /> Terbitkan &amp; Kirim Surat
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Konfirmasi Hapus Pengajuan Surat"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-200 text-xs">
            <AlertTriangle className="w-6 h-6 shrink-0 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="font-bold">
                Apakah Anda yakin ingin menghapus permohonan surat ini?
              </p>
              <p className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-300">
                Tindakan ini tidak dapat dibatalkan. Seluruh riwayat pengajuan,
                data isian, dan berkas lampiran akan dihapus permanen.
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
            <p>
              <strong>Nomor Resi:</strong>{" "}
              <span className="font-mono">{selectedToDelete?.nomorResi}</span>
            </p>
            <p>
              <strong>Jenis Surat:</strong> {selectedToDelete?.jenisSuratNama}
            </p>
            <p>
              <strong>Nama Pemohon:</strong> {selectedToDelete?.pemohonNama}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              isLoading={submitting}
            >
              <Trash2 className="w-4 h-4" /> Ya, Hapus Permanen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Live Template Preview */}
      <Modal
        isOpen={!!previewSurat}
        onClose={() => setPreviewSurat(null)}
        title={`Pratinjau Surat Resmi — ${previewSurat?.jenisSuratNama}`}
        maxWidth="4xl"
      >
        {previewSurat && (
          <div className="space-y-4">
            <div id="surat-print-content" className="p-2 sm:p-4 bg-neutral-100 dark:bg-neutral-950 rounded-xl overflow-x-auto">
              <SuratTemplate surat={previewSurat} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintSurat(previewSurat)}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Cetak / Export PDF
              </Button>
              <Button variant="ghost" onClick={() => setPreviewSurat(null)}>
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Inline Attachment Preview - Improved */}
      <Modal
        isOpen={!!previewAttachment}
        onClose={closePreviewAttachment}
        title={`Pratinjau Dokumen Lampiran: ${previewAttachment?.nama || ""}`}
        maxWidth="4xl"
      >
        {previewAttachment && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950 flex items-center justify-center shrink-0">
                  {isLampiranPdf(previewAttachment) ? (
                    <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  ) : (
                    <FileImage className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 truncate text-sm">
                    {previewAttachment.nama}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Klik tombol di bawah untuk download atau lihat di tab baru
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full min-h-[400px] max-h-[70vh] bg-neutral-950/90 dark:bg-neutral-950 rounded-2xl flex items-center justify-center overflow-auto p-4 border border-neutral-800">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-3 text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-xs font-semibold">Sedang memuat berkas...</p>
                </div>
              ) : previewUrl ? (
                isLampiranPdf(previewAttachment) ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[600px] rounded-xl border-0"
                    title={previewAttachment.nama}
                  />
                ) : (
                  <DynamicImage
                    src={previewUrl}
                    alt={previewAttachment.nama}
                    className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl"
                  />
                )
              ) : (
                <p className="text-xs font-semibold text-neutral-500">
                  Berkas tidak dapat dimuat. Silakan coba unduh ulang.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                variant="outline"
                onClick={closePreviewAttachment}
                className="text-xs"
              >
                Tutup Pratinjau
              </Button>
              <div className="flex gap-2">
                <a
                  href={previewUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!previewUrl}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900 font-bold text-xs inline-flex items-center justify-center gap-2 border border-primary-300 dark:border-primary-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka di Tab Baru
                </a>
                <a
                  href={previewUrl ?? "#"}
                  download={previewAttachment.nama}
                  aria-disabled={!previewUrl}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Berkas
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
