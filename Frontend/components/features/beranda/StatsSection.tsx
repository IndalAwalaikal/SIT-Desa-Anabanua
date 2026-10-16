"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Users,
  Home,
  BarChart3,
  TreePine,
  Palmtree,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface DemografiData {
  totalPenduduk: number;
  jumlahKK: number;
  kepadatan?: string;
}

interface PotensiWilayah {
  pertanian?: string;
  umkm?: string;
  perkebunan?: string;
}

interface DemografiPotensiSectionProps {
  demografi: DemografiData;
  potensi: PotensiWilayah;
  fotoKepalaDesa: string;
  namaKepalaDesa: string;
  namaDesa: string;
  namaKecamatan: string;
  namaKabupaten: string;
}

function useReveal(delay = 0): [React.RefObject<HTMLDivElement | null>, boolean] {
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
      { threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  // Return tuple (bukan objek berisi ref) agar aturan react-hooks/refs
  // tidak menganggap `visible` sebagai akses ref saat render.
  return [ref, visible];
}

function useCountUp(target: number, active: boolean, duration = 1400) {
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

function StatCard({
  icon: Icon,
  value,
  label,
  delay,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  delay: number;
}) {
  const [ref, visible] = useReveal(delay);
  const count = useCountUp(value, visible);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(16px)",
        transition: "opacity .55s ease, transform .55s ease",
      }}
    >
      <Card hoverable className="h-full border-neutral-200/80 p-4 dark:border-neutral-800 sm:p-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100 dark:bg-primary-950 dark:text-primary-300 dark:ring-primary-900">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-3 text-2xl font-black tabular-nums leading-none tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
          {count.toLocaleString("id-ID")}
        </p>
        <p className="mt-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 sm:text-sm">
          {label}
        </p>
      </Card>
    </div>
  );
}

export const DemografiPotensiSection: React.FC<
  DemografiPotensiSectionProps
> = ({
  demografi,
  potensi,
  fotoKepalaDesa,
  namaKepalaDesa,
  namaDesa,
  namaKecamatan,
  namaKabupaten,
}) => {
  const { t } = useTranslation();
  const [headerRef, headerVisible] = useReveal(0);
  const [logoRef, logoVisible] = useReveal(80);
  const [failedPhoto, setFailedPhoto] = useState('');
  const hasPhoto = Boolean(fotoKepalaDesa) && failedPhoto !== fotoKepalaDesa;
  const kepalaInitials = namaKepalaDesa
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || 'KD';

  const potensiList = [
    { key: "pertanian", label: "Pertanian", icon: TreePine, value: potensi.pertanian },
    { key: "perkebunan", label: "Perkebunan", icon: Palmtree, value: potensi.perkebunan },
    { key: "umkm", label: "UMKM", icon: TrendingUp, value: potensi.umkm },
  ].filter((item) => item.value);

  return (
    <section className="relative overflow-hidden bg-[#f1f7ed] py-8 dark:bg-neutral-950 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-300/70 to-transparent dark:via-neutral-700/70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] dark:opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%230f4c81'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full opacity-[0.07] blur-3xl dark:opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, #37AB34 0%, transparent 70%)",
        }}
      />

      <div className="container-desa relative z-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
          {/* ── KIRI: info ── */}
          <div className="order-2 lg:order-1 lg:col-span-6">
            <div
              ref={headerRef}
              style={{
                opacity: headerVisible ? 1 : 0,
                transform: headerVisible ? "none" : "translateY(16px)",
                transition: "opacity .55s ease, transform .55s ease",
              }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-3.5 py-1.5 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300 sm:text-sm">
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                <span>{t("Home.statsBadge")}</span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-3xl lg:text-[2rem] lg:leading-[1.15]">
                {t("Home.statsTitle")}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-base">
                {t("Home.statsSubtitle")}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4">
              <StatCard
                icon={Users}
                value={demografi.totalPenduduk}
                label={t("Home.statsJiwa")}
                delay={60}
              />
              <StatCard
                icon={Home}
                value={demografi.jumlahKK}
                label={t("Home.statsKepalaKeluarga")}
                delay={120}
              />
            </div>
            <p className="mt-3 text-[11px] text-neutral-500 dark:text-neutral-400">Sumber: data Kampung KB (BKKBN)</p>

            {potensiList.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2.5">
                {potensiList.map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 ring-1 ring-primary-100 dark:bg-primary-950 dark:text-primary-300 dark:ring-primary-900"
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── KANAN: Foto Kepala Desa ── */}
          <div className="order-1 flex justify-center lg:order-2 lg:col-span-6">
            <div
              ref={logoRef}
              className="relative flex flex-col items-center"
              style={{
                opacity: logoVisible ? 1 : 0,
                transform: logoVisible ? "none" : "translateX(24px) scale(.97)",
                transition: "opacity .7s ease .1s, transform .7s ease .1s",
              }}
            >
              <div className="group relative z-10 h-80 w-60 sm:h-[26rem] sm:w-80 lg:h-[30rem] lg:w-[22rem] xl:h-[32rem] xl:w-96">
                <div
                  aria-hidden="true"
                  className="absolute -inset-2 rounded-[50%/45%] bg-gradient-to-br from-primary-300 via-primary-600 to-primary-900 shadow-[0_18px_45px_rgba(36,61,33,0.22)] dark:from-primary-500 dark:via-primary-700 dark:to-primary-950"
                />
                <div className="absolute inset-0 overflow-hidden rounded-[50%/45%] bg-primary-100 ring-4 ring-white transition-transform duration-500 group-hover:scale-[1.02] dark:bg-neutral-800 dark:ring-neutral-900">
                  {hasPhoto ? (
                    <Image
                      src={fotoKepalaDesa}
                      alt={namaKepalaDesa ? `Kepala Desa ${namaKepalaDesa}` : 'Foto Kepala Desa'}
                      fill
                      sizes="(max-width: 640px) 240px, (max-width: 1024px) 320px, 384px"
                      className="object-cover object-top"
                      onError={() => setFailedPhoto(fotoKepalaDesa)}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary-500 via-primary-700 to-primary-950">
                      <span className="text-6xl font-black tracking-tight text-white/95 sm:text-7xl">
                        {kepalaInitials}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <p className="relative z-10 mt-1 text-sm font-bold uppercase tracking-[0.14em] text-primary-700 dark:text-primary-300">
                Kepala Desa
              </p>
              <p className="relative z-10 text-base font-extrabold tracking-wide text-neutral-900 dark:text-neutral-100 sm:text-lg">
                {namaKepalaDesa || namaDesa}
              </p>
              <p className="relative z-10 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {namaDesa}, {namaKecamatan}, {namaKabupaten}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
