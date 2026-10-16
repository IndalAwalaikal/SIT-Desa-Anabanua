import { apiRequest } from '@/lib/services/api';

export interface AdminAnalytics {
  pengajuan: { total: number; byStatus: Record<string, number> };
  pengaduan: { total: number; byStatus: Record<string, number> };
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  return apiRequest<AdminAnalytics>('/admin/analytics', { auth: true });
}
