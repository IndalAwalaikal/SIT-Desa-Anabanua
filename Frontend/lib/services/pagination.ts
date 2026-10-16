import type { PaginatedResponse, PaginatedResult } from '@/types/pagination';

export function toPaginatedResult<T>(response: PaginatedResponse<T>): PaginatedResult<T> {
  return {
    data: response.items,
    total: response.meta.total,
    page: response.meta.page,
    perPage: response.meta.limit,
    totalPages: response.meta.totalPages,
  };
}
