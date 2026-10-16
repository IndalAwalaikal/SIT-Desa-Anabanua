# AGENTS-FRONTEND.md
Panduan kerja untuk AI Coding Agent pada frontend Website Desa Anabanua. Frontend adalah aplikasi Next.js 15 (App Router) yang mengonsumsi REST API dari backend Go.

Baca juga `SPEC.md` dan `PRD.md` sebelum mulai. Pastikan kontrak API di `Backend/internal/delivery/http/router.go` konsisten dengan pemanggilan di `lib/services/`.

## 1. Ringkasan

| Aspek | Detail |
|---|---|
| Framework | Next.js 15 (App Router) |
| Bahasa | TypeScript (strict) |
| Styling | Tailwind CSS v4, komponen di `components/ui/` |
| State | Zustand (`store/authStore.ts`) |
| HTTP | `fetch` via `lib/services/api.ts` (`apiRequest`, `apiBlob`, `query`) |
| Auth | JWT access (15m) + refresh (720h) di HttpOnly cookie + CSRF double-submit |
| i18n | Sederhana — `lib/i18n/`, kamus di `messages/id.json` |
| Test | Vitest (`npm test`), TS-check (`npm run type-check`) |

## 2. Struktur Direktori

```
Frontend/
├── app/                      App Router
│   ├── (public)/             Rute publik (profil, layanan, berita, dll.)
│   ├── (dashboard)/          Rute yang butuh auth
│   └── layout.tsx            Root layout
├── components/               ui/, layout/, features/
├── lib/services/             Semua API call (api.ts + *.service.ts + index.ts barrel)
├── lib/i18n/                 useTranslation hook
├── types/                    Type definitions per domain + index.ts barrel
├── store/                    Zustand stores
├── hooks/                    Custom hooks
├── middleware.ts             ⚠️ Wajib bernama ini agar Next.js mengenali
├── public/                   Static assets
└── AGENTS.md                 File ini
```

## 3. Aturan Emas

1. **Server Component by default** — halaman di App Router adalah Server Component kecuali ada `'use client'`. Gunakan untuk data fetching.
2. **Semua API call lewat service** — jangan pernah `fetch` langsung di komponen. Pakai helper di `lib/services/`.
3. **Middleware wajib `middleware.ts`** — satu-satunya cara Next.js mengenali file middleware. JANGAN ganti ke `proxy.ts`.
4. **Export tipe baru di `types/index.ts`** — barrel export agar konsisten.
5. **Mock data sudah dihapus** — semua file di `lib/mock/` telah dihapus. Pakai API lokal untuk dev data.
6. **Env vars** — `NEXT_PUBLIC_` = tersedia di browser. `API_INTERNAL_URL` = hanya di server (SSR). Jangan expose secrets dengan `NEXT_PUBLIC_`.

## 4. Kontrak API

Backend response format standar:
```json
{ "data": <payload> }
// atau list:
{ "items": [...], "meta": { "page": 1, "limit": 10, "total": N, "totalPages": N } }
```

Helper `parseResponse<T>` di `api.ts` otomatis ekstrak `data` dan throw `ApiError` bila `!response.ok`.

**Pagination** — Backend format tidak konsisten: pajak pakai `{data, total, page, limit}`, endpoint lain pakai `{items, meta}`. Service layer standardisasi via `PaginatedResult<T>` dan `asPaginated()`.

## 5. Auth Flow

- Login: POST `/api/auth/login` — backend set cookie `access_token` (HttpOnly, Secure di prod, 15min), `refresh_token` (HttpOnly, 720h), `csrf_token_v2`
- Refresh: POST `/api/auth/refresh` — trigger otomatis `apiRequest` saat 401
- Logout: POST `/api/auth/logout` — hapus semua cookie, butuh CSRF token
- `authStore` (Zustand) menyimpan state user (bukan token — token di HttpOnly cookie)
- `apiRequest({ auth: true })` otomatis kirim cookie via `credentials: 'include'`
- `middleware.ts` redirect `/akun/*`, `/dashboard/*` ke `/login` jika tidak ada cookie

## 6. Env Variables

Lihat `.env.example`. Kunci penting:
- `NEXT_PUBLIC_API_BASE_URL=/api` (browser → Next.js rewrite → backend)
- `API_INTERNAL_URL=http://localhost:8080` (SSR → backend langsung)
- `NEXT_PUBLIC_WHATSAPP_NUMBER=6285757106358` (FloatingWhatsApp)
- `NEXT_PUBLIC_MOCK_DELAY_MS=0` (delay simulasi network, dev only)

## 7. Dev Workflow

```bash
cd Frontend
npm install
npm run dev              # http://localhost:3000
```

Pastikan backend berjalan (`API_INTERNAL_URL` mengarah ke backend yang hidup).

### Test & Build
```bash
npm run type-check       # tsc --noEmit
npm run lint            # eslint .
npm run build           # next build
npm test                # vitest run
```

### CI Pipeline
`.github/workflows/ci.yml` frontend: `npm ci` → `type-check` → `lint` → `build` → `test`.

## Daftar Isi

1. [Tujuan Sistem](#tujuan-sistem)
2. [Arsitektur](#arsitektur)
3. [Struktur Repository](#struktur-repository)
4. [Teknologi yang Digunakan](#teknologi-yang-digunakan)
5. [Persyaratan Sistem](#persyaratan-sistem)
6. [Konfigurasi Environment](#konfigurasi-environment)
7. [Menjalankan Aplikasi Secara Lokal](#menjalankan-aplikasi-secara-lokal)
8. [Pengelolaan Database](#pengelolaan-database)
9. [API dan Integrasi](#api-dan-integrasi)
10. [Keamanan dan Best Practice](#keamanan-dan-best-practice)
11. [Troubleshooting](#troubleshooting)
12. [Dokumentasi Pendukung](#dokumentasi-pendukung)
13. [Kontribusi](#kontribusi)
14. [Lisensi](#lisensi)

## Tujuan Sistem

- Menyediakan portal informasi digital desa yang mudah diakses publik.
- Menyederhanakan pengelolaan data desa secara terstruktur.
- Memungkinkan pengajuan dan pelacakan layanan warga secara digital.
- Meningkatkan transparansi keuangan dan pajak desa.
- Memudahkan admin desa dalam mengelola konten, data, dan proses administrasi.

## Arsitektur

Proyek mengikuti tiga layer utama:

| Layer | Isi |
|---|---|
| Frontend | Next.js, React, Tailwind CSS, Zustand, komponen UI reusable |
| Application | Backend Go API, usecase/domain logic, routing HTTP |
| Data | MySQL, migrasi schema, repository, file storage |

Alur kerja singkat:

```
Browser -> Frontend (Next.js) -> API Backend (Go) -> MySQL / File Storage
```

## Struktur Repository

```
.
├── docker-compose.yml
├── README.md
├── .env.example
├── .env
├── Backend/
│   ├── cmd/
│   ├── internal/
│   ├── migrations/
│   ├── pkg/
│   ├── Dockerfile
│   ├── go.mod
│   ├── README.md
│   ├── SPEC.md
│   └── PRD.md
└── Frontend/
    ├── app/
    ├── components/
    ├── lib/
    ├── public/
    ├── store/
    ├── types/
    ├── package.json
    ├── Dockerfile
    ├── README.md
    ├── SPEC.md
    └── PRD.md
```

**Folder Frontend:**

| Folder | Isi |
|---|---|
| `app/` | Route aplikasi dan halaman utama |
| `components/` | Komponen reusable UI dan layout |
| `lib/services/` | Layer akses data dan integrasi API |
| `lib/mock/` | Data contoh untuk prototyping |
| `lib/validations/` | Schema validasi form |
| `store/` | Zustand store untuk state aplikasi |
| `types/` | Definisi tipe data TypeScript |

**Folder Backend:**

| Folder | Isi |
|---|---|
| `cmd/api` | Entrypoint aplikasi |
| `internal/domain` | Entity domain dan aturan bisnis dasar |
| `internal/usecase` | Logika bisnis per modul |
| `internal/delivery/http` | Routing HTTP, handler, middleware |
| `internal/infrastructure` | Database, auth, storage |
| `migrations/` | File migrasi MySQL |
| `pkg/` | Utilitas umum dan helper |

## Teknologi yang Digunakan

**Frontend**

<p>
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Zustand-433E38?style=flat-square&logo=react&logoColor=white" alt="Zustand" />
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/Lucide_React-F56565?style=flat-square&logo=lucide&logoColor=white" alt="Lucide React" />
  <img src="https://img.shields.io/badge/Recharts-8884d8?style=flat-square" alt="Recharts" />
  <img src="https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white" alt="Leaflet" />
</p>

**Backend**

<p>
  <img src="https://img.shields.io/badge/Go_1.26-00ADD8?style=flat-square&logo=go&logoColor=white" alt="Go 1.26" />
  <img src="https://img.shields.io/badge/MySQL_8.4-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL 8.4" />
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/bcrypt-4B8BBE?style=flat-square" alt="bcrypt" />
  <img src="https://img.shields.io/badge/golang--migrate-00ADD8?style=flat-square&logo=go&logoColor=white" alt="golang-migrate" />
  <img src="https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose" />
</p>

## Persyaratan Sistem

| Kebutuhan | Keterangan |
|---|---|
| Docker & Docker Compose | Untuk menjalankan seluruh sistem |
| Node.js 22 | Untuk pengembangan frontend lokal |
| Go 1.26 | Untuk pengembangan backend lokal |
| Port 3300 | Frontend |
| Port 8088 | Backend (host) |
| Port 3306 | MySQL (host) |

## Konfigurasi Environment

Project root menggunakan file `.env` (template tersedia di `.env.example`). Pastikan file ini **tidak** dipublikasikan ke repository karena berisi data sensitif.

| Variabel | Keterangan |
|---|---|
| `DB_NAME` | Nama database |
| `DB_USER` | Username database |
| `DB_PASSWORD` | Password database |
| `DB_ROOT_PASSWORD` | Password root MySQL |
| `JWT_ACCESS_SECRET` | Secret untuk token JWT |
| `BOOTSTRAP_SUPER_ADMIN_PASSWORD` | Password admin awal |
| `NEXT_PUBLIC_APP_NAME` | Nama aplikasi (frontend) |
| `NEXT_PUBLIC_SITE_URL` | URL situs publik |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL API dari sisi client |
| `API_INTERNAL_URL` | URL API untuk komunikasi internal |

## Menjalankan Aplikasi Secara Lokal

### Dengan Docker Compose (seluruh sistem)

```bash
docker compose up --build -d
```

| Layanan | URL |
|---|---|
| Frontend | http://localhost:3300 |
| Backend | http://localhost:8088 |
| MySQL | localhost:3306 |

Melihat log:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

Menghentikan layanan:

```bash
docker compose down
```

Menghentikan sekaligus menghapus data database:

```bash
docker compose down -v
```

### Backend secara lokal

```bash
cd Backend
go mod tidy
go run ./cmd/api
```

Pastikan MySQL sedang aktif dan environment sudah sesuai.

### Frontend secara lokal

```bash
cd Frontend
npm install
npm run dev
```

Frontend akan berjalan di http://localhost:3000.

## Pengelolaan Database

Migrasi database berada di `Backend/migrations`.

```bash
# menjalankan MySQL dan migrasi
docker compose up -d mysql
docker compose run --rm migrate

# restart database dari nol
docker compose down -v
docker compose up --build -d
```

## API dan Integrasi

Backend menyediakan REST API yang diakses frontend melalui service layer di `lib/services`.

- Frontend tidak mengakses data langsung dari komponen.
- Semua request diarahkan melalui service abstraction.
- Error API diproses konsisten melalui helper response/error handling.

## Keamanan dan Best Practice

- Rahasia disimpan di `.env`, bukan di source code.
- Password di-hash sebelum disimpan.
- JWT digunakan untuk autentikasi; refresh token disimpan dan dirotasi.
- File upload disimpan di storage terpisah dari source code.
- CORS dibatasi sesuai domain yang diizinkan.
- Audit trail diterapkan pada modul transaksi seperti pajak dan layanan.

## Troubleshooting

| Masalah | Yang Perlu Diperiksa |
|---|---|
| Port 3300/8088 sudah dipakai | Ubah konfigurasi di `docker-compose.yml` atau hentikan service lain yang memakai port tersebut |
| MySQL tidak bisa mulai | File `.env`, `DB_ROOT_PASSWORD`, volume `mysql_data`, status Docker |
| Backend gagal konek ke database | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, status migrasi |
| Frontend tidak bisa memanggil API | `NEXT_PUBLIC_API_BASE_URL`, `API_INTERNAL_URL`, `CORS_ALLOWED_ORIGINS` di backend, status service backend |

## Dokumentasi Pendukung

- **Backend README** — detail implementasi API dan arsitektur backend.
- **Frontend README** — detail implementasi interface dan fitur aplikasi web.
- **PRD & SPEC** di masing-masing folder — kebutuhan produk dan spesifikasi teknis.

## Kontribusi

Proyek ini dapat dikembangkan oleh developer frontend, developer backend, admin/operator desa, dan stakeholder atau product owner. Pastikan setiap perubahan disesuaikan dengan dokumen produk dan spesifikasi yang ada di masing-masing folder project.

## Lisensi

Proyek ini dilisensikan di bawah **MIT License**.

Hak Cipta (c) 2026 **Indal Awalaikal**

Lisensi MIT mengizinkan siapa pun menggunakan, menyalin, memodifikasi, dan mendistribusikan proyek ini secara bebas — bahkan untuk keperluan komersial — selama pemberitahuan hak cipta di atas tetap disertakan pada setiap salinan atau turunan. Ini juga berarti kepenulisan asli tercatat secara resmi dan tidak dapat diklaim ulang oleh pihak lain sebagai karya orisinal mereka.

Teks lengkap lisensi tersedia di berkas [`LICENSE`](./LICENSE) pada root repository.