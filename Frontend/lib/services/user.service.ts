import { apiRequest } from '@/lib/services/api';
import type { Role, User } from '@/types/user';
import type { PaginatedResult, PaginatedResponse } from '@/types/pagination';
import { query } from '@/lib/services/api';
import { toPaginatedResult } from '@/lib/services/pagination';

export async function getUsersAdmin(page = 1, limit = 20, search = ''): Promise<PaginatedResult<User>> {
  const response = await apiRequest<PaginatedResponse<User>>(`/users${query({ page, limit, search })}`, { auth: true });
  return toPaginatedResult(response);
}
export async function updateUserAdmin(id: string, input: Partial<Pick<User, 'nama' | 'email' | 'telepon' | 'alamat' | 'role'>>): Promise<User> {
  if (!input.role) throw new Error('Backend hanya mendukung pembaruan peran pengguna oleh super admin.');
  return apiRequest<User>(`/users/${encodeURIComponent(id)}`, { method: 'PUT', auth: true, body: { role: input.role } });
}
export async function updateUserRoleAdmin(id: string, role: Role): Promise<User> { return updateUserAdmin(id, { role }); }
