export interface SembakoItem {
  id: string;
  namaBarang: string;
  satuan: string;
  jumlahPerKK: number;
  keterangan?: string;
}

export type SembakoStatus = 'upcoming' | 'ongoing' | 'completed';

export interface SembakoPeriod {
  id: string;
  nama: string;
  periode: string;
  tanggalMulai: string;
  tanggalSelesai?: string;
  targetPenerima?: number;
  lokasi?: string;
  keterangan?: string;
  items: SembakoItem[];
  /** Status diturunkan backend dari waktu server: upcoming | ongoing | completed. */
  status: SembakoStatus;
}

/** Input admin untuk create/update periode (items ditulis ulang penuh). */
export interface SembakoPeriodInput {
  nama: string;
  periode: string;
  tanggalMulai: string; // YYYY-MM-DD
  tanggalSelesai?: string;
  targetPenerima?: number;
  lokasi?: string;
  keterangan?: string;
  items: Array<{
    namaBarang: string;
    satuan: string;
    jumlahPerKK: number;
    keterangan?: string;
  }>;
}
