"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import {
  ArrowRight,
  Building2,
  Compass,
  History,
  Mail,
  Map,
  MapPin,
  Phone,
  Quote,
  Users,
} from "lucide-react";
import type { ProfilDesa, PerangkatDesa } from "@/types/desa";
import { useTranslation } from "@/lib/i18n/useTranslation";

export const ProfilRingkasanSection = ({ profil }: { profil: ProfilDesa; perangkat?: PerangkatDesa[] }) => {
  const { t } = useTranslation();

    // Preview sejarah yang cukup panjang namun tetap ringkas untuk tampilan beranda.
  const sejarahPreview = "Desa Anabanua merupakan hasil pemekaran dari Desa Palakka. Desa Persiapan Latuttu dibentuk pada 1990, berstatus definitif pada 1993, dan mengadakan pemilihan kepala desa pertama pada 1994.";

  // Pecah preview jadi dua paragraf agar tidak kelihatan kering / "kempes".
  const sejarahParts = sejarahPreview.split(/(?<=[.!?])\s+/u).filter(Boolean);
  const sejarahParagraphs =
    sejarahParts.length < 2
      ? [sejarahPreview]
      : [
          sejarahParts.slice(0, Math.ceil(sejarahParts.length / 2)).join(' '),
          sejarahParts.slice(Math.ceil(sejarahParts.length / 2)).join(' '),
        ];

  // Fakta-fakta kunci desa yang ditampilkan sebagai "quick info"
  const quickFacts = [
    {
      icon: MapPin,
      label: t("Home.profilFactLuas") || "Luas Wilayah",
      value: "± 20 km²",
    },
    {
      icon: Compass,
      label: t("Home.profilFactDusun") || "Dusun",
      value: `${profil.jumlahDusun ?? 4}`,
    },
    {
      icon: Users,
      label: "Jiwa (data Kampung KB)",
      value: "2.419",
    },
    {
      icon: History,
      label: t("Home.profilFactRT") || "RT",
      value: '14',
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-neutral-950 relative overflow-hidden">
      {/* Subtle Background Pattern - Bukan gradien warna-warni */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] opacity-50 pointer-events-none"
      />

      <div className="container-desa relative space-y-16">
        {/* ===== Section Header ===== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-950 dark:text-primary-300 mb-4">
              <Compass className="w-3.5 h-3.5" />
              <span>{t("Home.profilBadge") || "PROFIL DESA"}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {t("Home.profilTitle") || "Profil Desa Anabanua"}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-3 max-w-xl text-base">
              {t("Home.profilSubtitle") ||
                "Mengenal lebih dekat sejarah, visi, dan potensi wilayah Desa Anabanua."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link href="/profil" className="w-full sm:w-auto">
              <Button
                variant="primary"
                className="rounded-lg shadow-sm hover:shadow-md transition-all px-5 py-2.5"
              >
                {t("Home.profilExplore") || "Profil Lengkap"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/profil/sejarah" className="w-full sm:w-auto">
              <Button variant="outline" className="rounded-lg px-5 py-2.5">
                {t("Home.profilReadHistory") || "Baca Sejarah"}
              </Button>
            </Link>
          </div>
        </div>

        {/* ===== Two-panel showcase: image | content ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Left: Hero image dengan overlay identitas + kontak singkat */}
          <div className="lg:col-span-5 relative group rounded-3xl overflow-hidden shadow-xl ring-1 ring-neutral-200 dark:ring-neutral-800 min-h-[420px]">
            <Image
              src="/kantor_desa.png"
              alt={`Kantor ${profil.nama || "Desa Anabanua"}`}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Bottom-to-top gradient agar teks overlay jelas dibaca */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            {/* Floating Location Tag */}
            <div className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-md border border-white/30">
              <MapPin className="w-3.5 h-3.5" />
              {profil.kecamatan || "Kecamatan Barru"}
            </div>

            {/* Bottom identity + kontak singkat (langsung logo, tidak ada border bundar) */}
            <div className="absolute bottom-5 left-5 right-5 space-y-2.5 text-white">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-white/90 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-base font-bold leading-tight truncate">
                    {profil.nama || "Desa Anabanua"}
                  </h4>
                  <p className="text-xs text-white/80">
                    {profil.kabupaten || "Barru"}
                  </p>
                </div>
              </div>
              {/* Kontak singkat: telepon & email — memperkaya sisi profil */}
              {(profil.telepon || profil.email) && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/85">
                  {profil.telepon && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {profil.telepon}
                    </span>
                  )}
                  {profil.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {profil.email}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

                    {/* Right: Rich content card */}
          <div className="lg:col-span-7 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 md:p-10 flex flex-col relative overflow-hidden">
            {/* Top accent bar — membedakan kartu & memperkaya hierarchy visual */}
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-1.5 rounded-b-2xl bg-gradient-to-r from-primary-600 to-accent-500"
            />
            {/* Decorative watermark (visual depth, tidak menambah beban) */}
            <History
              aria-hidden="true"
              className="absolute -top-10 -right-10 h-32 w-32 text-neutral-200 dark:text-neutral-800/60 rotate-[18deg] opacity-30 pointer-events-none"
            />

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-4">
              <History className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {t("Navbar.menuProfileHistory") || "Sejarah Desa"}
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white leading-tight mb-6">
              {t("Home.profilHistoryTitle") ||
                "Sejarah dan Asal-Usul Desa Anabanua"}
            </h3>

            {/* Quick facts grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 py-5 border-y border-neutral-200 dark:border-neutral-800 mb-6">
              {quickFacts.map((fact, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                    <fact.icon className="w-4 h-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                      {fact.label}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">
                    {fact.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Sejarah preview — tipografi kaya, dua paragraf, watermark */}
            <div className="mt-2 flex-1">
              <blockquote className="relative text-neutral-700 dark:text-neutral-200 text-base md:text-lg leading-relaxed">
                <Quote
                  aria-hidden="true"
                  className="absolute -left-3 -top-6 h-10 w-10 text-primary-200 dark:text-primary-900/30 opacity-50"
                />
                {sejarahParagraphs.map((p, i) => (
                  <p key={i} className="mb-3 last:mb-0">
                    {p}
                  </p>
                ))}
              </blockquote>
            </div>

            {/* Visi blockquote - Elegant & Soft */}
            {profil.visi && profil.visi.trim() && (
              <div className="relative mt-auto bg-primary-50 dark:bg-primary-950/30 rounded-xl p-6 overflow-hidden border border-primary-100 dark:border-primary-900/50">
                {/* Decorative Large Quote Icon */}
                <Quote className="absolute -top-2 -left-2 h-16 w-16 text-primary-100 dark:text-primary-900/50 transform scale-150 opacity-50 pointer-events-none" />
                <div className="relative z-10">
                  <p className="font-serif text-lg md:text-xl italic text-neutral-800 dark:text-neutral-100 leading-relaxed">
                    &ldquo;{profil.visi}&rdquo;
                  </p>
                  <span className="mt-3 block text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                    — {t("Home.profilVisionLabel") || "Visi Desa"}
                  </span>
                </div>
              </div>
            )}

            {/* Read-more footer */}
            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center gap-5">
              <Link
                href="/profil/sejarah"
                className="group inline-flex items-center gap-2 text-sm font-bold text-primary-600 dark:text-primary-400 hover:gap-3 transition-all"
              >
                {t("Home.profilReadFullHistory") || "Baca Seluruh Sejarah"}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
