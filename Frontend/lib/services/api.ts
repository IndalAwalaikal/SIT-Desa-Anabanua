import { useAuthStore } from '@/store/authStore';

type ApiEnvelope<T> = { data: T };
type ApiErrorEnvelope = { error?: { code?: string; message?: string } };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiRequestInit = Omit<RequestInit, 'body'> & {
  auth?: boolean;
  body?: BodyInit | object;
  retryOnUnauthorized?: boolean;
  retryOnCsrf?: boolean;
  /**
   * Detik revalidasi cache utk GET yang dipanggil dari server (SSR / Server
   * Component). Jika diisi, request server memakai Next Data Cache (`next.revalidate`)
   * dan tanpa buster `_t` sehingga key cache stabil — navigasi/refresh tidak
   * menunggu backend sekali lagi dalam rentang revalidate. Di sisi browser nilai
   * ini diabaikan (tetap `no-store` + anti-cache).
   */
  revalidateSeconds?: number;
};

let refreshPromise: Promise<boolean> | null = null;

function apiBaseUrl(): string {
  if (typeof window === 'undefined') {
    const internal = process.env.API_INTERNAL_URL;
    if (!internal) {
      throw new Error('API_INTERNAL_URL wajib diatur untuk request server-side.');
    }
    return `${internal.replace(/\/$/, '')}/api`;
  }
  return (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/$/, '');
}

function buildBody(body: ApiRequestInit['body'], headers: Headers): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (body instanceof FormData || typeof body === 'string' || body instanceof Blob || body instanceof URLSearchParams) {
    return body;
  }
  headers.set('Content-Type', 'application/json');
  return JSON.stringify(body);
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )csrf_token_v2=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> & ApiErrorEnvelope;
  if (!response.ok) {
    throw new ApiError(payload?.error?.message || 'Permintaan ke server gagal.', response.status, payload?.error?.code);
  }
  return payload.data;
}

export async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const csrf = getCsrfToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (csrf) headers['X-CSRF-Token'] = csrf;

    const response = await fetch(`${apiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
      cache: 'no-store',
      credentials: 'include',
    });
    if (response.ok) {
      return true;
    }
    useAuthStore.getState().logout();
    return false;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/** Ambil token CSRF segar dari server (endpoint publik) untuk heuristik retry 403. */
async function fetchCsrfTokenFromServer(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(`${apiBaseUrl()}/csrf-token`, { cache: 'no-store', credentials: 'include' });
    if (!res.ok) return null;
    const payload = (await res.json()) as { data?: { csrfToken?: string } };
    return payload?.data?.csrfToken || null;
  } catch {
    return null;
  }
}

/* ── Cache runtime server-side (process frontend) ──
   Cache GET API di progres memori wag TTL pendek, SOLE tar server (SSR) saat
   runtime. Ini memperbaiki lambat navigasi/refresh SINPA mastahil Next
   fetch-cache/prerender (yang gagal `next build` menguando host backend
   belum ada waktu build docker). Halaman tetap dynamic (`no-store`) = build aman. */
const serverTtlCache = new Map<string, { exp: number; promise: Promise<unknown> }>();
const SERVER_TTL_MAX = 240;

function runServerTtlCache<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = serverTtlCache.get(key);
  if (hit && hit.exp > now) return hit.promise as Promise<T>;
  const promise = fn();
  serverTtlCache.set(key, { exp: now + ttlSeconds * 1000, promise });
  if (serverTtlCache.size > SERVER_TTL_MAX) {
    const oldest = serverTtlCache.keys().next().value;
    if (oldest !== undefined) serverTtlCache.delete(oldest);
  }
  return promise.catch((error) => {
    serverTtlCache.delete(key);
    throw error;
  });
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { auth = false, retryOnUnauthorized = true, retryOnCsrf = true, revalidateSeconds, body, headers: initialHeaders, ...requestInit } = init;

  const method = (requestInit.method || 'GET').toUpperCase();
  const isSafe = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';

  // Cache runtime server-side (TTL) utk GET GET from server — JADIS main,
  // tidak memakai `next.revalidate` (soasay page dinamik → build aman dor DIK).
  const serverCacheTtl =
    typeof window === 'undefined' && isSafe && (revalidateSeconds ?? 0) > 0
      ? (revalidateSeconds ?? 0)
      : 0;

  const doFetch = async (csrfOverride?: string): Promise<Response> => {
    const headers = new Headers(initialHeaders);
    headers.set('Accept', 'application/json');

    if (!isSafe) {
      const csrf = csrfOverride ?? getCsrfToken();
      if (csrf) {
        headers.set('X-CSRF-Token', csrf);
      }
    }

    let finalPath = path;
    if (method === 'GET' && serverCacheTtl === 0) {
      // buster `_t` solo utk non-cache (anti-cache browser/CDN);
      // cache server memakai key URL murni (stabil).
      const separator = finalPath.includes('?') ? '&' : '?';
      finalPath = `${finalPath}${separator}_t=${Date.now()}`;
    }

    return fetch(`${apiBaseUrl()}${finalPath}`, {
      ...requestInit,
      headers,
      body: buildBody(body, headers),
      cache: 'no-store',
      credentials: 'include',
    });
  };

  // Cek cache sebelum menyentuh backend. Sebelumnya fetch dilakukan lebih dulu,
  // sehingga cache hanya menyimpan hasil parsing tetapi tetap menambah satu
  // request jaringan pada setiap render SSR.
  if (serverCacheTtl > 0) {
    return runServerTtlCache<T>(`${apiBaseUrl()}${path}`, serverCacheTtl, async () => {
      const cachedResponse = await doFetch();
      return parseResponse<T>(cachedResponse);
    });
  }

  let response = await doFetch();

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...init, retryOnUnauthorized: false });
    }
  }

  // 403 bisa berarti token CSRF kedaluwars / tidak dikirim (mis. cookie lama
  // HttpOnly, yanni header kosong). Ambil token segar dari server & coba lagi.
  if (response.status === 403 && retryOnCsrf && !isSafe) {
    const csrf = await fetchCsrfTokenFromServer();
    if (csrf) {
      response = await doFetch(csrf);
      if (response.status === 401 && auth) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const freshCsrf = await fetchCsrfTokenFromServer();
          response = await doFetch(freshCsrf ?? csrf);
        }
      }
    }
  }

  const result = await parseResponse<T>(response);

  if (!isSafe && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('app-mutation-success'));
  }

  return result;
}

export async function apiBlob(
  path: string,
  init: { auth?: boolean; method?: string } = {},
): Promise<Blob> {
  const headers = new Headers({
    Accept: 'application/pdf, image/*, application/octet-stream',
  });

  const method = (init.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrf = getCsrfToken();
    if (csrf) {
      headers.set('X-CSRF-Token', csrf);
    }
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: init.method || 'GET',
    headers,
    cache: 'no-store',
    credentials: 'include',
  });

  if (response.status === 401 && init.auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiBlob(path, { ...init, auth: true });
  }
  if (!response.ok) {
    throw new ApiError('Gagal memuat berkas dari server.', response.status);
  }
  return response.blob();
}

export function query(params: Record<string, string | number | undefined>): string {
  const value = new URLSearchParams();
  for (const [key, item] of Object.entries(params)) {
    if (item !== undefined && item !== '') value.set(String(key), String(item));
  }
  const encoded = value.toString();
  return encoded ? `?${encoded}` : '';
}
