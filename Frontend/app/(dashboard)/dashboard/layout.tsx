'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarAdmin } from '@/components/layout/SidebarAdmin';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { refreshAccessToken } from '@/lib/services/api';
import { Menu, ShieldAlert } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated, setHasHydrated } = useAuthStore();
  const { toggleSidebar } = useUiStore();

  const isLoginPage = pathname === '/dashboard/login';

  useEffect(() => {
    // Seed cookie CSRF agar semua request mutasi di dashboard punya token
    fetch('/api/csrf-token', { method: 'GET', credentials: 'include', cache: 'no-store' }).catch(() => {});

    // Proaktif perbarui access token saat pertama kali layout dimuat.
    // Ini mencegah pengguna ter-logout ketika access_token cookie (15 menit) sudah
    // expired tetapi refresh_token (30 hari) masih valid.
    refreshAccessToken().catch(() => {});

    // Proaktif perbarui token ketika pengguna kembali ke tab dashboard
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAccessToken().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check if hydration already completed
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribe();
    };
  }, [setHasHydrated]);

  useEffect(() => {
    if (!hasHydrated || isLoginPage) return;
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) {
      // Langsung ke /login — /dashboard/login hanyalah alias yang juga
      // bermuara ke sana, jadi hindari redirect berantai.
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, isLoginPage, user, router]);

  if (isLoginPage) return <>{children}</>;

  if (!hasHydrated || !isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-[#f3f7fc] dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Memeriksa Sesi Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f3f7fc] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans relative">
      <SidebarAdmin />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Desktop Bar */ }
        <div className="hidden lg:flex items-center justify-between bg-white dark:bg-neutral-900 px-8 py-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-neutral-900/80">
          <h1 className="font-extrabold text-lg tracking-tight text-neutral-800 dark:text-neutral-100 uppercase">Dashboard</h1>
        </div>
        
        {/* Top Mobile Bar with Hamburger Menu Button */}
        <div className="lg:hidden flex items-center justify-between bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 transition-colors focus:outline-none"
              aria-label="Buka/Tutup Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary-400" />
              <span className="font-extrabold text-sm tracking-wide">ADMIN DESA ANABANUA</span>
            </div>
          </div>
        </div>

        <main key={pathname} className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
