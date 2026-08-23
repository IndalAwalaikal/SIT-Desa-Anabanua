import { apiRequest } from '@/lib/services/api';
import type { SembakoPeriod, SembakoPeriodInput } from '@/types/sembako';

export async function getSembakoPeriods(): Promise<SembakoPeriod[]> {
  return apiRequest<SembakoPeriod[]>('/sembako', { revalidateSeconds: 60 });
}

// --- Admin ---
export async function createSembakoPeriod(input: SembakoPeriodInput): Promise<SembakoPeriod> {
  return apiRequest<SembakoPeriod>('/admin/sembako', { method: 'POST', auth: true, body: input });
}

export async function updateSembakoPeriod(id: string, input: SembakoPeriodInput): Promise<SembakoPeriod> {
  return apiRequest<SembakoPeriod>(`/admin/sembako/${encodeURIComponent(id)}`, { method: 'PUT', auth: true, body: input });
}

export async function deleteSembakoPeriod(id: string): Promise<void> {
  await apiRequest(`/admin/sembako/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
}
