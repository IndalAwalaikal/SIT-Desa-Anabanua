# Frontend Desa Anabanua

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=PWA&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT" />
  <img src="https://img.shields.io/badge/Author-Indal_Awalaikal-blue.svg?style=for-the-badge" alt="Author" />
</p>

Frontend Desa Anabanua adalah aplikasi web **Next.js 16 (App Router)** berbasis TypeScript yang menampilkan informasi publik desa dan **dashboard admin operasional**. Aplikasi ini ditujukan untuk pengunjung umum maupun admin/operator desa, dengan fokus pada pengalaman yang cepat, responsif, aksesibel, dan **PWA-ready** (bisa dipasang seperti aplikasi native).

> **Desa Anabanua, Kecamatan Barru, Kabupaten Barru, Sulawesi Selatan.** MIT License (c) 2026 Indal Awalaikal.

## Daftar Isi

1. [Tujuan Frontend](#tujuan-frontend)
2. [Teknologi yang Digunakan](#teknologi-yang-digunakan)
3. [Prinsip Arsitektur Frontend](#prinsip-arsitektur-frontend)
4. [Struktur Folder](#struktur-folder)
5. [Rute Aplikasi](#rute-aplikasi)
6. [Service Layer](#service-layer)
7. [State Management](#state-management)
8. [Environment Variables](#environment-variables)
9. [Setup Lokal](#setup-lokal)
10. [Build & Produksi](#build--produksi)
11. [Testing](#testing)
12. [CI / CD](#ci--cd)
13. [Pengembangan Fitur](#pengembangan-fitur)
14. [Troubleshooting](#troubleshooting)
15. [Dokumen Pendukung](#dokumen-pendukung)

## Tujuan Frontend

- Menampilkan profil & informasi publik desa (profil, sejarah, wilayah, struktur organisasi).
- Menampilkan statistik, APBDes, agenda, fasilitas, berita, galeri, UMKM, pajak, dan peta.
- Menyediakan portal layanan warga (pengajuan surat, pelacakan resi, pengaduan, pencarian).
- Menyediakan **dashboard admin** untuk mengelola konten, surat, pengaduan, pajak, penduduk, notifikasi, dan pengguna.
- Menghubungkan user dengan API backend secara rapi melalui **service layer**.

## Teknologi yang Digunakan

| Kategori | Paket | Versi |
|---|---|---|
| Framework | Next.js | 16 (App Router) |
| UI | React | 19 |
| Typecheck | TypeScript | 5 |
| Styling | Tailwind CSS | 4 (+ PostCSS 8) |
| State | Zustand | 5 |
| Form & Validasi | react-hook-form + Zod | 7 / 3 |
| Ikon | Lucide React | ~0.475 |
| Grafik | Recharts | 2 |
| Peta | Leaflet / react-leaflet | 1.9 / 5 |
| Util | clsx, tailwind-merge, date-fns | - |
| Optimasi gambar | sharp | 0.35 |
| Lint | ESLint | 9 (flat config) |
| Testing | Vitest + Testing Library | 3 / 16 |
| Runtime | Node.js | 22 |

## Prinsip Arsitektur Frontend

- **Server Components** menjadi default; *client component* dipakai hanya saat diperlukan (interaktif, state, browser API).
- Seluruh akses data lewat **service layer** di `lib/services` — komponen tidak fetch langsung.
- Komponen UI **reusable & modular** (`components/ui`, `components/layout`, `components/features`).
- State client lewat **Zustand** (auth, UI, toast, notifikasi, tema).
- Validasi form lewat **Zod**; type-nya dipakai di sisi server (SSR) dan klien.
- Penanganan **loading & error** secara konsisten pada setiap halaman.
- API diproxy lewat rewrite Next.js (`/api/*` → backend), sehingga sama origin & aman.

## Struktur Folder

```
Frontend/
├── app/                    # route App Router
│   ├── (public)/           # rute publik
│   ├── (dashboard)/        # rute admin
│   ├── layout.tsx          # root layout, metadata, PWA registration
│   ├── globals.css
│   ├── loading.tsx / error.tsx / not-found.tsx
│   └── page.tsx            # beranda
├── components/
│   ├── ui/                 # komponen dasar (Button, Modal, Card, Form, dst.)
│   ├── layout/             # Navbar, Footer, SidebarAdmin, AppChrome, dll.
│   ├── features/           # komponen fitur (beranda, informasi, dll.)
│   └── surat/              # template & kop surat
├── lib/
│   ├── services/           # abstraksi API (index.ts, api.ts, auth.service, dst.)
│   ├── mock/               # data contoh untuk prototyping / dev
│   ├── i18n/               # utilitas terjemahan
│   ├── utils/              # helper format, cn, delay, chartTooltip
│   └── validations/        # schema Zod
├── public/                 # aset statis, sw.js, manifest.json, gambar hero/logo
├── store/                  # Zustand stores (auth, ui, toast, notification)
├── types/                  # definisi tipe TypeScript
├── messages/               # i18n id.json, en.json
├── hooks/                  # hook kustom (useSortableData, useNotificationStream)
├── middleware.ts            # helper gating rute /akun & /dashboard
├── package.json / tsconfig.json
├── next.config.mjs         # rewrite /api & /uploads ke backend, image optimization
├── eslint.config.mjs       # flat config ESLint 9
├── vitest.config.ts        # Vitest + happy-dom
└── Dockerfile
```

## Rute Aplikasi

### Area Publik (`app/(public)/`)

| Rute | Deskripsi |
|---|---|
| `/` | Beranda desa (hero, statistik, berita terbaru, UMKM, pajak, APBDes, agenda, galeri) |
| `/profil` | Profil desa, visi/misi, pemerintahan |
| `/profil/sejarah` | Sejarah desa |
| `/profil/struktur-organisasi` | Struktur organisasi desa |
| `/profil/wilayah` | Peta wilayah desa (Leaflet) |
| `/berita` | Daftar berita |
| `/berita/[slug]` | Detail berita |
| `/informasi/agenda` | Agenda kegiatan |
| `/informasi/apbdes` | Transparansi APBDes |
| `/informasi/fasilitas` | Fasilitas umum |
| `/informasi/pajak` | Transparansi pajak |
| `/informasi/pajak/bukti/[nomorBukti]` | Bukti setoran pajak |
| `/informasi/peta` | Peta interaktif fasilitas |
| `/informasi/statistik` | Statistik desa (Recharts) |
| `/umkm` | Direktori UMKM |
| `/umkm/[slug]` | Detail UMKM |
| `/layanan` | Daftar layanan surat |
| `/layanan/[kode]/ajukan` | Formulir pengajuan surat |
| `/layanan/lacak` | Lacak status pengajuan (resi) |
| `/surat/[resi]` | Cek/verifikasi surat |
| `/pengaduan` | Kirim & lacak pengaduan |
| `/verifikasi/surat/[code]` | Verifikasi surat digital (HMAC) |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Akun |
| `/akun` | Akun pengguna |
| `/cari` | Pencarian gabungan |
| `/faq` | FAQ desa |

### Area Dashboard Admin (`app/(dashboard)/dashboard/`)

| Rute | Deskripsi |
|---|---|
| `/dashboard/login` | Login admin |
| `/dashboard` | Beranda / ringkasan dashboard |
| `/dashboard/berita` | Kelola berita |
| `/dashboard/agenda` | Kelola agenda |
| `/dashboard/buku-agenda` | Buku agenda |
| `/dashboard/fasilitas` | Kelola fasilitas |
| `/dashboard/galeri` | Kelola galeri |
| `/dashboard/umkm` | Kelola UMKM |
| `/dashboard/pajak` | Kelola pajak |
| `/dashboard/apbdes` | Kelola APBDes |
| `/dashboard/penduduk` | Data penduduk |
| `/dashboard/perangkat` | Data perangkat desa |
| `/dashboard/pengajuan` | Kelola pengajuan surat |
| `/dashboard/template-surat` | Template surat |
| `/dashboard/pengaduan` | Kelola pengaduan |
| `/dashboard/notifikasi` | Notifikasi |
| `/dashboard/sekilas-info` | Sekilas info desa |
| `/dashboard/pengguna` | Kelola pengguna |
| `/dashboard/pengaturan` | Pengaturan aplikasi |

Akses dashboard dilindungi — pengguna tidak terautentikasi/diarahkan ke `/dashboard/login`.

## Service Layer

Semua permintaan API diproses melalui abstraksi di `Frontend/lib/services`:

- `lib/services/api.ts` — klien HTTP dasar (header, interceptor, error handling).
- `lib/services/auth.service.ts`, `berita.service.ts`, `desa.service.ts`, `fasilitas.service.ts`, `galeri.service.ts`, `umkm.service.ts`, `pajak.service.ts`, `pengaduan.service.ts`, `persuratan.service.ts`, `statistik.service.ts`, `notifikasi.service.ts`, `sekilas_info.service.ts`, `user.service.ts`.
- Semua request otomatis me‑rewrite ke `NEXT_PUBLIC_API_BASE_URL` (`/api` pada dev & Docker).

Prinsip: komponen tidak pernah fetch langsung; semua logika jaringan ada di service sehingga mudah diuji & beralih ke backend nyata.

## State Management

Menggunakan **Zustand** (persist untuk auth):

| Store | Tanggung jawab |
|---|---|
| `authStore` | sesi user, role, token (persist, refresh otomatis) |
| `uiStore` | sidebar terbuka/tutup, UI state |
| `toastStore` | notifikasi toast |
| `notificationStore` | notifikasi realtime (SSE) |

## Environment Variables

Salin `Frontend/.env.example` → `.env.local` (atau pakai Docker ARG). Untuk dev lokal:

```bash
cp .env.example .env.local
```

| Variabel | Deskripsi | Contoh |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Nama aplikasi | `"Website Desa Anabanua"` |
| `NEXT_PUBLIC_SITE_URL` | URL situs publik | `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL API (di browser) | `/api` (via rewrite) |
| `API_INTERNAL_URL` | URL backend (server-only) | `http://localhost:8080` |
| `NEXT_PUBLIC_MOCK_DELAY_MS` | delay mock untuk prototyping | `0` |

> Catatan: variabel `NEXT_PUBLIC_*` **akan terbungkus ke klien**; `API_INTERNAL_URL` bersifat **server-side only** jangan gunakan di browser.

## Setup Lokal

```bash
cd Frontend
npm install
npm run dev
```

Frontend berjalan di **`http://localhost:3000`** dan otomatis memanggil backend di `http://localhost:8080` melalui rewrite.

> Jalankan backend lokal terlebih dahulu (`cd ../Backend && go run ./cmd/api`).

## Build & Produksi

```bash
npm run build          # Next.js production build (standalone)
npm run start          # jalankan server produksi
```

Image Docker produksi sudah dikonfigurasi di `Frontend/Dockerfile` (multi-stage: deps → build → runner, `output: standalone`).

## Testing

Frontend memakai **Vitest** + **Testing Library** (`happy-dom`):

```bash
npm run test           # vitest run
npm run test:watch     # vitest watch
npm run test:coverage  # vitest run --coverage (v8)
```

Fokus testing: validasi form & interaksi, halaman penting termuat, filter/search, loading/error state, dan util helper (`lib/utils/format.test.ts`).

## CI / CD

`.github/workflows/ci.yml` — job `frontend`:

- `setup-node@v4` (Node 22, cache npm) → `npm ci` → `npm run type-check` → `npm run lint`.
- Build Docker image pada push ke `main`.

## Pengembangan Fitur

Saat menambahkan fitur baru, ikuti pola:

1. Tentukan route yang sesuai (public/dashboard) dan type data di `types/`.
2. Tambahkan/update service di `lib/services/` (atau gunakan mock untuk prototyping).
3. Implementasikan UI + komponen reusable.
4. Tangani loading & error state secara konsisten.
5. Validasi form lewat Zod (`lib/validations/`).
6. Tambahkan unit test bila ada logika kompleks (`vitest run`).

## Troubleshooting

### Error pada build Next.js
- Pastikan TypeScript tidak bermasalah (`npm run type-check`).
- Pastikan alias `@/*` valid (`tsconfig.json`).
- Pastikan variabel env yang dibutuhkan tersedia saat build.
- Pastikan tidak ada import sisi klien di Server Component yang tidak dibutuhkan.

### Halaman tidak memuat data
- Periksa service layer & URL API (`NEXT_PUBLIC_API_BASE_URL`).
- Periksa status backend (`docker compose logs -f backend`).
- Periksa loading & error state pada komponen.

### Dark mode tidak konsisten
- Pastikan komponen memakai kelas Tailwind dark mode (`dark:`).
- Pastikan `uiStore`/tema provider sudah aktif.
- Pastikan konfigurasi warna Tailwind konsisten (`tailwind.config` — via PostCSS).

## Dokumen Pendukung

- `AGENTS.md` — panduan koding agent frontend (pola, konvensi, lint).
- `PRD.md` / `SPEC.md` — kebutuhan produk & spesifikasi teknis halaman.

---

Frontend Desa Anabanua adalah lapisan *user experience* dari sistem informasi desa digital. Dengan Next.js 16, TypeScript, Tailwind CSS, Zustand, PWA, dan arsitektur service-driven, frontend ini dirancang agar **cepat diakses, modern, responsif, dan siap terintegrasi dengan backend API**.
