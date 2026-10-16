import { ApiError, apiRequest } from '@/lib/services/api';
import type { GaleriAlbum } from '@/types/galeri';

export async function getGaleriAlbumList(): Promise<GaleriAlbum[]> { return apiRequest<GaleriAlbum[]>('/galeri', { revalidateSeconds: 60 }); }
export async function getGaleriAlbumPreview(limit = 12): Promise<GaleriAlbum[]> {
  return apiRequest<GaleriAlbum[]>(`/galeri?preview=1&limit=${limit}`, { revalidateSeconds: 60 });
}
export async function getGaleriAlbumById(id: string): Promise<GaleriAlbum | null> {
  try { return await apiRequest<GaleriAlbum>(`/galeri/${encodeURIComponent(id)}`); }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
}
export interface GaleriFotoEditableInput { id?: string; url: string; caption?: string; tanggal?: string; }
export interface GaleriAlbumEditableInput { judul: string; deskripsi: string; tanggal?: string; kategori?: string; coverFoto: string; fotos?: GaleriFotoEditableInput[]; }
export async function createGaleriAlbumAdmin(input: GaleriAlbumEditableInput): Promise<GaleriAlbum> { return apiRequest<GaleriAlbum>('/galeri', { method: 'POST', auth: true, body: input }); }
export async function updateGaleriAlbumAdmin(id: string, input: Partial<GaleriAlbumEditableInput>): Promise<GaleriAlbum> { return apiRequest<GaleriAlbum>(`/galeri/${encodeURIComponent(id)}`, { method: 'PUT', auth: true, body: input }); }
export async function deleteGaleriAlbumAdmin(id: string): Promise<void> { await apiRequest(`/galeri/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }); }
