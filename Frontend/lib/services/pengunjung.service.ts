import { apiRequest } from '@/lib/services/api';

export interface PengunjungHarian {
  tanggal: string;
  pengunjung: number;
  kunjungan: number;
}

export interface PengunjungStats {
  hariIni: PengunjungHarian;
  terakhir7: PengunjungHarian[];
  total: { pengunjung: number; kunjungan: number };
}

/** Ringkasan pengunjung situs (hari ini, 7 hari terakhir, total). */
export async function getPengunjungStats(): Promise<PengunjungStats> {
  return apiRequest<PengunjungStats>('/pengunjung', { revalidateSeconds: 60 });
}

/** Mencatat satu kunjungan (dedup per IP per hari dilakukan di backend). */
export async function trackPengunjung(): Promise<void> {
  try {
    await apiRequest('/pengunjung/track', { method: 'POST' });
  } catch {
    // Non-fatal: jangan sampai merusak pengalaman browsing bila backend mati.
  }
}