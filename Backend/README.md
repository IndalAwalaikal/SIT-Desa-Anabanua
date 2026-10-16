# Backend Desa Anabanua

<p align="center">
  <img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Clean_Architecture-4A90E2?style=for-the-badge" alt="Clean Architecture" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT" />
  <img src="https://img.shields.io/badge/Author-Indal_Awalaikal-blue.svg?style=for-the-badge" alt="Author" />
</p>

Backend Desa Anabanua adalah layanan **REST API** yang digunakan frontend website desa untuk mengelola konten, data operasional desa, layanan warga, autentikasi, notifikasi, dan transparansi keuangan/pajak. Aplikasi ini dibangun dengan **Go 1.26** dan menggunakan **MySQL 8.4** sebagai database utama, mengikuti **Clean/Hexagonal Architecture** dengan lapisan yang jelas dan dependency inversion.

> **Desa Anabanua, Kecamatan Barru, Kabupaten Barru, Sulawesi Selatan.** MIT License (c) 2026 Indal Awalaikal.

## Daftar Isi

1. [Tujuan Backend](#tujuan-backend)
2. [Teknologi yang Digunakan](#teknologi-yang-digunakan)
3. [Arsitektur Backend](#arsitektur-backend)
4. [Struktur Folder](#struktur-folder)
5. [Modul dan Endpoint](#modul-dan-endpoint)
6. [Konfigurasi Environment](#konfigurasi-environment)
7. [Menjalankan Backend](#menjalankan-backend)
8. [Pengelolaan Database](#pengelolaan-database)
9. [Pencatatan & Background Jobs](#pencatatan--background-jobs)
10. [Testing](#testing)
11. [CI / CD](#ci--cd)
12. [Security Considerations](#security-considerations)
13. [Deployment dan Operasional](#deployment-dan-operasional)
14. [Troubleshooting](#troubleshooting)
15. [Dokumen Pendukung](#dokumen-pendukung)

## Tujuan Backend

Backend bertanggung jawab untuk:

- Menyediakan API REST untuk frontend dan client internal.
- Menangani **autentikasi & otorisasi** (JWT access/refresh token, RBAC per role).
- CRUD data desa: berita, agenda, UMKM, galeri, fasilitas, penduduk, potensi, profil.
- Mengelola **layanan surat** (persuratan): jenis surat, pengajuan, pencatatan, lampiran, pencetakan PDF.
- Mengelola **pengaduan** warga dan penanganan laporan.
- Mendukung **transparansi pajak** desa & **APBDes** + audit trail.
- Menyimpan file upload pada storage terpisah.
- Mendorong **notifikasi realtime** (SSE) & kirim email/WhatsApp async via job worker.

## Teknologi yang Digunakan

| Layer | Pilihan | Catatan |
|---|---|---|
| Bahasa | **Go 1.26** | Green Tea GC, goroutine leak detector |
| HTTP | **net/http stdlib** (enhanced `ServeMux`, route `{id}`) | Tanpa framework berat — selaras clean architecture |
| Database | **MySQL 8.4 LTS** | Jalur LTS (stabil hingga 2032) |
| Driver DB | `go-sql-driver/mysql` v1.8.1 | |
| Query layer | **sqlc** (generate Go type-safe dari SQL mentah) | Repository = adapter tipis, bukan ORM |
| Migrasi | **golang-migrate** | Version-controlled, via `docker compose run --rm migrate` atau startup |
| Auth | **JWT access (15m) + refresh (30h di-hash, rotasi, dapat dicabut)** | `golang-jwt/jwt/v5` |
| Hash password | `golang.org/x/crypto/bcrypt` (cost 12) | |
| Logging | `log/slog` (structured, JSON) | Standard library |
| Queue | Job worker internal (email, WhatsApp, PDF, cleanup) | |
| Testing | `testing` + `testify` + `httptest` | `go test -race ./...` |
| Container | Docker + docker-compose | service: `backend`, `mysql`, `migrate`, `frontend` |
| File storage | Local path storage (dev) | `FILE_STORAGE_PATH` |

## Arsitektur Backend

Pola **Clean/Hexagonal** — lapisan dalam tidak bergantung pada detail teknis; semua ketergantungan mengarah ke dalam (dependency inversion).

```
┌──────────────────────┐
│   Delivery (HTTP)    │  routing, middleware, handler, response
├──────────────────────┤
│    Usecase           │  business logic, port (interface) repository
├──────────────────────┤
│   Domain             │  entity, enum, error sentinel, rules
└──────────────────────┘
         ▲          (adapters/implementasi di luar)
         │          Infrastructure: mysql repo (sqlc), auth, storage, email, whatsapp, jobs, config
         │
         └── Wiring hanya di cmd/api/main.go
```

**Aturan penting:**

- `domain` tidak boleh import `usecase`, `delivery`, atau `infrastructure`.
- `usecase` hanya bergantung pada `domain` + interface yang ia definisikan (mis. `UserRepository`, `FileStorage`) — **tidak** import `net/http` atau `infrastructure`.
- `delivery` & `infrastructure` boleh pakai `domain`/`usecase`, tapi tidak saling bergantung.
- `cmd/api/main.go` adalah satu-satunya titik wiring.

## Struktur Folder

```
Backend/
├── cmd/api/main.go                  # entrypoint: load config, wiring, start server
├── internal/
│   ├── delivery/http/               # router.go, middleware/, handler/, apiresponse/
│   ├── domain/                      # entity & enum domain
│   ├── infrastructure/              # mysql/ (repo + sqlc), auth, config, email, whatsapp, jobs, storage
│   ├── usecase/                     # modul bisnis (lihat daftar modul)
│   └── pkg/                         # util (apputil, notif)
├── pkg/                             # pdfengine, security, templateengine
├── migrations/                      # 23 pasang file up/down (golang-migrate)
├── scripts/backup.sh                # backup database otomatis
├── go.mod / go.sum
├── sqlc.yaml                        # konfigurasi sqlc
├── Dockerfile, .dockerignore
├── .env.example                     # template env (Go lokal)
└── AGENTS.md / PRD.md / SPEC.md
```

## Modul dan Endpoint

Backend terdiri dari modul bisnis berikut:

| Modul | Fokus |
|---|---|
| **auth** | login, logout, refresh token, register, verifikasi OTP/email, lupa & reset password, profil user |
| **user** | admin/operator desa, role & RBAC |
| **desa** | profil, sejarah, wilayah, struktur organisasi, statistik, potensi |
| **berita** | daftar berita, kategori, pencarian (full-text), komentar |
| **galeri** | album & foto galeri |
| **fasilitas** | data fasilitas umum & peta |
| **umkm** | direktori UMKM & pencarian |
| **persuratan** | jenis surat (100+ jenis), pengajuan, pencatatan, lampiran, cek resi, verifikasi, cetak PDF |
| **pengaduan** | kirim & lacak pengaduan warga, update status |
| **finance** | APBDes, statistik keuangan, agenda (akbar/biasa) |
| **pajak** | jenis pajak, wajib pajak, transaksi, penyetoran batch, konfirmasi, ringkasan |
| **notifikasi** | notifikasi & SSE stream (`/api/notifikasi/stream`) |
| **sekilas_info** | informasi/sekilas info desa |

**Endpoint utama (ringkasan):**

- **Auth** — `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`, dsb.
- **Berita** — `GET /api/berita`, `GET /api/berita/:slug`, `POST/PUT/DELETE` (admin).
- **Profil & Desa** — `GET /api/profil`, `GET /api/statistik`, `GET /api/organisasi`, `GET /api/potensi`, dsb.
- **Persuratan** — `GET /api/surat`, `POST /api/ajuan`, `GET /api/ajuan/:resi`, update status, upload lampiran.
- **Pengaduan** — `GET /api/pengaduan`, `POST /api/pengaduan`, update status.
- **Pajak** — `GET /api/pajak/jenis`, `GET /api/pajak/wajib`, `GET /api/pajak/transaksi`, setoran batch, konfirmasi, ringkasan.

> Daftar endpoint lengkap ada di `internal/delivery/http/router.go` serta `SPEC.md`.

## Konfigurasi Environment

Salin `Backend/.env.example` ke `.env` dan sesuaikan (untuk dev lokal pakai `DB_HOST=localhost`):

| Variabel | Deskripsi | Default/Contoh |
|---|---|---|
| `APP_ENV` | environment | `development` |
| `APP_PORT` | port HTTP | `8080` |
| `DB_HOST` | host MySQL | `localhost` (Go local) / `mysql` (Docker) |
| `DB_PORT` | port MySQL | `3306` |
| `DB_NAME` | nama database | `desa_digital` |
| `DB_USER` | user MySQL | `desa_app` |
| `DB_PASSWORD` | password MySQL | (kuat) |
| `DB_ROOT_PASSWORD` | password root | (kuat) |
| `JWT_ACCESS_SECRET` | secret JWT (≥32 byte) | `openssl rand -base64 32` |
| `DOCUMENT_HMAC_SECRET` | HMAC untuk QR TTD digital (≥32 byte) | `openssl rand -base64 32` |
| `JWT_ACCESS_TTL` | masa berlaku access token | `15m` |
| `JWT_REFRESH_TTL` | masa berlaku refresh token | `720h` (30h) |
| `BOOTSTRAP_SUPER_ADMIN_*` | seeding akun admin pertama (hapus setelah boot) | - |
| `FILE_STORAGE_PATH` | folder upload lokal | `./uploads` |
| `CORS_ALLOWED_ORIGINS` | origin yang diizinkan | `http://localhost:3000` |
| `LOG_LEVEL` | level log | `info` |
| `MAILJET_API_KEY` / `MAILJET_API_SECRET` / `MAILJET_FROM_EMAIL` | Sinch Mailjet email provider (opsional; NOOP di dev) | - |
| `FLOWKIRIM_API_KEY` / `FLOWKIRIM_BASE_URL` | provider WhatsApp (opsional; NOOP di dev) | - |

> **Docker:** gunakan template `.env` di root repository (`.env.example`) yang meng‑override `DB_HOST=mysql` dan `FILE_STORAGE_PATH=/app/uploads`.

## Menjalankan Backend

### Lewat Docker Compose (disertakan frontend + mysql + migrasi)

```bash
cd /home/rex/projek/Desa Anabanua
cp .env.example .env
docker compose up --build -d backend
# semua service: docker compose up --build -d
```

Backend tersedia di `http://localhost:8088` (container) atau `http://localhost:8080` (Go local).

### Lokal (Go)

```bash
cd Backend
cp .env.example .env          # sesuaikan, DB_HOST=localhost
go mod tidy
go mod download
go run ./cmd/api
```

> Backend membutuhkan **MySQL aktif** + **migrasi sudah dijalankan**.

## Pengelolaan Database

Migrasi ada di `Backend/migrations` (23 pasang `up`/`down`, dikelola `golang-migrate`):

```bash
docker compose up -d mysql
docker compose run --rm migrate            # up
# reset dari nol:
docker compose down -v
docker compose up --build -d
```

Jika memakai `sqlc` untuk generate query type-safe:

```bash
sqlc generate    # baca Backend/sqlc.yaml -> Backend/internal/infrastructure/mysql/sqlc
```

## Pencatatan & Background Jobs

- Backend memakai `log/slog` terstruktur (JSON ke stdout).
- **Job worker** memproses queue: email (Sinch Mailjet), WhatsApp (FlowKirim), generasi PDF surat, dan pembersihan data kadaluarsa — sehingga request responsif.
- Email & WhatsApp bersifat **asynchronous**: jika provider tidak dikonfigurasi, berada di mode **NOOP** dan pesan dicetak ke log (bisa di‑tes verifikasi/OTP di dev).
- Notifikasi push ke browser lewat **SSE** di `/api/notifikasi/stream`.

## Testing

Pakai standard library + testify (`Backend/go.mod`):

```bash
go test ./...                 # semua unit + handler test
go test -race ./...           # dengan race detector (wajib sebelum merge)
go test -cover ./...          # cakupan kode (opsional)
go vet ./...                  # lints/stastic analysis
```

Kebijakan testing:

- Unit test untuk **usecase** (mock repository).
- Test **handler API** untuk happy path + validasi error.
- Test repository bila query kompleks.
- Test alur status pada modul persuratan & pajak.

## CI / CD

`.github/workflows/ci.yml` — job `backend`:

- `setup-go@v5` (Go 1.26) → `go mod download` → `go vet ./...` → `go test ./...` → `go test -race ./...` (service MySQL 8.4 sebagai test database).

## Security Considerations

- Jangan pernah hardcode secret/password ke source code — pakai environment variable.
- Password di-hash (bcrypt); JWT access token stateless; refresh token di‑hash di DB, berotasi tiap pakai, dapat dicabut; deteksi reuse sebagai indikator pencurian token.
- Validasi semua input (body, query, path parameter).
- Operasi multi‑tabel kritis dibungkus **transaksi** lewat interface `TxManager`.
- Query SQL eksplisit lewat sqlc — hindari concatenation rentan SQL injection.
- Gunakan transaksi DB saat mengubah lebih dari satu tabel.
- Logging & audit trail untuk perubahan status kritis.
- Jangan kembalikan data sensitif (password hash, token) di response.
- `panic` hanya untuk bug fatal; ditangkap middleware `recover`.

## Deployment dan Operasional

Persiapan production:

- Environment variable produksi (secret, DB, CORS, storage permanen & aman).
- Backup DB otomatis via `Backend/scripts/backup.sh` (retensi 30 hari).

  ```bash
  cd Backend && bash scripts/backup.sh
  ```

- Storage file permanen (volume) terpisah dari source code.
- CORS dibatasi pada domain produksi.
- Health/readiness endpoint tersedia pada router (cek di `router.go`).
- Log management siap dipantau (JSON structured logs → stdout).

## Troubleshooting

### Backend tidak bisa start
- Pastikan Go 1.26 terpasang.
- Periksa `.env` sudah benar.
- Pastikan MySQL aktif & migrasi sudah berjalan.
- Pastikan port (`APP_PORT`/8088) belum dipakai.

### Koneksi database gagal
- Periksa `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- Pastikan container MySQL sudah *healthy*.
- Pastikan migrasi sudah dijalankan (`docker compose run --rm migrate`).

### Error JWT / login
- Periksa `JWT_ACCESS_SECRET` (≥32 byte, sama antara lokal & Docker).
- Periksa format token & masa berlaku (15m).
- Periksa refresh token validity & rotasi.

### Error file upload
- Periksa `FILE_STORAGE_PATH` & permission folder upload.
- Pada Docker, pastikan volume `uploads` tersedia.

## Dokumen Pendukung

- `AGENTS.md` — panduan kerja AI coding agent backend (clean arch, DoD, teknologi).
- `PRD.md` / `SPEC.md` — kebutuhan produk & spesifikasi teknis backend.

---

Backend Desa Anabanua adalah tulang punggung sistem informasi desa digital. Dengan Go, MySQL, JWT, migrasi database, job worker async, dan arsitektur modular, backend ini dirancang untuk mendukung kebutuhan operasional desa yang kompleks namun tetap **terstruktur, aman, dan mudah dikembangkan**.
