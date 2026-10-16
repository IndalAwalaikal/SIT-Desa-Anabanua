"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Quote, ArrowRight } from "lucide-react";
import type { PerangkatDesa } from "@/types/desa";
import { useTranslation } from "@/lib/i18n/useTranslation";

/** Inisial nama (maks. 2 huruf) untuk fallback monogram. */
const getInitials = (nama: string) =>
  nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?";

interface KepalaDesaCardProps {
  kepala: PerangkatDesa;
  variant?: "full" | "compact";
  about?: string;
  aboutEyebrow?: string;
  className?: string;
}

export function findKepalaDesa(list: PerangkatDesa[]) {
  return list.find((p) => p.jabatan?.trim().toLowerCase() === "kepala desa");
}

export const KepalaDesaCard: React.FC<KepalaDesaCardProps> = ({
  kepala,
  variant = "full",
  about,
  aboutEyebrow,
  className = "",
}) => {
  const { t } = useTranslation();
  // Mulai dari foto asli bila ada; bila gagal dimuat / tidak ada, tampilkan
  // monogram inisial (bukan avatar eksternal yang diregangkan jadi potret).
  const [src, setSrc] = useState<string>(kepala.foto || "");
  const [failed, setFailed] = useState(!kepala.foto);
  const handleError = () => {
    setFailed(true);
    setSrc("");
  };
  const initials = getInitials(kepala.nama);

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-primary-500/60">
          {failed ? (
            <span
              className="grid h-full w-full place-items-center bg-gradient-to-br from-primary-600 to-primary-900 text-sm font-black text-white"
              aria-label={kepala.nama}
            >
              {initials}
            </span>
          ) : (
            <Image
              src={src}
              alt={kepala.nama}
              fill
              sizes="56px"
              className="object-cover"
              unoptimized
              onError={handleError}
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary-600 dark:text-primary-400">
            {t("KepalaDesa.jabatan")}
          </p>
          <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
            {kepala.nama}
          </p>
        </div>
      </div>
    );
  }

  // Layout Editorial Asimetris
  return (
    <section
      className={`relative grid grid-cols-1 gap-8 shadow-xl shadow-slate-200/50 md:grid-cols-12 md:gap-0 md:rounded-[2rem] dark:shadow-black/20 ${className}`}
    >
      {/* Area Kiri: Teks & Deskripsi */}
      <div className="relative z-10 flex flex-col justify-center rounded-t-[2rem] bg-slate-50 p-8 sm:p-12 md:col-span-7 md:rounded-l-[2rem] md:rounded-tr-none md:pr-16 dark:bg-neutral-900/70">
        {/* Dekorasi dots pattern */}
        <div
          className="pointer-events-none absolute -left-4 top-1/2 hidden h-40 w-40 text-slate-900 opacity-20 md:block dark:text-white"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)",
            backgroundSize: "16px 16px",
          }}
          aria-hidden="true"
        />

        <Quote
          className="absolute right-8 top-8 hidden h-12 w-12 text-primary-200/50 sm:block dark:text-neutral-800"
          aria-hidden="true"
        />

        {aboutEyebrow && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            {aboutEyebrow}
          </span>
        )}

        <h2 className="mt-5 text-2xl font-black leading-tight text-slate-900 sm:text-3xl md:text-4xl dark:text-white">
          {t("Profil.mastheadTitle")}
        </h2>

        {about && (
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-neutral-300">
            {about}
          </p>
        )}

        <Link
          href="/profil/sejarah"
          className="group mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-primary-700 py-3 pl-6 pr-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(11,93,187,0.24)] transition-colors hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-500"
        >
          {t("Profil.route1Title")}
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-1 dark:bg-slate-900/10">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>

      {/* Area Kanan: Foto Bulat Besar + Identitas di bawahnya */}
      <div className="flex flex-col items-center justify-center gap-6 px-8 py-12 md:col-span-5 md:py-16">
        <div className="group relative h-64 w-64 sm:h-80 sm:w-80 lg:h-[22rem] lg:w-[22rem]">
          {/* Border bulat gradien brand */}
          <div
            aria-hidden="true"
            className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-primary-300 via-primary-600 to-primary-900 shadow-[0_18px_45px_rgba(15,44,88,0.28)] dark:from-primary-500 dark:via-primary-700 dark:to-primary-950"
          />
          <div className="absolute inset-0 overflow-hidden rounded-full ring-4 ring-white dark:ring-neutral-900">
            {failed ? (
              /* Fallback rapi: monogram inisial di atas gradien brand,
                 bukan avatar kecil yang diregangkan jadi potret besar. */
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary-500 via-primary-700 to-primary-950">
                <span
                  className="select-none text-7xl font-black tracking-tight text-white/95 sm:text-8xl"
                  aria-label={kepala.nama}
                >
                  {initials}
                </span>
              </div>
            ) : (
              <Image
                src={src}
                alt={`${t("KepalaDesa.jabatan")} ${kepala.nama}`}
                fill
                sizes="(max-width: 640px) 256px, 352px"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                unoptimized
                onError={handleError}
              />
            )}
          </div>
          {/* Lencana verifikasi di tepi lingkaran */}
          <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-primary-600 shadow-lg ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-primary-400 dark:ring-neutral-700">
            <BadgeCheck className="h-6 w-6" aria-hidden="true" />
          </span>
        </div>

        {/* Nama & jabatan — di tengah, di bawah foto bulat */}
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
            {t("KepalaDesa.jabatan")}
          </p>
          <h3 className="mt-1 text-xl font-black leading-tight text-slate-900 dark:text-white sm:text-2xl">
            {kepala.nama}
          </h3>
        </div>
      </div>
    </section>
  );
};
