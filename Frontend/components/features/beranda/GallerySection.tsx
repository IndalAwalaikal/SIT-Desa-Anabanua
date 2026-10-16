"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Image as ImageIcon,
  Camera,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { GaleriAlbum } from "@/types/galeri";
import { getGaleriAlbumPreview } from "@/lib/services/galeri.service";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface GallerySectionProps {
  gallery: GaleriAlbum[];
}

const MAX_ITEMS = 12;
/** Auto-advance setiap 1.5 detik */
const ROTATE_MS = 2500;
/** Polling sinkron data galeri dari DB setiap 45 detik */
const SYNC_MS = 45_000;

/** Normalise items ke array yang selalu punya minimal 3 entri */
function normalise(raw: GaleriAlbum[]): GaleriAlbum[] {
  const src = (raw || []).filter((g) => g?.coverFoto).slice(0, MAX_ITEMS);
  if (src.length === 0) return [];
  // Butuh minimal 3 item agar tampilan 3-kartu bisa berjalan
  const out = [...src];
  while (out.length < 3) out.push(...src);
  return out;
}

function fmtDate(d: string, locale: string): string {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Kartu Individual ─────────────────────────────────────────────────────────
interface CardProps {
  item: GaleriAlbum;
  /** -1 = kiri, 0 = tengah (aktif), 1 = kanan */
  position: -1 | 0 | 1;
  locale: string;
  onClick: () => void;
}

const CARD_TRANSITION = "transform 620ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 500ms ease, filter 500ms ease";

const CARD_POS_STYLE: Record<string, React.CSSProperties> = {
  "-1": {
    transform: "translateX(-66%) scale(0.76) rotateY(10deg)",
    opacity: 0.55,
    filter: "brightness(0.5) blur(1px)",
    zIndex: 1,
    pointerEvents: "auto",
    cursor: "pointer",
  },
  "1": {
    transform: "translateX(66%) scale(0.76) rotateY(-10deg)",
    opacity: 0.55,
    filter: "brightness(0.5) blur(1px)",
    zIndex: 1,
    pointerEvents: "auto",
    cursor: "pointer",
  },
  "0": {
    transform: "translateX(0) scale(1)",
    opacity: 1,
    filter: "brightness(1) blur(0px)",
    zIndex: 10,
    pointerEvents: "auto",
    cursor: "default",
  },
};

const GalleryCard: React.FC<CardProps> = ({ item, position, locale, onClick }) => {
  const isCenter = position === 0;
  const [hovered, setHovered] = useState(false);

  const dynamicCenterStyle: React.CSSProperties = isCenter
    ? {
        transform: hovered ? "translateX(0) scale(1.055)" : "translateX(0) scale(1)",
      }
    : {};

  return (
    <div
      className="absolute"
      style={{
        /* Ukuran & posisi dasar: kartu tengah */
        width: "min(500px, 82vw)",
        height: "min(340px, 56vw)",
        top: "50%",
        left: "50%",
        marginTop: "calc(min(340px, 56vw) / -2)",
        marginLeft: "calc(min(500px, 82vw) / -2)",
        transition: CARD_TRANSITION,
        willChange: "transform, opacity",
        ...CARD_POS_STYLE[String(position)],
        ...dynamicCenterStyle,
      }}
      onClick={onClick}
      onMouseEnter={() => isCenter && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow halo on center hover */}
      <div
        className="absolute -inset-2 rounded-3xl pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, #5bc45655, #2c902933)",
          opacity: isCenter && hovered ? 1 : 0,
          transition: "opacity 400ms ease",
          filter: "blur(8px)",
        }}
      />

      <div
        className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl"
        style={{
          boxShadow: isCenter
            ? "0 25px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)"
            : "0 12px 30px -8px rgba(0,0,0,0.5)",
        }}
      >
        <Image
          src={item.coverFoto}
          alt={item.judul}
          fill
          sizes="(max-width: 640px) 82vw, 500px"
          className="object-cover"
          style={{
            transform: isCenter && hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          priority={isCenter}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Kategori badge */}
        {item.kategori && isCenter && (
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-600/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
              <Camera className="w-3 h-3" />
              {item.kategori}
            </span>
          </div>
        )}

        {/* Caption — hanya kartu tengah */}
        {isCenter && (
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
            <p className="text-white text-[11px] sm:text-xs mb-1.5 font-semibold tracking-widest uppercase drop-shadow-md">
              {fmtDate(item.tanggal, locale)}
            </p>
            <h3 className="font-extrabold text-white text-lg sm:text-2xl leading-snug line-clamp-2 drop-shadow-lg">
              {item.judul}
            </h3>
            {item.deskripsi && (
              <p className="hidden sm:block text-neutral-300/75 text-xs sm:text-sm mt-1.5 line-clamp-2">
                {item.deskripsi}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Section Utama ────────────────────────────────────────────────────────────
export const GallerySection: React.FC<GallerySectionProps> = ({ gallery }) => {
  const { t, locale } = useTranslation();
  const [items, setItems] = useState<GaleriAlbum[]>(() => normalise(gallery));
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  // Tunda polling dan animasi sampai galeri mendekati viewport.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "200px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // ── Sync data dari DB galeri kegiatan ──────────────────────────────────
  useEffect(() => {
    const norm = normalise(gallery);
    setItems(norm);
    setActiveIdx(0);
  }, [gallery]);

  useEffect(() => {
    if (!isVisible) return;

    const sync = setInterval(() => {
      getGaleriAlbumPreview(12)
        .then((list) => {
          const next = normalise(list);
          if (next.length > 0) {
            setItems((prev) => {
              const prevIds = prev.map((i) => i.id).join(",");
              const nextIds = next.map((i) => i.id).join(",");
              return prevIds === nextIds ? prev : next;
            });
          }
        })
        .catch(() => {});
    }, SYNC_MS);

    return () => clearInterval(sync);
  }, [isVisible]);

  // ── Auto-rotate ────────────────────────────────────────────────────────
  const advance = useCallback(
    (dir: 1 | -1 = 1) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setProgressKey((k) => k + 1);
      setActiveIdx((i) => (i + dir + items.length) % items.length);
      setTimeout(() => setIsAnimating(false), 650);
    },
    [isAnimating, items.length],
  );

  useEffect(() => {
    if (paused || !isVisible || items.length < 2) return;
    const tmr = setInterval(() => advance(1), ROTATE_MS);
    return () => clearInterval(tmr);
  }, [paused, isVisible, advance, items.length]);

  // Pause saat tab tidak aktif
  useEffect(() => {
    const fn = () => setPaused(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, []);

  const prev = useCallback(() => advance(-1), [advance]);
  const next = useCallback(() => advance(1), [advance]);

  // ── Kartu yang terlihat (kiri, tengah, kanan) ──────────────────────────
  const visibleCards = useMemo(() => {
    const n = items.length;
    return [
      { item: items[(activeIdx - 1 + n) % n], index: (activeIdx - 1 + n) % n, position: -1 as const },
      { item: items[activeIdx], index: activeIdx, position: 0 as const },
      { item: items[(activeIdx + 1) % n], index: (activeIdx + 1) % n, position: 1 as const },
    ];
  }, [items, activeIdx]);

  // ── Empty state ────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900/30">
        <div className="container-desa text-center">
          <p className="text-sm text-neutral-500">
            {t("Galeri.empty", "Belum ada dokumentasi galeri.")}
          </p>
        </div>
      </section>
    );
  }

  const DOT_MAX = Math.min(items.length, 10);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-20 bg-[#f1f7ed] dark:bg-neutral-950"
      aria-label="Galeri Kegiatan Desa Anabanua"
    >
      {/* Orbs dekoratif latar belakang */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, #2c90291a 0%, transparent 65%)",
          filter: "blur(60px)",
          top: "-80px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, #5bc45610 0%, transparent 65%)",
          filter: "blur(60px)",
          bottom: "-60px",
        }}
      />

      {/* ── Header terpusat ──────────────────────────────────────────── */}
      <div className="relative z-10 text-center px-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-950 dark:text-primary-300 mb-4">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{t("Galeri.badge", "DOKUMENTASI DESA")}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 dark:text-white leading-tight tracking-tight">
          {t("Galeri.title", "Galeri Kegiatan")}
        </h2>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary-600 dark:text-primary-400 leading-tight tracking-tight mt-0.5">
          {t("Galeri.titleAlt", "& Momen Desa Anabanua")}
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-4 max-w-lg mx-auto leading-relaxed">
          {t(
            "Galeri.subtitle",
            "Kumpulan dokumentasi kegiatan, tradisi, dan kehidupan masyarakat Desa Anabanua.",
          )}
        </p>
      </div>

      {/* ── 3D Carousel ──────────────────────────────────────────────── */}
      <div
        className="relative z-10 mx-auto"
        style={{ height: "min(380px, 64vw)", maxWidth: "100%" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Perspektif 3D */}
        <div
          className="absolute inset-0"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
        >
          {visibleCards.map(({ item, index, position }) => (
            <GalleryCard
              key={`${item.id}-${index}`}
              item={item}
              position={position}
              locale={locale}
              onClick={() => {
                if (position === -1) prev();
                else if (position === 1) next();
              }}
            />
          ))}
        </div>

        {/* Tombol navigasi */}
        <button
          type="button"
          onClick={prev}
          className="absolute left-3 sm:left-6 lg:left-10 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-neutral-800 dark:text-white border border-neutral-200 dark:border-white/15 backdrop-blur-md shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Foto sebelumnya"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-3 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-neutral-800 dark:text-white border border-neutral-200 dark:border-white/15 backdrop-blur-md shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Foto berikutnya"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Dots indicator ───────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-center gap-2 mt-8">
        {Array.from({ length: DOT_MAX }, (_, i) => {
          const isActive = i === activeIdx % DOT_MAX;
          return (
            <button
              key={i}
              type="button"
              aria-label={`Ke slide ${i + 1}`}
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setProgressKey((k) => k + 1);
                  setActiveIdx(i);
                  setTimeout(() => setIsAnimating(false), 650);
                }
              }}
              style={{
                transition: "width 350ms ease, background-color 350ms ease",
                width: isActive ? "2rem" : "0.45rem",
                height: "0.4rem",
                borderRadius: "9999px",
                backgroundColor: isActive
                  ? "var(--color-primary-500)"
                  : "rgba(0,0,0,0.15) dark:rgba(255,255,255,0.22)",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
              className={
                isActive
                  ? "bg-primary-600 dark:bg-primary-400"
                  : "bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400"
              }
            />
          );
        })}
      </div>

      {/* ── Auto-progress bar ─────────────────────────────────────────── */}
      <div className="relative z-10 flex justify-center mt-3">
        <div
          className="w-36 h-0.5 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800"
        >
          {!paused && (
            <div
              key={progressKey}
              className="h-full rounded-full bg-primary-600 dark:bg-primary-400"
              style={{
                animation: `galleryProgress ${ROTATE_MS}ms linear forwards`,
              }}
            />
          )}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex justify-center mt-10">
        <Link
          href="/galeri"
          className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            boxShadow: "0 8px 30px rgba(55,171,52,0.3)",
          }}
        >
          {t("Galeri.seeAll", "Lihat Semua Galeri")}
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Keyframe untuk progress bar */}
      <style>{`
        @keyframes galleryProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </section>
  );
};
