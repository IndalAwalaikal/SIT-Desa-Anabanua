import { ApiError, apiRequest, query } from '@/lib/services/api';
import type { Umkm } from '@/types/umkm';

export async function getUmkmList(kategori?: string, limit?: number): Promise<Umkm[]> { return apiRequest<Umkm[]>(`/umkm${query({ kategori, limit })}`, { revalidateSeconds: 60 }); }
export async function getUmkmBySlug(slug: string): Promise<Umkm | null> { try { return await apiRequest<Umkm>(`/umkm/${encodeURIComponent(slug)}`, { revalidateSeconds: 60 }); } catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; } }
export interface UmkmEditableInput { namaUsaha: string; pemilik: string; kategori: string; deskripsi: string; foto: string[]; kontak: string; alamat: string; produkUnggulan: string[]; jamOperasional?: string; }
export async function createUmkmAdmin(input: UmkmEditableInput): Promise<Umkm> { return apiRequest<Umkm>('/umkm', { method: 'POST', auth: true, body: input }); }
export async function updateUmkmAdmin(id: string, input: Partial<UmkmEditableInput>): Promise<Umkm> { return apiRequest<Umkm>(`/umkm/${encodeURIComponent(id)}`, { method: 'PUT', auth: true, body: input }); }
export async function deleteUmkmAdmin(id: string): Promise<void> { await apiRequest(`/umkm/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }); }
