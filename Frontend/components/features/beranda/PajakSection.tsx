'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Percent,
  ArrowRight,
  FileText,
  CreditCard,
  ShieldCheck,
  Landmark,
  ReceiptText,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { pajakService } from '@/lib/services/pajak.service';
import type { RingkasanPajak } from '@/types/pajak';

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
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
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
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID').format(Math.round(Math.abs(n)));

const features = [
  {
    no: '01',
    title: 'Pajak Bumi & Bangunan (PBB)',
    desc: 'Informasi tagihan, jatuh tempo, dan tata cara pembayaran PBB-P2 warga Desa Anabanua.',
    icon: CreditCard,
  },
  {
    no: '02',
    title: 'Layanan Pajak Online',
    desc: 'E-SPPT dan bukti pembayaran pajak desa dapat diunduh langsung secara digital.',
    icon: Landmark,
  },
  {
    no: '03',
    title: 'Validasi & Keamanan',
    desc: 'Penyimpanan bukti setor pajak terintegrasi dengan kode QR pengaman transparan.',
    icon: ShieldCheck,
  },
];

const highlights = [
  'Bebas antri, bayar kapan saja',
  'Cetak bukti setor instan',
  'Terintegrasi dengan BPHTB',
];

// ── PajakSection ───────────────────────────────────────────────────────────────
export const PajakSection = () => {
  const { t } = useTranslation();
  const [ringkasan, setRingkasan] = useState<RingkasanPajak | null>(null);

  const { ref: headerRef, visible: headerVisible } = useReveal(0);
  const { ref: statsRef, visible: statsVisible } = useReveal(120);
  const featReveal0 = useReveal(220);
  const featReveal1 = useReveal(310);
  const featReveal2 = useReveal(400);
  const featRefs = [featReveal0, featReveal1, featReveal2];

  // Fetch ringkasan pajak (endpoint publik)
  useEffect(() => {
    let active = true;
    pajakService
      .getRingkasan(new Date().getFullYear())
      .then((r) => {
        if (active) setRingkasan(r);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const totalTercatat = useCountUp(ringkasan?.totalTercatat ?? 0, statsVisible);
  const jumlahWajib = useCountUp(ringkasan?.jumlahWajib ?? 0, statsVisible);
  const sisaBelum = useCountUp(ringkasan?.sisaBelumDisetor ?? 0, statsVisible);

  const perJenis = ringkasan?.perJenis ?? [];
  const maxJenis = perJenis.length
    ? Math.max(...perJenis.map((j) => j.total), 1)
    : 1;

  return (
    <section className="relative py-24 sm:py-28 overflow-hidden bg-[#fafaf9] dark:bg-neutral-950">
      {/* Hairline top */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-300/70 dark:via-neutral-700/70 to-transparent"
      />
      {/* Fine dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] dark:opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%230f4c81'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="container-desa relative z-10">
        {/* ── Section header ── */}
        <div
          ref={headerRef}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'none' : 'translateY(18px)',
            transition: 'opacity .6s ease, transform .6s ease',
          }}
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-950 dark:text-primary-300 mb-5">
              <Percent className="w-3.5 h-3.5" />
              {t('Home.pajakApbdesBadge') || 'Transparansi Fiskal'}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.08]">
              {t('Home.pajakTitle') || 'Pajak Desa, tercatat'}
              <span className="block text-primary-600 dark:text-primary-400">
                terbuka &amp; akuntabel.
              </span>
            </h2>
          </div>
          <Link
            href="/informasi/pajak"
            className="group inline-flex items-center gap-2 text-sm font-bold text-primary-700 dark:text-primary-400 hover:gap-3 transition-all self-start lg:self-auto shrink-0"
          >
            <FileText className="w-4 h-4" />
            {t('Home.newsReadMore') || 'Lihat Detail Pajak'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* ══ Kolom kiri: Laporan Kas Pajak ══ */}
          <div className="lg:col-span-7 space-y-6">
            {/* Panel ledger / kuitansi */}
            <div
              ref={statsRef}
              className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-[0_20px_50px_-24px_rgba(36,61,33,0.12)] dark:shadow-none"
              style={{
                opacity: statsVisible ? 1 : 0,
                transform: statsVisible ? 'none' : 'translateY(24px)',
                transition: 'opacity .6s ease .1s, transform .6s ease .1s',
              }}
            >
              {/* Header kuitansi */}
              <div className="flex items-center justify-between px-6 sm:px-8 pt-7 pb-5 border-b border-dashed border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm">
                    <ReceiptText className="w-[18px] h-[18px]" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                      Laporan Kas Pajak
                    </p>
                    <p className="font-bold text-sm text-neutral-900 dark:text-white">
                      Tahun Anggaran {ringkasan?.tahun || new Date().getFullYear()}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  TERVERIFIKASI
                </span>
              </div>

              {/* Grid statistik */}
              <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800">
                <div className="px-4 sm:px-6 py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 mb-2">
                    Wajib Pajak
                  </p>
                  <p className="font-mono text-lg sm:text-xl font-bold tabular-nums text-neutral-900 dark:text-white">
                    {formatRupiah(jumlahWajib)}
                  </p>
                </div>
                <div className="px-4 sm:px-6 py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 mb-2">
                    Total Tercatat
                  </p>
                  <p className="font-mono text-lg sm:text-xl font-bold tabular-nums text-neutral-900 dark:text-white">
                    {totalTercatat > 0 ? `Rp ${formatRupiah(totalTercatat)}` : '—'}
                  </p>
                </div>
                <div className="px-4 sm:px-6 py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 mb-2">
                    Belum Disetor
                  </p>
                  <p
                    className={`font-mono text-lg sm:text-xl font-bold tabular-nums ${
                      ringkasan && ringkasan.sisaBelumDisetor > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-neutral-900 dark:text-white'
                    }`}
                  >
                    {sisaBelum > 0 ? `Rp ${formatRupiah(sisaBelum)}` : '—'}
                  </p>
                </div>
              </div>

              {/* Breakdown per jenis */}
              {perJenis.length > 0 && (
                <div className="px-6 sm:px-8 pb-7 pt-5 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 mb-4">
                    Penerimaan per Jenis Pajak
                  </p>
                  <div className="space-y-3">
                    {perJenis.slice(0, 4).map((j, i) => (
                      <div key={j.jenisPajakId || j.kode} className="flex items-center gap-3">
                        <span className="w-32 shrink-0 truncate text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                          {j.nama}
                        </span>
                        <div className="h-2 flex-1 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
                            style={{
                              width: statsVisible ? `${(j.total / maxJenis) * 100}%` : '0%',
                              transition: `width 1.1s cubic-bezier(.22,1,.36,1) ${i * 90}ms, opacity .4s ease`,
                              opacity: statsVisible ? 1 : 0,
                            }}
                          />
                        </div>
                        <span className="w-24 shrink-0 text-right font-mono text-xs font-bold tabular-nums text-neutral-700 dark:text-neutral-200">
                          {j.total > 0 ? `Rp ${formatRupiah(j.total)}` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer kuitansi */}
              <div className="flex items-center justify-between px-6 sm:px-8 py-3 rounded-b-2xl bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-[11px] text-neutral-400 font-medium">
                  Sumber: Sistem Informasi Pajak Desa
                </p>
                <span className="font-mono text-[10px] text-neutral-400 tracking-widest">
                  ID·SIPD-ANABANUA
                </span>
              </div>
            </div>

{/* Baris layanan bernomor */}
            <div className="space-y-3">
              {features.map((f, idx) => {
                const { ref, visible } = featRefs[idx];
                return (
                  <Link
                    key={f.no}
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    href="/informasi/pajak"
                    aria-label={f.title}
                    className="group flex items-start gap-4 sm:gap-5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 p-4 sm:p-5 hover:border-primary-500/40 hover:shadow-[0_14px_36px_-20px_rgba(55,171,52,0.35)] transition-all duration-300"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateX(0)' : 'translateX(26px)',
                      transition: `opacity .55s ease ${idx * 90}ms, transform .55s ease ${idx * 90}ms`,
                    }}
                  >
                    <span className="font-mono text-xs font-bold text-neutral-300 dark:text-neutral-600 pt-1 group-hover:text-primary-500 transition-colors">
                      {f.no}
                    </span>
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-primary-600/10 text-primary-600 dark:text-primary-300 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white group-hover:scale-105 transition-all duration-300">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[15px] text-neutral-900 dark:text-white">
                        {f.title}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mt-0.5">
                        {f.desc}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 text-primary-500 transition-all duration-300 self-center" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ══ Kolom kanan: Komitmen Desa ══ */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-8">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/40 p-7 sm:p-8">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6">
                <ShieldCheck className="w-4 h-4" />
                Komitmen Desa
              </div>
              <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 leading-relaxed">
                {t('Home.pajakDesc') ||
                  'Transparansi penuh atas kewajiban pajak warga. Bayar tepat waktu untuk mendukung pembangunan desa yang berkelanjutan.'}
              </p>

              <ul className="mt-7 space-y-3.5 pt-6 border-t border-dashed border-neutral-200 dark:border-neutral-700/60">
                {highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300 font-medium"
                  >
                    <span className="flex w-5 h-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
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

              <Link
                href="/informasi/pajak"
                className="group mt-7 flex items-center justify-center gap-2 w-full rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold py-3.5 hover:bg-primary-600 dark:hover:bg-primary-500 dark:hover:text-white transition-colors duration-300"
              >
                Buka Laporan Pajak
                <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
