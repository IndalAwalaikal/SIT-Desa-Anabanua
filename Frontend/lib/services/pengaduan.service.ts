import { ApiError, apiRequest, query } from '@/lib/services/api';
import type { Pengaduan, StatusPengaduan, SubmitPengaduanInput } from '@/types/pengaduan';
import type { PaginatedResult, PaginatedResponse } from '@/types/pagination';
import { toPaginatedResult } from '@/lib/services/pagination';

export async function submitPengaduan(input: SubmitPengaduanInput, _user: { id: string; nama: string }): Promise<Pengaduan> {
  return apiRequest<Pengaduan>('/pengaduan', { method: 'POST', auth: true, body: input });
}
export async function getPengaduanByTiket(nomorTiket: string): Promise<Pengaduan | null> {
  try { return await apiRequest<Pengaduan>(`/pengaduan/${encodeURIComponent(nomorTiket)}`); }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
}
export async function getPengaduanByUser(_userId: string, page = 1, limit = 10): Promise<PaginatedResult<Pengaduan>> {
  const response = await apiRequest<PaginatedResponse<Pengaduan>>(`/pengaduan/saya${query({ page, limit })}`, { auth: true });
  return toPaginatedResult(response);
}
export interface PengaduanAdminPageParams {
  page?: number;
  limit?: number;
  status?: StatusPengaduan | 'terbuka';
  search?: string;
  sort?: string;
}
export async function getAllPengaduanAdmin(params: PengaduanAdminPageParams = {}): Promise<PaginatedResult<Pengaduan>> {
  const response = await apiRequest<PaginatedResponse<Pengaduan>>(
    `/pengaduan${query({ page: params.page ?? 1, limit: params.limit ?? 20, status: params.status, search: params.search, sort: params.sort })}`,
    { auth: true },
  );
  return toPaginatedResult(response);
}
export async function updateStatusPengaduanAdmin(id: string, status: StatusPengaduan, tanggapanAdmin?: string): Promise<Pengaduan> { return apiRequest<Pengaduan>(`/pengaduan/${encodeURIComponent(id)}/status`, { method: 'PATCH', auth: true, body: { status, tanggapanAdmin } }); }
