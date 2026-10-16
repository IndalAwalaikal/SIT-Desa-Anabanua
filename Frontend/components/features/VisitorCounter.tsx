"use client";

import { useEffect, useState } from "react";
import { Users, Eye } from "lucide-react";
import { getPengunjungStats, trackPengunjung, type PengunjungStats } from "@/lib/services/pengunjung.service";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Widget pengunjung untuk area publik (footer). Mencatat kunjungan saat
 * halaman dimuat, lalu menampilkan jumlah pengunjung unik hari ini dan total
 * pengunjung sepanjang waktu. Gagal diam-diam bila backend tidak tersedia.
 */
export function VisitorCounter() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PengunjungStats | null>(null);

  useEffect(() => {
    // Catat kunjungan ini, lalu ambil ringkasan terkini.
    trackPengunjung();
    getPengunjungStats().then(setStats).catch(() => setStats(null));
  }, []);

  if (!stats) {
    return (
      <span className="inline-flex items-center gap-3 italic text-neutral-500">
        <Users className="w-3.5 h-3.5 text-primary-500" aria-hidden="true" />
        <span>—</span>
      </span>
    );
  }

  const nf = new Intl.NumberFormat("id-ID");
  return (
    <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="inline-flex items-center gap-1.5" title={t("Footer.visitorVisits", "Kunjungan")}>
        <Eye className="w-3.5 h-3.5 text-primary-500" aria-hidden="true" />
        <span>{t("Footer.visitorToday", "Pengunjung Hari Ini")}:&nbsp;
          <strong className="text-primary-400 tabular-nums">{nf.format(stats.hariIni.pengunjung)}</strong>
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5" title={t("Footer.visitorTotal", "Total Pengunjung")}>
        <Users className="w-3.5 h-3.5 text-primary-500" aria-hidden="true" />
        <span>{t("Footer.visitorTotal", "Total")}:&nbsp;
          <strong className="text-primary-400 tabular-nums">{nf.format(stats.total.pengunjung)}</strong>
        </span>
      </span>
    </span>
  );
}