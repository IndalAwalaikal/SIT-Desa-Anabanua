import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Shield,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import { getProfilDesa } from "@/lib/services/desa.service";
import { FooterLinks } from "./FooterLinks";
import { VisitorCounter } from "@/components/features/VisitorCounter";
import { getServerT } from "@/lib/i18n/server";
import type { ProfilDesa } from "@/types/desa";

// Footer no debe bloquear la página nunca: si la API no está disponible
// (p. ej. durante el build sin backend, o si el backend cae), se sirve un
// perfil de respaldo para que el pie de página siga renderizando.
const FALLBACK_PROFIL: ProfilDesa = {
  nama: "Desa Anabanua",
  kecamatan: "Kecamatan Barru",
  kabupaten: "Kabupaten Barru",
  provinsi: "Sulawesi Selatan",
  kodePos: "",
  sejarah: "",
  visi: "",
  misi: [],
  luasWilayah: "",
  jumlahDusun: 0,
  jumlahRW: 0,
  jumlahRT: 0,
  alamatKantor: "",
  telepon: "",
  email: "",
  website: "",
  jamLayanan: "Senin–Jumat, 08.00–16.00 WITA",
  koordinat: { lat: 0, lng: 0 },
  fotoKantor: "",
  fotoBanner: [],
};

export const Footer = async () => {
  const t = getServerT();
  const profil = await getProfilDesa().catch(() => FALLBACK_PROFIL);
  const logoBarru = "/logo-barru.webp";

  return (
    <footer className="bg-neutral-950 text-neutral-300 pt-16 pb-12 border-t border-neutral-800 on-dark">
      <div className="container-desa">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-neutral-800">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {/* Logo tanpa border kotak, menggunakan drop-shadow agar batas tetap jelas */}
              <div className="flex items-center justify-center w-14 h-14">
                <Image
                  src={logoBarru}
                  alt="Lambang Kabupaten Barru"
                  width={48}
                  height={48}
                  className="h-auto w-14 object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.55)]"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white tracking-tight">
                  DESA ANABANUA
                </h3>
                <p className="text-xs text-primary-400 font-semibold">
                  {t('Footer.officialWebsite', 'Website Resmi Pemerintahan')}
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t('Footer.portalDesc', 'Platform layanan publik dan pusat informasi terpadu Desa Anabanua, Kecamatan Barru,')}
              <a
                href="https://barrukab.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:underline font-bold inline-flex items-center gap-1"
              >
                Kabupaten Barru <Globe className="w-3 h-3 inline" />
              </a>
              , Sulawesi Selatan.
            </p>
            ...
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://barrukab.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-primary-600 hover:text-white text-neutral-300 text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 border border-neutral-800"
                title="Website Resmi Kabupaten Barru"
              >
                <Globe className="w-3.5 h-3.5 text-primary-400" />
                barrukab.go.id
              </a>
              <a
                href="https://web.facebook.com/desa.anabanua"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-neutral-900 hover:bg-primary-600 hover:text-white text-neutral-400 transition-colors"
                title="Facebook"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/desa_anabanua/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-neutral-900 hover:bg-primary-600 hover:text-white text-neutral-400 transition-colors"
                title="Instagram"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.youtube.com/results?search_query=desa+anabanua"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-neutral-900 hover:bg-primary-600 hover:text-white text-neutral-400 transition-colors"
                title="YouTube"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          <FooterLinks />

          {/* Col 4: Info Kontak Kantor */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-l-4 border-primary-500 pl-3">
              {t('Footer.officeContact', 'Kontak Kantor Desa')}
            </h4>
            <ul className="space-y-3 text-xs text-neutral-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=-4.47928,119.71651"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-400 transition-colors underline decoration-dotted"
                  title="Buka lokasi Desa Anabanua di Google Maps"
                >
                  {profil.alamatKantor} ({t('Footer.directions', 'Petunjuk Arah ↗')})
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-500 shrink-0" />
                <span>{profil.telepon}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-500 shrink-0" />
                <span>{profil.email}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                <span>{profil.jamLayanan}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="pt-8 flex flex-col items-center justify-between gap-4 text-xs text-neutral-500 sm:flex-row">
          <p>
            © 2026 Pemerintah Desa Anabanua. {t('Footer.copyright', 'Bagian dari Kabupaten Barru. Hak Cipta Dilindungi.')}
          </p>
          <VisitorCounter />
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard/login"
              className="hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5 text-accent-500" />
              {t('Footer.adminAccess', 'Akses Admin Desa')}
            </Link>
            <span className="hidden items-center gap-1 italic lg:inline-flex">
              {t('Footer.motto', 'Bersama Mewujudkan Desa Anabanua yang Maju, Mandiri, dan Terhubung')}
            </span>
          </div>
        </div>
        <div className="mt-7 border-t border-neutral-900 pt-5 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-neutral-600">
            Dikembangkan oleh
          </p>
          <p className="mt-1 text-[10px] leading-relaxed tracking-wide text-neutral-500/80">
            Tim Lentera Anabanua KKN-PPL Universitas Negeri Makassar Angkatan XXXIII
          </p>
        </div>
      </div>
    </footer>
  );
};
