'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  ArrowRight,
  MapPin,
    Clock,
  Timer,
  CheckCircle2,
  ChevronRight,
  Star,
} from 'lucide-react';
import type { AgendaKegiatan } from '@/types/statistik';
import { useTranslation } from '@/lib/i18n/useTranslation';

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function kategoriLabel(k: AgendaKegiatan['kategori']) {
  switch (k) {
    case 'musyawarah':    return 'Musyawarah';
    case 'gotong-royong': return 'Gotong Royong';
    case 'pelatihan':     return 'Pelatihan';
    case 'perayaan':      return 'Perayaan';
    default:              return 'Lainnya';
  }
}

function getStatus(tanggalMulai: string, tanggalSelesai?: string) {
  const now = Date.now();
  const start = new Date(tanggalMulai).getTime();
  const end = tanggalSelesai ? new Date(tanggalSelesai).getTime() : start + 86_400_000;
  if (now > end)    return { type: 'done'     as const, label: 'Selesai' };
  if (now >= start) return { type: 'active'   as const, label: 'Berlangsung' };
  const days = Math.ceil((start - now) / 86_400_000);
  if (days === 0)   return { type: 'today'    as const, label: 'Hari Ini' };
  if (days === 1)   return { type: 'tomorrow' as const, label: 'Besok' };
  return            { type: 'upcoming'  as const, label: `${days} hari lagi` };
}

function fmtDay(d: string)   { try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit' }); } catch { return '--'; } }
function fmtMonth(d: string) { try { return new Date(d).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase(); } catch { return ''; } }
function fmtFull(d: string)  { try { return new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; } }
function fmtTime(d: string): string | null {
  try {
    const t = new Date(d);
    const h = t.getHours(), m = t.getMinutes();
    if (h === 0 && m === 0) return null;
    return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')} WITA`;
  } catch { return null; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════════════ */

function useReveal(opts?: { delay?: number; threshold?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => setOn(true), opts?.delay ?? 0); obs.disconnect(); } },
      { threshold: opts?.threshold ?? 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []); // eslint-disable-line
  return { ref, on };
}

function useParallax(speed = 0.02) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf: number;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.transform = `scale(1.04) translateY(${center * speed}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [speed]);
  return ref;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COUNTDOWN (Minimalist plain text string)
   ═══════════════════════════════════════════════════════════════════════════ */

function CountdownText({ target }: { target: string }) {
  const [val, setVal] = useState('');
  useEffect(() => {
    function compute() {
      const delta = new Date(target).getTime() - Date.now();
      if (delta <= 0) { setVal(''); return; }
      const d = Math.floor(delta / 86_400_000);
      const h = Math.floor((delta % 86_400_000) / 3_600_000);
      const m = Math.floor((delta % 3_600_000) / 60_000);
      if (d > 0) {
        setVal(`${d} hari lagi`);
      } else {
        setVal(`${h}j ${m}m lagi`);
      }
    }
    compute();
    const id = setInterval(compute, 30_000);
    return () => clearInterval(id);
  }, [target]);
  return val ? <span>{val}</span> : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: ReturnType<typeof getStatus> }) {
  if (status.type === 'done')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-semibold">
        <CheckCircle2 className="w-3 h-3 text-neutral-500" />{status.label}
      </span>
    );
  if (status.type === 'active')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-900/40 text-[10px] font-bold">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inset-0 rounded-full bg-primary-600 opacity-75" />
          <span className="relative rounded-full h-1.5 w-1.5 bg-primary-600" />
        </span>
        {status.label}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-primary-50/50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30 text-[10px] font-semibold">
      <Timer className="w-3 h-3 text-primary-500" />{status.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURED CARD — Agenda Paling Dekat (Redesigned for Premium Government UI)
   ═══════════════════════════════════════════════════════════════════════════ */

function FeaturedCard({ item, delay }: { item: AgendaKegiatan; delay: number }) {
  const status = getStatus(item.tanggalMulai, item.tanggalSelesai);
  const time   = fmtTime(item.tanggalMulai);
  const { ref, on } = useReveal({ delay });
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)`,
      }}
      onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
      className="relative group"
    >
      <div
        className="rounded-xl border border-l-4 border-neutral-200/80 border-l-primary-600 dark:border-neutral-800 dark:border-l-primary-500 bg-white dark:bg-neutral-900 p-5 sm:p-6 transition-all duration-300"
        style={{
          boxShadow: hovered ? '0 10px 30px rgba(55,171,52,0.06)' : '0 1px 3px rgba(0,0,0,0.02)',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
      >
        {/* Layout details */}
        <div className="flex items-start gap-4">
          {/* Date stamp box */}
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-extrabold shrink-0 border border-primary-100/80 dark:border-primary-900/40 shadow-sm">
            <span className="text-2xl font-black leading-none tracking-tight tabular-nums">{fmtDay(item.tanggalMulai)}</span>
            <span className="text-[10px] uppercase tracking-wider mt-0.5">{fmtMonth(item.tanggalMulai)}</span>
          </div>

          {/* Text block */}
          <div className="flex-1 min-w-0">
            {/* Tag line */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-50/50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border border-primary-100/50 dark:border-primary-900/30 text-[9px] font-bold uppercase tracking-wider">
                <Star className="w-2.5 h-2.5 fill-current text-primary-600" />
                {kategoriLabel(item.kategori)}
              </span>
              <StatusBadge status={status} />
                                                    {status.type !== 'done' && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded ml-auto">
                Agenda Berikutnya
              </span>
            )}
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-snug group-hover:text-primary-600 transition-colors">
              {item.judul}
            </h3>

            {item.deskripsi && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">{item.deskripsi}</p>
            )}
          </div>
        </div>

        {/* Metadata info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-600 shrink-0" />
            <span>{fmtFull(item.tanggalMulai)}{time ? ` · ${time}` : ''}</span>
          </div>
          {item.lokasi && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
              <span className="truncate">{item.lokasi}</span>
            </div>
          )}
        </div>

        {/* Countdown footer */}
        {(status.type === 'upcoming' || status.type === 'today' || status.type === 'tomorrow') && (
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-primary-600" />
              Kegiatan dimulai: <span className="font-semibold text-primary-600 dark:text-primary-400"><CountdownText target={item.tanggalMulai} /></span>
            </span>
                        <Link href="/informasi/agenda">
              <span className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-bold transition-all group">
                Detail Kegiatan <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TIMELINE CARD — Agenda Mendatang Lainnya
   ═══════════════════════════════════════════════════════════════════════════ */

function TimelineCard({ item, delay, isLast }: { item: AgendaKegiatan; delay: number; isLast: boolean }) {
  const status = getStatus(item.tanggalMulai, item.tanggalSelesai);
  const time   = fmtTime(item.tanggalMulai);
  const { ref, on } = useReveal({ delay });
  const [hovered, setHovered] = useState(false);
  const isDone = status.type === 'done';

  return (
    <div
      ref={ref}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
      className="flex gap-4"
    >
      {/* Timeline indicator node */}
      <div className="flex flex-col items-center pt-2">
        <div
          className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-200 ${
            isDone
              ? 'border-neutral-300 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800'
              : 'border-primary-600 bg-primary-600'
          }`}
          style={{ transform: hovered ? 'scale(1.25)' : 'scale(1)' }}
        />
        {!isLast && (
          <div className="flex-1 w-0.5 bg-neutral-200 dark:bg-neutral-800 my-1" />
        )}
      </div>

      {/* Row card */}
      <Link href="/informasi/agenda" className="flex-1 pb-4 group">
        <div
          className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-200 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            borderColor: hovered ? 'rgba(55,171,52,0.4)' : undefined,
            boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.03)' : 'none',
            transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Left item details */}
          <div className="flex items-start gap-3">
            {/* Date badge */}
            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-neutral-50 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 font-bold shrink-0 border border-neutral-200/60 dark:border-neutral-700">
              <span className="text-lg font-black leading-none tabular-nums">{fmtDay(item.tanggalMulai)}</span>
              <span className="text-[9px] uppercase tracking-wider mt-0.5">{fmtMonth(item.tanggalMulai)}</span>
            </div>

            <div className="min-w-0">
              {/* Tag row */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-medium">
                  {kategoriLabel(item.kategori)}
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <StatusBadge status={status} />
              </div>

              {/* Title */}
              <h4 className={`text-sm font-bold leading-snug line-clamp-1 group-hover:text-primary-600 transition-colors ${
                isDone ? 'text-neutral-400 dark:text-neutral-500 line-through decoration-neutral-300' : 'text-neutral-900 dark:text-white'
              }`}>
                {item.judul}
              </h4>

              {/* Info meta */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px] text-neutral-500 dark:text-neutral-400">
                {time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary-600" /> {time}
                  </span>
                )}
                {item.lokasi && (
                  <span className="flex items-center gap-1 truncate max-w-[180px]">
                    <MapPin className="w-3 h-3 text-primary-600 shrink-0" />
                    <span className="truncate">{item.lokasi}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right item actions & timer */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            {!isDone && (
              <span className="text-primary-600 dark:text-primary-400 font-bold text-xs flex items-center gap-1 bg-primary-50 dark:bg-primary-950/60 px-2 py-1 rounded border border-primary-100/80 dark:border-primary-900/40">
                <Timer className="w-3 h-3" />
                <CountdownText target={item.tanggalMulai} />
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all hidden sm:block" />
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export const AgendaSection = ({ agenda }: { agenda: AgendaKegiatan[] }) => {
  const { t } = useTranslation();

    // Destructured so `ref` is handed only to JSX while `on` (a plain boolean)
  // is the sole render-time value — this satisfies react-hooks/refs.
  const { ref: badgeRef, on: badgeOn }     = useReveal({ delay: 0,   threshold: 0.1 });
  const { ref: headRef, on: headOn }       = useReveal({ delay: 60,  threshold: 0.1 });
  const { ref: descRef, on: descOn }       = useReveal({ delay: 120, threshold: 0.1 });
  const { ref: listRef, on: listOn }       = useReveal({ delay: 180, threshold: 0.05 });
  const { ref: footerRef, on: footerOn }   = useReveal({ delay: 240, threshold: 0.05 });
  const { ref: imgRef, on: imgOn }         = useReveal({ delay: 0,   threshold: 0.05 });
  
  const parallaxRef   = useParallax(0.015);

    // Urutkan agar agenda paling dekat — mendatang dulu (termudah di atas), lalu
  // terbaru yang sudah selesai — menjadi `featured`. Data sama persis dengan
  // halaman Agenda Desa; hanya urutan pratinjau beranda yang diatur.
  const ordered = agenda.length > 0
    ? [...agenda].sort((a, b) => {
        const aDone = getStatus(a.tanggalMulai, a.tanggalSelesai).type === 'done';
        const bDone = getStatus(b.tanggalMulai, b.tanggalSelesai).type === 'done';
        if (aDone !== bDone) return aDone ? 1 : -1;               // mendatang lebih dulu
        const da = new Date(a.tanggalMulai).getTime();
        const db = new Date(b.tanggalMulai).getTime();
        return aDone ? db - da : da - db;                          // lewat: terbaru dulu; mendatang: termudah dulu
      })
    : [];
  const featured = ordered[0];
  const rest = ordered.slice(1, 3);
  const displayed = featured ? 1 + rest.length : 0;

  return (
    <section
      className="bg-neutral-50 dark:bg-neutral-900/60 relative overflow-hidden"
      aria-labelledby="agenda-section-heading"
    >
      <div className="flex flex-col lg:flex-row lg:min-h-[660px]">
        {/* ════════════════════════════════════════════════════════════════════
            LEFT: Konten Agenda (Aligned exactly with .container-desa margins)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="relative w-full lg:w-1/2 py-14 sm:py-16 lg:py-20 px-4 sm:px-6 lg:pl-[max(2rem,calc((100vw-1440px)/2+2rem))] lg:pr-14 flex flex-col justify-center z-10">
          
                    {/* Badge */}
          <div
            ref={badgeRef}
            style={{
              opacity: badgeOn ? 1 : 0,
              transform: badgeOn ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-950 dark:text-primary-300 mb-4">
              <Calendar className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              {t('Agenda.badge') || 'Kalender Desa'}
            </span>
          </div>

                    {/* Heading */}
          <div
            ref={headRef}
            style={{
              opacity: headOn ? 1 : 0,
              transform: headOn ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.55s ease 60ms, transform 0.55s ease 60ms',
            }}
          >
            <h2
              id="agenda-section-heading"
              className="text-3xl sm:text-4xl lg:text-[2.5rem] font-extrabold text-neutral-900 dark:text-white leading-[1.2] tracking-tight mb-3"
            >
              Agenda Kegiatan <span className="text-primary-600 dark:text-primary-400">Desa Anabanua</span>
            </h2>
          </div>

                    {/* Subtitle */}
          <div
            ref={descRef}
            style={{
              opacity: descOn ? 1 : 0,
              transform: descOn ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.5s ease 120ms, transform 0.5s ease 120ms',
            }}
          >
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 max-w-lg leading-relaxed">
              {t('Agenda.subtitle') || 'Ikuti jadwal kegiatan kemasyarakatan, musyawarah, dan gotong royong warga Desa Anabanua.'}
            </p>
          </div>

                    {/* Agenda Data Container */}
          <div
            ref={listRef}
            style={{
              opacity: listOn ? 1 : 0,
              transition: 'opacity 0.6s ease 180ms',
            }}
            className="space-y-4"
          >
            {agenda.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
                <Calendar className="w-7 h-7 text-neutral-300 dark:text-neutral-700" />
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Belum ada agenda kegiatan terdekat.</p>
                <Link href="/informasi/agenda">
                  <span className="text-xs text-primary-600 dark:text-primary-400 font-bold hover:underline">
                    Lihat semua agenda →
                  </span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Featured item */}
                {featured && <FeaturedCard item={featured} delay={220} />}

                {/* Timeline title */}
                {rest.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">Agenda Mendatang Lainnya</span>
                    <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
                  </div>
                )}

                {/* Rest of timeline */}
                <div className="space-y-0">
                  {rest.map((item, i) => (
                    <TimelineCard
                      key={item.id}
                      item={item}
                      delay={280 + i * 60}
                      isLast={i === rest.length - 1}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

                    {/* Footer CTA */}
          <div
            ref={footerRef}
            className="mt-6 flex items-center justify-between gap-4 flex-wrap"
            style={{
              opacity: footerOn ? 1 : 0,
              transform: footerOn ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.5s ease 240ms, transform 0.5s ease 240ms',
            }}
          >
            {displayed > 0 && (
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                Menampilkan {displayed} agenda terdekat
              </p>
            )}
            <Link href="/informasi/agenda" className="group">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                {t('Home.tickerSeeAll') || 'Lihat Semua Agenda'}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT: Gambar Statis (Exactly 50% split, clean border)
        ════════════════════════════════════════════════════════════════════ */}
                <div
          ref={imgRef}
          className="relative w-full lg:w-1/2 overflow-hidden h-72 sm:h-96 lg:h-auto order-first lg:order-last border-b lg:border-b-0 lg:border-l border-neutral-100 dark:border-neutral-900"
          style={{
            opacity: imgOn ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        >
          {/* Parallax wrapper with subtle scaling/translation */}
          <div
            ref={parallaxRef}
            className="absolute inset-0 w-full h-full"
            style={{ 
              transformOrigin: 'center center', 
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            <Image
              src="/kantor_desa.png"
              alt="Kantor Desa Anabanua"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={false}
            />
          </div>

          {/* Simple overlay for caption readability */}
          <div aria-hidden="true" className="absolute inset-0 bg-black/10 pointer-events-none" />
          <div aria-hidden="true" className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

          {/* Caption overlay */}
          <div className="absolute bottom-0 inset-x-0 p-6 text-white z-10">
            <p className="text-xs font-bold tracking-wide">📍 Kabupaten Barru</p>
            <p className="text-[10px] text-white/80 mt-0.5">Sulawesi Selatan, Indonesia</p>
          </div>
        </div>
      </div>
    </section>
  );
};
