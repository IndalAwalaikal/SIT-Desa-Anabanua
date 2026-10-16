"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  ShieldCheck,
  Landmark,
  Award,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getApbdes } from "@/lib/services/statistik.service";
import type { ApbdesRingkasan } from "@/types/statistik";

// ── Scroll-reveal hook ─────────────────────────────────────────────────────────
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => {
            setVisible(true);
          }, delay);

          observer.disconnect();

          return () => clearTimeout(timer);
        }
      },
      {
        threshold: 0.12,
      },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [delay]);

  return { ref, visible };
}

// ── Count-up hook (easeOutCubic) ───────────────────────────────────────────────
function useCountUp(target: number, active: boolean, duration = 1600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    if (target === 0) {
      setValue(0);
      return;
    }

    let raf = 0;

    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);

      setValue(target * eased);

      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

// ── Format nilai dalam juta ────────────────────────────────────────────────────
// 2450 → "Rp 2,45 M"
// 70   → "Rp 70 Jt"
const formatJuta = (juta: number) => {
  if (juta >= 1000) {
    return `Rp ${(juta / 1000).toFixed(2).replace(".", ",")} M`;
  }

  return `Rp ${Math.round(juta).toLocaleString("id-ID")} Jt`;
};

// ── ApbdesSection ──────────────────────────────────────────────────────────────
export const ApbdesSection = () => {
  const { t } = useTranslation();

  const [data, setData] = useState<ApbdesRingkasan | null>(null);

  const {
    ref: headerRef,
    visible: headerVisible,
  } = useReveal(0);

  const {
    ref: panelRef,
    visible: panelVisible,
  } = useReveal(140);

  // ── Fetch data APBDes ────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    getApbdes(new Date().getFullYear())
      .then((d) => {
        if (active) {
          setData(d);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const pendapatan = data?.totalPendapatan ?? 2_450_000_000;
  const belanja = data?.totalBelanja ?? 2_380_000_000;
  const surplus = Math.max(pendapatan - belanja, 0);
  const tahun = data?.tahun ?? new Date().getFullYear();

  // ── Count-up dalam juta ──────────────────────────────────────────────────────
  const pPend = useCountUp(
    pendapatan / 1e6,
    panelVisible,
  );

  const pBelanja = useCountUp(
    belanja / 1e6,
    panelVisible,
  );

  const pSurplus = useCountUp(
    surplus / 1e6,
    panelVisible,
  );

  // ── Progress ─────────────────────────────────────────────────────────────────
  const maxVal = Math.max(
    pendapatan,
    belanja,
    1,
  );

  const pendPct = (pendapatan / maxVal) * 100;
  const belanjaPct = (belanja / maxVal) * 100;

  const surplusPct = Math.max(
    pendPct - belanjaPct,
    2,
  );

  // ── Komitmen ─────────────────────────────────────────────────────────────────
  const komitmen = [
    "Ditetapkan melalui Peraturan Desa",
    "Diaudit Inspektorat Daerah",
    "Disajikan per triwulan",
  ];

  return (
    <section className="relative overflow-hidden bg-[#f1f7ed] py-24 dark:bg-neutral-950 sm:py-28">
      {/* ── Hairline top ─────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-300/70 to-transparent dark:via-neutral-700/70"
      />

      {/* ── Fine dot grid ────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] dark:opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%230f4c81'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="container-desa relative z-10">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">

          {/* ═══════════════════════════════════════════════════════════════════
              KOLOM KIRI
              Border berada langsung di grid supaya sejajar dengan card kanan.
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4">

            {/* 
              PENTING:
              Border ini TIDAK sticky.

              Karena elemen ini langsung berada di posisi awal grid,
              border-top akan sejajar dengan border-top card kanan.
            */}
            <div className="border-t border-neutral-200 pt-7 dark:border-neutral-800">

              {/* 
                Hanya isi yang dibuat sticky.
                Jadi ketika scrolling, garis tetap berada pada posisi
                layout awal dan tidak ikut bergeser.
              */}
              <div
                ref={headerRef}
                className="lg:sticky lg:top-28"
                style={{
                  opacity: headerVisible ? 1 : 0,
                  transform: headerVisible
                    ? "none"
                    : "translateY(20px)",
                  transition:
                    "opacity .6s ease, transform .6s ease",
                }}
              >
                <div className="space-y-7">

                  {/* ── Badge + Heading + Description ─────────────────────── */}
                  <div>
                    <div className="mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-950 dark:text-primary-300">
                      <FileText className="h-3.5 w-3.5" />

                      {t("Apbdes.budgetTransparency") ||
                        "Transparansi Anggaran"}
                    </div>

                    <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-neutral-900 dark:text-white sm:text-4xl lg:text-[2.5rem]">
                      {t("Apbdes.title") || "APBDes"}

                      <span className="block text-primary-600 dark:text-primary-400">
                        buku kas yang terbuka.
                      </span>
                    </h2>

                    <p className="mt-4 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {t("Apbdes.description") ||
                        "Laporan Anggaran Pendapatan dan Belanja Desa sebagai wujud pertanggungjawaban publik kepada seluruh warga."}
                    </p>
                  </div>

                  {/* ── Komitmen ───────────────────────────────────────────── */}
                  <ul className="space-y-3 pt-2">
                    {komitmen.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <svg
                            width="10"
                            height="8"
                            viewBox="0 0 10 8"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M1 4l2.5 2.5L9 1"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>

                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* ── CTA ────────────────────────────────────────────────── */}
                  <Link
                    href="/informasi/apbdes"
                    className="group inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white transition-colors duration-300 hover:bg-primary-600 dark:bg-white dark:text-neutral-900 dark:hover:bg-primary-500 dark:hover:text-white"
                  >
                    <Download className="h-4 w-4" />

                    Unduh Dokumen APBDes

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              KOLOM KANAN — BUKU ANGGARAN
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8">

            {/* ── Card ─────────────────────────────────────────────────────── */}
            <div
              ref={panelRef}
              className="relative rounded-2xl border border-neutral-200 bg-[#fcfcfb] shadow-[0_20px_50px_-24px_rgba(36,61,33,0.12)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
              style={{
                opacity: panelVisible ? 1 : 0,
                transform: panelVisible
                  ? "none"
                  : "translateX(26px)",
                transition:
                  "opacity .65s ease .1s, transform .65s ease .1s",
              }}
            >

              {/* ── Header Buku Anggaran ─────────────────────────────────── */}
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 px-6 pb-5 pt-7 dark:border-neutral-800 sm:px-8">
                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
                    <Landmark className="h-[18px] w-[18px]" />
                  </div>

                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                      Buku Anggaran Desa
                    </p>

                    <p className="text-sm font-bold text-neutral-900 dark:text-white">
                      Tahun Anggaran {tahun}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  DIAUDIT
                </span>
              </div>

              {/* ── Pendapatan ────────────────────────────────────────────── */}
              <div className="px-6 py-6 sm:px-8">
                <div className="flex items-center gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600 dark:text-primary-400">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white">
                        {t("Apbdes.revenue") ||
                          "Pendapatan Desa"}
                      </h3>

                      <p className="font-mono text-xl font-bold tabular-nums text-primary-600 dark:text-primary-400 sm:text-2xl">
                        {formatJuta(pPend)}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
                        style={{
                          width: panelVisible
                            ? `${pendPct}%`
                            : "0%",
                          transition:
                            "width 1.2s cubic-bezier(.22,1,.36,1) .2s",
                        }}
                      />
                    </div>

                    <p className="mt-2.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                      Dana Desa · ADD · Bagi Hasil Pajak ·
                      Pendapatan Asli Desa
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Belanja ───────────────────────────────────────────────── */}
              <div className="border-t border-dashed border-neutral-200 px-6 py-6 dark:border-neutral-800 sm:px-8">
                <div className="flex items-center gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600 dark:text-primary-400">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white">
                        {t("Apbdes.expenses") ||
                          "Belanja Desa"}
                      </h3>

                      <p className="font-mono text-xl font-bold tabular-nums text-primary-600 dark:text-primary-400 sm:text-2xl">
                        {formatJuta(pBelanja)}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
                        style={{
                          width: panelVisible
                            ? `${belanjaPct}%`
                            : "0%",
                          transition:
                            "width 1.2s cubic-bezier(.22,1,.36,1) .35s",
                        }}
                      />
                    </div>

                    <p className="mt-2.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                      Bidang Pemerintahan · Pembangunan ·
                      Pemberdayaan · Darurat
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Surplus / Pembiayaan ──────────────────────────────────── */}
              <div className="border-t border-dashed border-neutral-200 px-6 py-6 dark:border-neutral-800 sm:px-8">
                <div className="flex items-center gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                    <Award className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white">
                        {t("Apbdes.surplus") ||
                          "Surplus / Pembiayaan"}
                      </h3>

                      <p className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-2xl">
                        + {formatJuta(pSurplus)}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{
                          width: panelVisible
                            ? `${surplusPct}%`
                            : "0%",
                          transition:
                            "width 1.2s cubic-bezier(.22,1,.36,1) .5s",
                        }}
                      />
                    </div>

                    <p className="mt-2.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                      Saldo lebih antara pendapatan dan belanja —
                      dialokasikan ke SILPA tahun berikutnya.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Footer ────────────────────────────────────────────────── */}
              <div className="flex items-center justify-between rounded-b-2xl border-t border-neutral-100 bg-neutral-50 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-900/60 sm:px-8">
                <p className="text-[11px] font-medium text-neutral-400">
                  Sumber: Sistem Informasi Keuangan Desa
                </p>

                <span className="font-mono text-[10px] tracking-widest text-neutral-400">
                  ID·SISKEUDES
                </span>
              </div>
            </div>

            {/* ── Link Detail ──────────────────────────────────────────────── */}
            <div className="mt-5 flex items-center justify-end">
              <Link
                href="/informasi/apbdes"
                className="group inline-flex items-center gap-2 text-sm font-bold text-primary-600 transition-all hover:gap-3 dark:text-primary-400"
              >
                Rincian Item Anggaran

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
