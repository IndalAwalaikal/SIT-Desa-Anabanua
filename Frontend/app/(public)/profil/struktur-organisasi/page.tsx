"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PublicMasthead } from "@/components/layout/PublicMasthead";
import { AlertCircle, CalendarDays, ShieldCheck, User, Search } from "lucide-react";
import { compareJabatan } from "@/lib/constants/jabatan";
import { getPerangkatDesaList } from "@/lib/services/desa.service";
import type { PerangkatDesa } from "@/types/desa";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function StrukturOrganisasiPage() {
  const { t } = useTranslation();
  const [perangkatList, setPerangkatList] = useState<PerangkatDesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [periodeAktif, setPeriodeAktif] = useState("__semua__");
  const [selectedOfficial, setSelectedOfficial] =
    useState<PerangkatDesa | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPerangkatDesaList();
        setPerangkatList(data ?? []);
        setError(null);
      } catch (err) {
        console.error("Gagal memuat data perangkat desa:", err);
        setError("Gagal memuat data perangkat desa dari server.");
        setPerangkatList([]);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  // Daftar periode unik dari seluruh data (tersortir periode terbaru di depan).
  const periodeOptions = useMemo(() => {
    const byPeriod = new Map<string, number>();
    for (const p of perangkatList) {
      if (!p.periode) continue;
      const awal = parseInt((p.periode.match(/\d{4}/g) ?? [])[0] ?? "", 10) || 0;
      const known = byPeriod.get(p.periode) ?? 0;
      if (awal > known) byPeriod.set(p.periode, awal);
    }
    return Array.from(byPeriod.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([periode]) => periode);
  }, [perangkatList]);

  const isAllPeriode = periodeAktif === "__semua__";
  const periodeTerpilih = isAllPeriode
    ? undefined
    : periodeAktif || periodeOptions[0] || "";
  // Bagan yang ditampilkan hanya untuk periode yang dipilih; "Semua Periode"
  // menampilkan seluruh data agar arsip periode sebelumnya tetap bisa diakses.
  const listPeriode = isAllPeriode
    ? perangkatList
    : perangkatList.filter((p) => p.periode === periodeTerpilih);

  // Susunan rapi mulai dari jabatan paling penting (pilihan di form admin).
  const ranked = [...listPeriode].sort((a, b) =>
    compareJabatan(a.jabatan, b.jabatan),
  );

  const kades =
    ranked.find(
      (p) =>
        p.jabatan.toLowerCase().includes("kepala desa") &&
        !p.jabatan.toLowerCase().includes("dusun"),
    ) || ranked[0];
  const sekdes = ranked.find((p) =>
    p.jabatan.toLowerCase().includes("sekretaris"),
  );

  const kasiKaur = ranked.filter((p) => {
    const j = p.jabatan.toLowerCase();
    return (
      (j.includes("kasi") ||
        j.includes("kaur") ||
        j.includes("kepala seksi") ||
        j.includes("kepala urusan")) &&
      p !== kades &&
      p !== sekdes
    );
  });

  const kadus = ranked.filter((p) => {
    const j = p.jabatan.toLowerCase();
    return p !== kades && p !== sekdes && (j.includes("dusun") || j.includes("kadus"));
  });

  const categorizedIds = new Set<string>(
    [kades?.id, sekdes?.id, ...kasiKaur.map((p) => p.id), ...kadus.map((p) => p.id)].filter(
      (id): id is string => !!id,
    ),
  );
  const remaining = ranked.filter((p) => !categorizedIds.has(p.id));

  const filteredList = ranked.filter((p) => {
    const matchesSearch =
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.jabatan.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === "pimpinan") {
      return matchesSearch && (p === kades || p === sekdes);
    }
    if (selectedCategory === "kasi_kaur") {
      return matchesSearch && kasiKaur.includes(p);
    }
    if (selectedCategory === "kadus") {
      return matchesSearch && kadus.includes(p);
    }
    return matchesSearch;
  });

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <div className="container-desa space-y-10 sm:space-y-12 py-8 sm:py-12">
        {/* Header Masthead */}
        <PublicMasthead
          eyebrow={t('StrukturOrganisasi.eyebrow', 'TATALAKSANA & ORGANISASI PEMERINTAHAN DESA')}
          title={t('StrukturOrganisasi.title', 'Struktur & Aparatur Pemerintah Desa Anabanua')}
          description={t('StrukturOrganisasi.description', 'Jajaran pimpinan, sekretariat, kepala seksi, kepala urusan, dan kepala dusun yang berkomitmen melayani warga Desa Anabanua dengan profesional, transparan, dan akuntabel.')}
          image="/kantor_desa.png"
        />

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-16">
            <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-neutral-500">
              Memuat data aparatur desa...
            </p>
          </div>
        )}

        {/* Gagal terhubung ke server data */}
        {!loading && error && (
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-300">
                {error}
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                Data yang ditambahkan di dashboard admin tidak akan tampil di
                halaman ini selama backend tidak dapat diakses. Pastikan layanan
                backend berjalan dan proxy <code>/api/*</code> pada Next.js
                mengarah ke alamat yang benar.
              </p>
            </div>
          </div>
        )}

        {/* Data kosong (belum ada perangkat desa) */}
        {!loading && !error && perangkatList.length === 0 && (
          <div className="text-center py-16 space-y-2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <User className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="font-bold text-neutral-700 dark:text-neutral-200">
              Belum ada data perangkat desa.
            </p>
            <p className="text-xs text-neutral-500">
              Silakan tambahkan data melalui halaman dashboard admin.
            </p>
          </div>
        )}

        {/* Pilih Periode (arsip struktur organisasi per masa jabatan) */}
        {!loading && !error && periodeOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 mr-1">
              <CalendarDays className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Periode Jabatan
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPeriodeAktif("__semua__")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                isAllPeriode
                  ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              Semua Periode
            </button>
            {periodeOptions.map((periode) => {
              const active =
                !isAllPeriode &&
                (periodeAktif === periode ||
                  (!periodeAktif && periode === periodeOptions[0]));
              return (
                <button
                  key={periode}
                  type="button"
                  onClick={() => setPeriodeAktif(periode)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    active
                      ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {periode}
                </button>
              );
            })}
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: "semua", label: "Semua Aparatur" },
              { id: "pimpinan", label: "Pimpinan Desa" },
              { id: "kasi_kaur", label: "Kasi & Kaur" },
              { id: "kadus", label: "Kepala Dusun" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === tab.id
                    ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                    : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('StrukturOrganisasi.searchPlaceholder', 'Cari nama atau jabatan...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-900 dark:text-white border border-transparent focus:border-primary-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HIERARCHY TREE DISPLAY (When "Semua" is active) - IMPROVED */}
        {/* ========================================================================= */}
        {!loading && !error && perangkatList.length > 0 && (
          <>
        {selectedCategory === "semua" && !searchQuery ? (
          <div className="space-y-10">
            {/* Judul Bagan & Periode Aktif */}
            <div className="text-center space-y-1 pt-2">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                Bagan Struktur Organisasi
              </h2>
              <p className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 dark:text-primary-400">
                <CalendarDays className="w-4 h-4" />
                {isAllPeriode
                  ? "Seluruh Periode Jabatan"
                  : periodeTerpilih
                    ? `Periode ${periodeTerpilih}`
                    : "Periode tidak diketahui"}
              </p>
            </div>

            {/* TIER 1: KEPALA DESA SPOTLIGHT CARD */}
            {kades && (
              <div className="relative">
                <div className="flex justify-center">
                  <div className="rounded-3xl border-2 border-primary-200 dark:border-primary-800 shadow-xl max-w-sm w-full">
                    <Card className="p-6 sm:p-8 rounded-[22px] bg-white dark:bg-neutral-900 text-center relative overflow-hidden space-y-4">
                      <div className="absolute top-4 right-4">
                        <span className="bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Pimpinan Resmi
                        </span>
                      </div>

                      <div className="relative w-32 h-32 mx-auto rounded-full shadow-lg">
                        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-primary-300 dark:border-primary-700">
                          <Image
                            src={kades.foto}
                            alt={kades.nama}
                            fill
                            sizes="128px"
                            className="object-cover hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                          {kades.nama}
                        </h2>
                        <p className="text-sm font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                          {kades.jabatan}
                        </p>
                        {kades.nip && kades.nip !== "-" && (
                          <p className="text-xs font-mono text-neutral-400">
                            NIP. {kades.nip}
                          </p>
                        )}
                        <div className="pt-2">
                          <span className="inline-block bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 text-[11px] font-bold px-3 py-1 rounded-full">
                            Masa Jabatan: {kades.periode}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs italic text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                        &quot;Melayani masyarakat Desa Anabanua dengan ikhlas,
                        transparan, dan berkeadilan demi mewujudkan desa yang
                        maju dan sejahtera.&quot;
                      </p>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOfficial(kades)}
                        className="w-full text-xs font-bold border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-950"
                      >
                        <User className="w-3.5 h-3.5" /> Lihat Detail Biodata
                      </Button>
                    </Card>
                  </div>
                </div>

                {/* Vertical Tree Connector Line */}
                <div className="flex justify-center pt-6">
                  <div className="w-0.5 h-12 bg-gradient-to-b from-primary-500 to-transparent" />
                </div>
              </div>
            )}

            {/* Connection Splitter - dibagi ke sekretaris dan langsung ke kasi/kaur */}
            <div className="relative px-4">
              <div className="flex justify-center">
                <div className="w-full max-w-4xl h-0.5 bg-gradient-to-r from-transparent via-primary-300 dark:via-primary-800 to-transparent" />
              </div>
            </div>

            {/* TIER 2: SEKRETARIS DESA */}
            {sekdes && (
              <div className="flex justify-center">
                <div className="max-w-sm w-full">
                  <div className="relative pt-6">
                    <div className="flex justify-center">
                      <div className="w-0.5 h-6 bg-primary-300 dark:bg-primary-800" />
                    </div>
                  </div>

                  <Card className="p-6 rounded-2xl bg-white dark:bg-neutral-900 text-center space-y-3 border-2 border-primary-100 dark:border-primary-900 shadow-lg hover:shadow-xl transition-all">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="inline-block bg-primary-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        SEKPROV
                      </span>
                    </div>

                    <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-primary-500/30 shadow-md">
                      <Image
                        src={sekdes.foto}
                        alt={sekdes.nama}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                        {sekdes.nama}
                      </h3>
                      <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">
                        {sekdes.jabatan}
                      </p>
                      {sekdes.nip && sekdes.nip !== "-" && (
                        <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                          NIP. {sekdes.nip}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOfficial(sekdes)}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Detail Profil →
                    </Button>
                  </Card>
                </div>
              </div>
            )}

            {/* TIER 3: KASI & KAUR SECTION */}
            <div className="space-y-6 pt-8 border-t-2 border-dashed border-neutral-300 dark:border-neutral-700">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Jajaran Kepala Seksi (Kasi) &amp; Kepala Urusan (Kaur)
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Unsur Pelaksana Teknis dan Sekretariat Desa Anabanua
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {kasiKaur.length > 0 ? (
                  kasiKaur.map((official) => (
                    <Card
                      key={official.id}
                      className="p-5 text-center space-y-3 hover:border-primary-500 hover:shadow-lg transition-all group cursor-pointer border-2 border-primary-200 dark:border-primary-800"
                      onClick={() => setSelectedOfficial(official)}
                    >
                      <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-primary-200 dark:border-primary-900 group-hover:border-primary-500 group-hover:scale-110 transition-all shadow-md">
                        <Image
                          src={official.foto}
                          alt={official.nama}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2">
                          {official.nama}
                        </h4>
                        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 line-clamp-2">
                          {official.jabatan}
                        </p>
                        {official.nip && official.nip !== "-" && (
                          <p className="text-[10px] font-mono text-neutral-400">
                            NIP. {official.nip}
                          </p>
                        )}
                      </div>
                      <span className="inline-block text-[10px] font-bold bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-full border border-primary-200 dark:border-primary-800">
                        {official.periode}
                      </span>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-neutral-500">
                    <p className="text-sm font-semibold">
                      Belum ada data Kasi/Kaur
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* TIER 4: KEPALA DUSUN & WILAYAH */}
            {kadus.length > 0 && (
              <div className="space-y-6 pt-8 border-t-2 border-dashed border-neutral-300 dark:border-neutral-700">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                    Kepala Dusun &amp; Wilayah Desa
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Unsur Pelaksana Kewilayahan Desa Anabanua
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {kadus.map((official) => (
                    <Card
                      key={official.id}
                      className="p-5 text-center space-y-3 hover:border-primary-500 hover:shadow-lg transition-all group cursor-pointer border-2 border-primary-200 dark:border-primary-900"
                      onClick={() => setSelectedOfficial(official)}
                    >
                      <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-primary-300 dark:border-primary-800 group-hover:border-primary-500 group-hover:scale-110 transition-all shadow-md">
                        <Image
                          src={official.foto}
                          alt={official.nama}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors">
                          {official.nama}
                        </h4>
                        <p className="text-xs font-bold text-primary-600 dark:text-primary-400">
                          {official.jabatan}
                        </p>
                      </div>
                      <span className="inline-block text-[10px] font-bold bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-full border border-primary-200 dark:border-primary-800">
                        {official.periode}
                      </span>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* TIER 5: APARATUR LAINNYA (staf, bendahara, dsb. yang tidak termasuk 4 kategori di atas) */}
            {remaining.length > 0 && (
              <div className="space-y-6 pt-8 border-t-2 border-dashed border-neutral-300 dark:border-neutral-700">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                    Aparatur Lainnya
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Staf dan tim pendukung pemerintahan desa.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {remaining.map((official) => (
                    <Card
                      key={official.id}
                      className="p-5 text-center space-y-3 hover:border-primary-500 hover:shadow-lg transition-all group cursor-pointer border-2 border-primary-200 dark:border-primary-800"
                      onClick={() => setSelectedOfficial(official)}
                    >
                      <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-primary-300 dark:border-primary-800 group-hover:border-primary-500 group-hover:scale-110 transition-all shadow-md">
                        <Image
                          src={official.foto}
                          alt={official.nama}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2">
                          {official.nama}
                        </h4>
                        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 line-clamp-2">
                          {official.jabatan}
                        </p>
                        {official.nip && (
                          <p className="text-[10px] font-mono text-neutral-400">
                            NIP. {official.nip}
                          </p>
                        )}
                      </div>
                      <span className="inline-block text-[10px] font-bold bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-full border border-primary-200 dark:border-primary-800">
                        {official.periode}
                      </span>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* FILTERED / SEARCHED GRID DISPLAY */
          /* ========================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredList.length === 0 ? (
              <div className="col-span-full text-center text-sm text-neutral-500 py-16 space-y-2">
                <User className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="font-bold">Aparatur desa tidak ditemukan.</p>
                <p className="text-xs">
                  Coba kata kunci pencarian atau kategori lain.
                </p>
              </div>
            ) : (
              filteredList.map((official) => (
                <Card
                  key={official.id}
                  className="p-5 text-center space-y-3 hover:border-primary-500 transition-all group cursor-pointer"
                  onClick={() => setSelectedOfficial(official)}
                >
                  <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-primary-500/20 group-hover:border-primary-500 group-hover:scale-105 transition-all shadow-md">
                    <Image
                      src={official.foto}
                      alt={official.nama}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
                      {official.nama}
                    </h3>
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 line-clamp-1">
                      {official.jabatan}
                    </p>
                    {official.nip && official.nip !== "-" && (
                      <p className="text-[11px] font-mono text-neutral-400">
                        NIP. {official.nip}
                      </p>
                    )}
                  </div>
                  <span className="inline-block text-[10px] font-bold bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 px-2.5 py-1 rounded-full">
                    Periode {official.periode}
                  </span>
                </Card>
              ))
            )}
          </div>
        )}
          </>
        )}

        {/* Modal Detail Aparatur */}
        <Modal
          isOpen={!!selectedOfficial}
          onClose={() => setSelectedOfficial(null)}
          title={`Profil Aparatur — ${selectedOfficial?.nama || ""}`}
          maxWidth="md"
        >
          {selectedOfficial && (
            <div className="text-center space-y-5 py-2">
              <div className="relative w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-primary-500 to-primary-700 shadow-xl">
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-neutral-900">
                  <Image
                    src={selectedOfficial.foto}
                    alt={selectedOfficial.nama}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {selectedOfficial.nama}
                </h3>
                <p className="text-sm font-extrabold text-primary-600 dark:text-primary-400 uppercase mt-0.5">
                  {selectedOfficial.jabatan}
                </p>
                {selectedOfficial.nip && selectedOfficial.nip !== "-" && (
                  <p className="text-xs font-mono text-neutral-500 mt-1">
                    NIP. {selectedOfficial.nip}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-left p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                    Periode Jabatan
                  </span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    {selectedOfficial.periode}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                    Status Pengangkatan
                  </span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    SK Resmi Pemkab
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                    Lokasi Tugas
                  </span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    Kantor Desa Anabanua, Kec. Barru
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedOfficial(null)}
              >
                Tutup Biodata
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
