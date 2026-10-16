import { apiRequest } from '@/lib/services/api';
import type { Dusun, PerangkatDesa, PotensiDesa, ProfilDesa } from '@/types/desa';

export async function getProfilDesa(): Promise<ProfilDesa> { return apiRequest<ProfilDesa>('/profil-desa', { revalidateSeconds: 60 }); }
export async function getPerangkatDesaList(): Promise<PerangkatDesa[]> { return apiRequest<PerangkatDesa[]>('/perangkat-desa', { revalidateSeconds: 60 }); }
export async function getDusunList(): Promise<Dusun[]> { return apiRequest<Dusun[]>('/dusun'); }
export async function getPotensiDesaList(): Promise<PotensiDesa[]> { return apiRequest<PotensiDesa[]>('/potensi-desa', { revalidateSeconds: 60 }); }
export async function updateProfilDesa(input: Partial<ProfilDesa>): Promise<ProfilDesa> { return apiRequest<ProfilDesa>('/profil-desa', { method: 'PUT', auth: true, body: input }); }

export interface PerangkatEditableInput { nama: string; jabatan: string; nip?: string; foto: string; periode: string; }
export async function createPerangkatAdmin(input: PerangkatEditableInput): Promise<PerangkatDesa> { return apiRequest<PerangkatDesa>('/perangkat-desa', { method: 'POST', auth: true, body: input }); }
export async function updatePerangkatAdmin(id: string, input: Partial<PerangkatEditableInput>): Promise<PerangkatDesa> { return apiRequest<PerangkatDesa>(`/perangkat-desa/${encodeURIComponent(id)}`, { method: 'PUT', auth: true, body: input }); }
export async function deletePerangkatAdmin(id: string): Promise<void> { await apiRequest(`/perangkat-desa/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }); }
