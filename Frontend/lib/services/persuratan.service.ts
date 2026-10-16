import { ApiError, apiBlob, apiRequest, query } from '@/lib/services/api';
import type { JenisSurat, LampiranFile, PengajuanSurat, StatusPengajuan, SubmitPengajuanInput } from '@/types/persuratan';
import type { PaginatedResult, PaginatedResponse } from '@/types/pagination';
import { toPaginatedResult } from '@/lib/services/pagination';

export type PengajuanTracking = Pick<
  PengajuanSurat,
  | 'nomorResi'
  | 'jenisSuratKode'
  | 'jenisSuratNama'
  | 'status'
  | 'riwayatStatus'
  | 'dibuatPada'
  | 'diperbaruiPada'
  | 'catatanAdmin'
  | 'dokumenHasil'
  | 'filePdfUrl'
  | 'nomorSuratResmi'
>;

export async function getJenisSuratList(): Promise<JenisSurat[]> {
  const items = await apiRequest<JenisSurat[]>('/layanan', { revalidateSeconds: 3600 });
  const seenKode = new Set<string>();
  const seenNama = new Set<string>();
  return items.filter((item) => {
    const k = item.kode.toUpperCase();
    const n = item.nama.toLowerCase().trim();
    if (seenKode.has(k) || seenNama.has(n)) return false;
    seenKode.add(k);
    seenNama.add(n);
    return true;
  });
}
export async function getJenisSuratByKode(kode: string): Promise<JenisSurat | null> {
  try { return await apiRequest<JenisSurat>(`/layanan/${encodeURIComponent(kode)}`); }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
}
export async function getAllJenisSuratAdmin(): Promise<JenisSurat[]> { return apiRequest<JenisSurat[]>('/admin/layanan', { auth: true }); }

export interface JenisSuratEditableInput { kode: string; nama: string; deskripsi: string; persyaratan: string[]; estimasiHari: number; formFields?: JenisSurat['formFields']; aktif?: boolean; }
export async function createJenisSuratAdmin(input: JenisSuratEditableInput): Promise<JenisSurat> { return apiRequest<JenisSurat>('/layanan', { method: 'POST', auth: true, body: { ...input, ikon: 'FileText' } }); }
export async function updateJenisSuratAdmin(kode: string, input: Partial<JenisSuratEditableInput>): Promise<JenisSurat> { return apiRequest<JenisSurat>(`/layanan/${encodeURIComponent(kode)}`, { method: 'PUT', auth: true, body: input }); }
export async function deleteJenisSuratAdmin(kode: string): Promise<void> { await apiRequest(`/layanan/${encodeURIComponent(kode)}`, { method: 'DELETE', auth: true }); }

export async function submitPengajuan(input: SubmitPengajuanInput, _user: { id: string; nama: string }): Promise<PengajuanSurat> {
  const body = new FormData();
  body.set('jenisSuratKode', input.jenisSuratKode);
  body.set('data', JSON.stringify(input.data));
  for (const file of input.lampiran) body.append('lampiran', file);
  return apiRequest<PengajuanSurat>('/pengajuan', { method: 'POST', auth: true, body });
}

export async function getPengajuanByResi(nomorResi: string): Promise<PengajuanTracking | null> {
  try { return await apiRequest<PengajuanTracking>(`/pengajuan/${encodeURIComponent(nomorResi)}`); }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
}
// Surat lengkap (incl. data isian, pemohon, dokumen hasil) untuk preview/unduh PDF.
export async function getSuratByResi(nomorResi: string): Promise<PengajuanSurat | null> {
  try { return await apiRequest<PengajuanSurat>(`/surat/${encodeURIComponent(nomorResi)}`); }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
}
export async function getPengajuanByUser(_userId: string, page = 1, limit = 10): Promise<PaginatedResult<PengajuanSurat>> {
  const response = await apiRequest<PaginatedResponse<PengajuanSurat>>(`/pengajuan/saya${query({ page, limit })}`, { auth: true });
  return toPaginatedResult(response);
}
export interface PengajuanAdminPageParams {
  page?: number;
  limit?: number;
  status?: StatusPengajuan;
  search?: string;
  sort?: string;
}
export async function getAllPengajuanAdmin(params: PengajuanAdminPageParams = {}): Promise<PaginatedResult<PengajuanSurat>> {
  const response = await apiRequest<PaginatedResponse<PengajuanSurat>>(
    `/pengajuan${query({ page: params.page ?? 1, limit: params.limit ?? 20, status: params.status, search: params.search, sort: params.sort })}`,
    { auth: true },
  );
  return toPaginatedResult(response);
}
export async function updateStatusPengajuanAdmin(id: string, status: StatusPengajuan, catatan?: string, _adminNama?: string): Promise<PengajuanSurat> { return apiRequest<PengajuanSurat>(`/pengajuan/${encodeURIComponent(id)}/status`, { method: 'PATCH', auth: true, body: { status, catatan } }); }
export async function terbitkanSuratAdmin(id: string, nomorSurat?: string, catatan?: string, _adminNama?: string): Promise<PengajuanSurat> { return apiRequest<PengajuanSurat>(`/pengajuan/${encodeURIComponent(id)}/publish`, { method: 'POST', auth: true, body: { nomorSurat, catatan } }); }

export async function deletePengajuanAdmin(id: string): Promise<void> { await apiRequest(`/admin/pengajuan/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }); }

/** Ambil isi berkas lampiran sebagai Blob melalui endpoint ber-autentikasi. */
export async function getLampiranBlob(pengajuanId: string, lampiranId: string): Promise<Blob> {
  return apiBlob(
    `/pengajuan/${encodeURIComponent(pengajuanId)}/lampiran/${encodeURIComponent(lampiranId)}`,
  );
}
export function isLampiranImage(lamp: Pick<LampiranFile, 'nama' | 'tipe'>): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(lamp.nama) || /^image\//i.test(lamp.tipe);
}
export function isLampiranPdf(lamp: Pick<LampiranFile, 'nama' | 'tipe'>): boolean {
  return /\.pdf$/i.test(lamp.nama) || /pdf/i.test(lamp.tipe);
}
/** Hasil verifikasi keaslian surat dari kode QR/resi. */
export interface HasilVerifikasiSurat {
  valid: boolean;
  nomorSurat: string;
  jenisSuratNama: string;
  pemohonNama: string;
  subjekNama?: string;
  tanggalTerbit: string;
  penandatangan: string;
  jabatanPenandatangan: string;
  status: string;
}

/** Baris pada Buku Agenda Surat Keluar (dashboard admin). */
export interface BukuAgendaItem {
  noUrut: number;
  id: string;
  nomorResi: string;
  nomorSuratResmi: string;
  jenisSuratKode: string;
  jenisSuratNama: string;
  pemohonNama: string;
  pemohonNik: string;
  tanggalTerbit: string;
  penandatangan: string;
  filePdfUrl?: string;
  qrCode?: string;
}

export async function getVerifikasiSurat(code: string): Promise<HasilVerifikasiSurat | null> {
  try { return await apiRequest<HasilVerifikasiSurat>(`/verifikasi/surat/${encodeURIComponent(code)}`); }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
}

export async function getPendudukByNIK(nik: string): Promise<Record<string, unknown> | null> {
  try { return await apiRequest<Record<string, unknown>>(`/penduduk/nik/${encodeURIComponent(nik)}`, { auth: true }); }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
}

export async function getBukuAgendaAdmin(): Promise<BukuAgendaItem[]> {
  return apiRequest<BukuAgendaItem[]>('/admin/pengajuan/buku-agenda', { auth: true });
}

