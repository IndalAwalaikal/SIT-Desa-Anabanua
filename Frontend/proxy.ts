import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy (pengganti deprecated Middleware — konvensi Next.js 16) —
 * dijalankan di sisi server sebelum request mencapai halaman.
 *
 * Melindungi rute `/akun/*` dan `/dashboard/*` dari akses tidak terautentikasi.
 * Jika tidak ada access_token maupun refresh_token, redirect ke `/login` dengan
 * parameter `redirect` agar user kembali ke halaman tujuan setelah login.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/akun') || pathname.startsWith('/dashboard')) {
    // /dashboard/login adalah alias yang selalu melempar ke /login —
    // jangan dipagari agar tidak terjadi redirect berantai.
    if (pathname === '/dashboard/login') {
      return NextResponse.next();
    }

    const hasAccessToken = Boolean(request.cookies.get('access_token')?.value);
    const hasRefreshToken = Boolean(request.cookies.get('refresh_token')?.value);

    // Selama pengguna memiliki access_token ATAU refresh_token, izinkan navigasi.
    // Jika access_token kedaluwarsa tetapi refresh_token masih ada, client side
    // akan otomatis melakukan refresh token tanpa menendak ke login.
    if (!hasAccessToken && !hasRefreshToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/akun/:path*', '/dashboard/:path*'],
};