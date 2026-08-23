'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FileStack,
  BookOpen,
  Building2,
  MessageSquare,
  Newspaper,
  Megaphone,
  Image as ImageIcon,
  BarChart3,
  ShoppingBag,
  Users,
  Settings,
  ShieldAlert,
  CalendarDays,
  Package,
  ShieldCheck,
  Wallet,
  Receipt,
  LogOut,
  Home,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { useToastStore } from '@/store/toastStore';

export const SidebarAdmin: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const { showInfo } = useToastStore();

  const menu = [
    { href: '/dashboard', label: 'Ringkasan & Analitik', icon: LayoutDashboard },
    { href: '/dashboard/pengajuan', label: 'Kelola Pengajuan Surat', icon: FileText },
    { href: '/dashboard/template-surat', label: 'Template & Persyaratan Surat', icon: FileStack },
    { href: '/dashboard/buku-agenda', label: 'Buku Agenda Surat Keluar', icon: BookOpen },
    { href: '/dashboard/fasilitas', label: 'Fasilitas Publik Desa', icon: Building2 },

    { href: '/dashboard/pengaduan', label: 'Kelola Pengaduan', icon: MessageSquare },
    { href: '/dashboard/notifikasi', label: 'Riwayat Notifikasi', icon: Bell },
    { href: '/dashboard/berita', label: 'Kelola Berita', icon: Newspaper },
    { href: '/dashboard/sekilas-info', label: 'Sekilas Info', icon: Megaphone },
    { href: '/dashboard/galeri', label: 'Kelola Galeri', icon: ImageIcon },
    { href: '/dashboard/agenda', label: 'Agenda & Kalender', icon: CalendarDays },
    { href: '/dashboard/sembako', label: 'Pembagian Sembako', icon: Package },
    { href: '/dashboard/umkm', label: 'Direktori UMKM', icon: ShoppingBag },
    { href: '/dashboard/apbdes', label: 'Data APBDes', icon: Wallet },
    { href: '/dashboard/pajak', label: 'Transparansi Pajak', icon: Receipt },
    { href: '/dashboard/penduduk', label: 'Data Penduduk', icon: BarChart3 },
    { href: '/dashboard/perangkat', label: 'Perangkat & Struktur', icon: ShieldCheck },
    { href: '/dashboard/pengguna', label: 'Manajemen Pengguna', icon: Users, role: 'super_admin' },
    { href: '/dashboard/pengaturan', label: 'Pengaturan Situs', icon: Settings },
  ];

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    showInfo('Sesi admin Anda telah berakhir.');
    router.replace('/dashboard/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 flex h-full shrink-0 flex-col overflow-y-auto on-dark bg-secondary-900 text-neutral-300 border-r border-white/10 transition-all duration-300 ease-in-out
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full w-64 lg:w-20'}
        `}
      >
        <div className={`flex-1 p-5 space-y-5 ${!sidebarOpen ? 'lg:p-2' : ''}`}>
          {/* Header Admin */}
          {sidebarOpen ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-white tracking-tight">ADMIN DESA</h2>
                  <p className="text-[10px] text-primary-400 font-bold">DESA BORONG DIGITAL</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:flex text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-secondary-800"
                  aria-label="Ciutkan Sidebar"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-secondary-800"
                  aria-label="Tutup Sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-secondary-800"
                aria-label="Buka Sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* User Card */}
          <div className={`p-3 lg:p-2 bg-secondary-800/60 rounded-xl border border-white/10 flex items-center gap-3 ${!sidebarOpen ? 'lg:justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.nama?.charAt(0) || 'A'}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.nama || 'Admin Desa'}</p>
                <p className="text-[10px] text-neutral-400 capitalize font-medium">{user?.role || 'Admin'}</p>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-0.5">
            {menu.map((item) => {
              if (item.role && user?.role !== item.role) return null;

              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    sidebarOpen ? 'justify-start' : 'lg:justify-center lg:px-2'
                  } ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                      : 'text-neutral-300 hover:bg-secondary-800 hover:text-white'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout & Web Public Button */}
        <div className="mt-auto border-t border-white/10 bg-black/20 p-5 space-y-1.5 lg:p-2 lg:space-y-1">
          <Link
            href="/"
            onClick={handleNavClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-secondary-800 transition-colors ${
              sidebarOpen ? 'justify-start' : 'lg:justify-center lg:px-2'
            }`}
            title={!sidebarOpen ? 'Lihat Halaman Publik' : undefined}
          >
            <Home className="w-4 h-4 text-primary-500 shrink-0" />
            {sidebarOpen && <span>Lihat Halaman Publik</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 transition-colors w-full ${
              sidebarOpen ? 'justify-start' : 'lg:justify-center lg:px-2'
            }`}
            title={!sidebarOpen ? 'Keluar Sesi Admin' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>Keluar Sesi Admin</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
