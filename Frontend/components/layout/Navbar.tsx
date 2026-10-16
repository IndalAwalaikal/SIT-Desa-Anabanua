"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  FileText,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useTranslation } from "@/lib/i18n/useTranslation";

const logoBarru = "/logo-barru.webp";

interface NavMenuItem {
  i18nKey?: string;
  label?: string;
  href: string;
  children?: NavMenuItem[];
}

const menuConfig: NavMenuItem[] = [
  { i18nKey: "Navbar.menuHome", href: "/" },
  {
    i18nKey: "Navbar.menuProfile",
    href: "/profil",
    children: [
      { i18nKey: "Navbar.menuProfileAbout", href: "/profil" },
      { i18nKey: "Navbar.menuProfileHistory", href: "/profil/sejarah" },
      {
        i18nKey: "Navbar.menuProfileStructure",
        href: "/profil/struktur-organisasi",
      },
      { i18nKey: "Navbar.menuProfileArea", href: "/profil/wilayah" },
    ],
  },
  {
    i18nKey: "Navbar.menuInformation",
    href: "/informasi/statistik",
    children: [
      {
        i18nKey: "Navbar.menuInformationStatistik",
        href: "/informasi/statistik",
      },
      { i18nKey: "Navbar.menuInformationApbdes", href: "/informasi/apbdes" },
      { i18nKey: "Navbar.menuInformationPajak", href: "/informasi/pajak" },
      { i18nKey: "Navbar.menuInformationPeta", href: "/informasi/peta" },
      { i18nKey: "Navbar.menuInformationAgenda", href: "/informasi/agenda" },
      {
        i18nKey: "Navbar.menuInformationFasilitas",
        href: "/informasi/fasilitas",
      },
      {
        i18nKey: "Navbar.menuInformationSembako",
        href: "/informasi/sembako",
      },
    ],
  },
  {
    i18nKey: "Navbar.menuServices",
    href: "/layanan",
    children: [
      { i18nKey: "Navbar.menuServicesApply", href: "/layanan" },
      { i18nKey: "Navbar.menuServicesTrack", href: "/layanan/lacak" },
      { i18nKey: "Navbar.menuServicesComplaints", href: "/pengaduan" },
      { i18nKey: "Navbar.menuServicesFaq", href: "/faq" },
      { i18nKey: "Navbar.menuContact", href: "/kontak" },
    ],
  },
  {
    i18nKey: "Navbar.menuNews",
    href: "/berita",
    children: [
      { i18nKey: "Navbar.menuNewsBerita", href: "/berita" },
      { i18nKey: "Navbar.menuNewsGallery", href: "/galeri" },
      { i18nKey: "Navbar.menuNewsUmkm", href: "/umkm" },
    ],
  },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  // Tutup dropdown desktop saat klik di luar menu atau tekan Escape
  useEffect(() => {
    if (!openMenu) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && !target.closest("[data-nav-dropdown]")) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openMenu]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Info bar (portal info + jam kantor) juga melekat agar seluruh
          region header tetap terlihat saat discroll. */}
      <div className="sticky top-0 z-50 hidden border-b border-white/10 bg-[#174b17] text-primary-100 md:block print:hidden">
        <div className="container-desa flex h-9 items-center justify-between text-[11px] font-medium tracking-wide">
          <div className="flex items-center gap-3">
            <p>{t("Navbar.portalInfo")}</p>
            <span>•</span>
            <a
              href="https://barrukab.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-400 hover:text-white font-bold transition-colors underline decoration-dotted flex items-center gap-1"
            >
              Portal Pemkab Barru ↗
            </a>
          </div>
          <p className="text-primary-200">{t("Navbar.officeHours")}</p>
        </div>
      </div>

      {/* Navbar tetap statis (sticky) & selalu terlihat saat discroll,
          sehingga pengguna tidak perlu scroll ke atas hanya untuk membuka menu. */}
      <header
        className={`sticky top-0 md:top-[36px] z-50 w-full border-b border-neutral-200 bg-white/96 dark:border-neutral-800 dark:bg-neutral-950/96 backdrop-blur transition-all duration-300 print:hidden ${scrolled ? "shadow-[0_12px_32px_rgba(36,61,33,0.08)]" : "shadow-sm"}`}
      >
        <div className="container-desa flex h-[76px] items-center justify-between gap-5">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3"
            aria-label="Beranda Desa Anabanua"
          >
            {/* Logo tanpa border kotak, menggunakan drop-shadow agar batas tetap jelas */}
            <span className="grid h-12 w-12 shrink-0 place-items-center transition-transform duration-300 group-hover:-translate-y-0.5">
              <Image
                src={logoBarru}
                alt="Lambang Kabupaten Barru"
                width={44}
                height={44}
                className="h-auto w-11 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                priority
              />
            </span>
            <span className="min-w-0 leading-none">
              <span className="block font-serif text-[19px] font-bold tracking-tight text-[#174b17] dark:text-white sm:text-[21px]">
                Desa Anabanua
              </span>
              <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-[0.13em] text-primary-600 dark:text-primary-300">
                Kec. Barru · Kab. Barru
              </span>
            </span>
          </Link>

          <nav
            className="hidden h-full items-center xl:flex"
            aria-label="Navigasi utama"
          >
            {menuConfig.map((menu) => {
              const menuLabel = menu.i18nKey
                ? t(menu.i18nKey)
                : (menu.label ?? "Menu");
              const menuKey = menu.i18nKey ?? menu.href;
              const isMenuOpen = openMenu === menuKey;
              return (
                <div
                  key={menuKey}
                  data-nav-dropdown
                  className="relative h-full"
                  onMouseEnter={() => {
                    if (menu.children) setOpenMenu(menuKey);
                  }}
                  onMouseLeave={() => {
                    if (menu.children) setOpenMenu(null);
                  }}
                >
                  <Link
                    href={menu.href}
                    onClick={(event) => {
                      if (!menu.children) return;
                      event.preventDefault();
                      setOpenMenu(isMenuOpen ? null : menuKey);
                    }}
                    aria-haspopup={menu.children ? "menu" : undefined}
                    aria-expanded={menu.children ? isMenuOpen : undefined}
                    className={`flex h-full items-center gap-1 px-3 text-[13px] font-semibold transition-colors ${isActive(menu.href) ? "text-primary-700 dark:text-primary-300" : "text-slate-600 hover:text-primary-700 dark:text-slate-300 dark:hover:text-white"}`}
                  >
                    {menuLabel}
                    {menu.children && (
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
                      />
                    )}
                  </Link>
                  {menu.children && (
                    <div
                      role="menu"
                      className={`absolute left-1/2 top-[68px] w-60 -translate-x-1/2 rounded-2xl border border-primary-100 bg-white p-2 shadow-[0_18px_45px_rgba(36,61,33,0.16)] transition-all duration-200 dark:border-slate-700 dark:bg-slate-900 ${
                        isMenuOpen
                          ? "pointer-events-auto translate-y-0 opacity-100"
                          : "pointer-events-none translate-y-2 opacity-0"
                      }`}
                    >
                      {menu.children.map((child) => {
                        const childLabel = child.i18nKey
                          ? t(child.i18nKey)
                          : (child.label ?? "Menu");
                        const childKey =
                          child.i18nKey ?? child.label ?? child.href;
                        return (
                          <Link
                            key={childKey}
                            href={child.href}
                            role="menuitem"
                            className={`block rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${pathname === child.href ? "bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300" : "text-slate-600 hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                          >
                            {childLabel}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <Link
              href="/cari"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={t("Navbar.searchSite", "Cari konten di situs")}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Link>
            <NotificationBell />
            <LanguageToggle />
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={t("Navbar.toggleTheme")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2">
                <Link
                  href="/akun"
                  className="grid h-8 w-8 place-items-center rounded-full bg-primary-700 text-xs font-bold text-white"
                >
                  {user?.nama ? user.nama.charAt(0) : "👤"}
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-bold text-slate-500 hover:text-primary-700"
                >
                  {t("Navbar.signOut")}
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  className="rounded-full bg-[#247623] px-4 shadow-none hover:bg-[#1d5e1c]"
                >
                  {t("Navbar.loginWarga")}
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1 xl:hidden">
            <LanguageToggle />
            <button
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-600 dark:text-slate-300"
              aria-label={t("Navbar.toggleTheme")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="grid h-10 w-10 place-items-center rounded-full bg-primary-50 text-primary-800 transition hover:bg-primary-100 dark:bg-slate-800 dark:text-primary-200"
              aria-expanded={open}
              aria-label={open ? t("Navbar.closeMenu") : t("Navbar.openMenu")}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div
          className={`xl:hidden ${open ? "grid" : "hidden"} border-t border-primary-100 bg-white px-4 py-4 shadow-lg dark:border-slate-800 dark:bg-slate-950`}
        >
          <nav
            className="container-desa grid gap-1"
            aria-label={t("Navbar.mobileNav")}
          >
            <Link
              href="/cari"
              className="flex items-center gap-3 rounded-xl bg-primary-50 px-4 py-3 text-sm font-bold text-primary-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label={t("Navbar.searchSite", "Cari konten di situs")}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              {t("Navbar.searchSite", "Cari konten di situs")}
            </Link>
            {menuConfig.map((menu) => {
              const menuLabel = menu.i18nKey
                ? t(menu.i18nKey)
                : (menu.label ?? "Menu");
              return (
                <div key={menu.i18nKey ?? menu.href}>
                  <Link
                    href={menu.href}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold ${isActive(menu.href) ? "bg-primary-700 text-white" : "text-slate-700 hover:bg-primary-50 dark:text-slate-200 dark:hover:bg-slate-800"}`}
                  >
                    {menuLabel}
                    {menu.children && <ChevronDown className="h-4 w-4" />}
                  </Link>
                  {menu.children && (
                    <div className="ml-4 border-l border-primary-100 py-1 pl-4 dark:border-slate-700">
                      {menu.children.map((child) => {
                        const childLabel = child.i18nKey
                          ? t(child.i18nKey)
                          : (child.label ?? "Menu");
                        const childKey =
                          child.i18nKey ?? child.label ?? child.href;
                        return (
                          <Link
                            key={childKey}
                            href={child.href}
                            className="block py-2 text-xs font-semibold text-slate-500 hover:text-primary-700 dark:text-slate-400"
                          >
                            {childLabel}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="mt-3 flex gap-2 border-t border-primary-100 pt-4 dark:border-slate-800">
              <Link href="/layanan" className="flex-1">
                <Button className="w-full rounded-full">
                  <FileText className="h-4 w-4" /> {t("Navbar.applyLetter")}
                </Button>
              </Link>
              {isAuthenticated ? (
                <div className="flex flex-1 gap-2">
                  <Link href="/akun" className="flex-1">
                    <Button variant="outline" className="w-full rounded-full">
                      {user?.nama?.charAt(0) ?? "👤"}{" "}
                      {t("Navbar.myAccount") || "Akun Saya"}
                    </Button>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex-1 rounded-full border border-primary-200 text-xs font-bold text-primary-600 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-950/30 px-3 py-2 transition-colors"
                  >
                    {t("Navbar.signOut")}
                  </button>
                </div>
              ) : (
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full rounded-full">
                    {t("Navbar.login")}
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};
