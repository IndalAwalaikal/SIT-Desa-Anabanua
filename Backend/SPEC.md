# SPEC-BACKEND.md
## Spesifikasi Teknis — Backend Website Desa Digital

Versi 1.0 · 14 Agustus 2026 · Pelengkap dari `PRD-BACKEND.md` dan `AGENTS-BACKEND.md`

---

## 1. Tech Stack & Versi Acuan

| Layer | Pilihan | Detail |
|---|---|---|
| Bahasa | **Go 1.26.6** | `go.mod` → `go 1.26` |
| Database | **MySQL 8.4 LTS** (mis. 8.4.11) | Charset `utf8mb4`, collation `utf8mb4_unicode_ci`, storage engine InnoDB |
| Driver DB | `github.com/go-sql-driver/mysql` | — |
| Query codegen | `sqlc` | Query SQL mentah di `internal/infrastructure/mysql/sqlc/queries/*.sql`, digenerate jadi kode Go type-safe |
| Migrasi | `golang-migrate/migrate` | File di `migrations/`, dijalankan via CLI terpisah atau otomatis saat startup (dev only) |
| Router | `net/http` stdlib (`http.ServeMux` pattern `METHOD /path/{param}`) | Tersedia sejak Go 1.22, cukup matang untuk REST API skala proyek ini |
| Auth | JWT access token + refresh token (DB) | Lihat §5 |
| Password hashing | `bcrypt` cost 12 | `golang.org/x/crypto/bcrypt` |
| Validasi | `go-playground/validator/v10` | Tag validasi di struct DTO |
| Logging | `log/slog` (stdlib) | Format JSON di production, text di development |
| Container | Docker (multi-stage build), `docker-compose` | Image akhir berbasis `distroless` atau `alpine` |

## 2. Arsitektur (ringkas — detail di `AGENTS-BACKEND.md` §3–4)

Clean/Hexagonal Architecture 4 lapis: `domain` → `usecase` (mendefinisikan port/interface) → `delivery` (adapter HTTP) & `infrastructure` (adapter MySQL/JWT/storage). Wiring hanya di `cmd/api/main.go`.

## 3. Skema Database

### 3.1 Ringkasan Tabel

| Tabel | Deskripsi |
|---|---|
| `users` | Akun warga & admin (satu tabel, dibedakan kolom `role`) |
| `refresh_tokens` | Refresh token aktif (di-hash), untuk rotasi & pencabutan |
| `jenis_surat` | Master jenis surat/layanan persuratan |
| `pengajuan_surat` | Permohonan surat oleh warga |
| `pengajuan_lampiran` | File lampiran per pengajuan |
| `pengajuan_riwayat_status` | Audit trail perubahan status pengajuan |
| `pengaduan` | Pengaduan/aspirasi warga |
| `berita` | Berita & artikel |
| `profil_desa` | Data profil desa (satu baris/singleton) |
| `statistik_penduduk` | Statistik kependudukan per tahun |
| `apbdes_item` | Item transparansi anggaran per tahun |
| `agenda_kegiatan` | Agenda/kalender kegiatan |
| `galeri_album`, `galeri_item` | Album & foto galeri |
| `umkm` | Direktori UMKM |

### 3.2 DDL Inti (contoh migrasi — pola ini diikuti untuk tabel lain)

```sql
-- 000001_create_users.up.sql
CREATE TABLE users (
  id            CHAR(26)     NOT NULL PRIMARY KEY,        -- ULID
  nama          VARCHAR(150) NOT NULL,
  email         VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nik           VARCHAR(16)  NULL,
  role          ENUM('warga', 'admin', 'super_admin') NOT NULL DEFAULT 'warga',
  avatar_url    VARCHAR(255) NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 000002_create_refresh_tokens.up.sql
CREATE TABLE refresh_tokens (
  id            CHAR(26)     NOT NULL PRIMARY KEY,
  user_id       CHAR(26)     NOT NULL,
  token_hash    VARCHAR(255) NOT NULL,          -- SHA-256 dari refresh token, bukan token mentah
  expires_at    DATETIME     NOT NULL,
  revoked_at    DATETIME     NULL,
  replaced_by   CHAR(26)     NULL,               -- untuk deteksi reuse saat rotasi
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_refresh_tokens_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 000003_create_jenis_surat.up.sql
CREATE TABLE jenis_surat (
  kode          VARCHAR(10)  NOT NULL PRIMARY KEY,   -- "SKD", "SKU", dst.
  nama          VARCHAR(150) NOT NULL,
  deskripsi     TEXT         NULL,
  persyaratan   JSON         NOT NULL,               -- array string
  form_fields   JSON         NOT NULL,               -- konfigurasi form dinamis
  estimasi_hari INT          NOT NULL DEFAULT 3,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 000004_create_pengajuan_surat.up.sql
CREATE TABLE pengajuan_surat (
  id               CHAR(26)     NOT NULL PRIMARY KEY,
  nomor_resi       VARCHAR(30)  NOT NULL,
  jenis_surat_kode VARCHAR(10)  NOT NULL,
  pemohon_id       CHAR(26)     NOT NULL,
  data_isian       JSON         NOT NULL,
  status           ENUM('diajukan','diverifikasi','diproses','selesai','ditolak')
                     NOT NULL DEFAULT 'diajukan',
  catatan_admin    TEXT         NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_pengajuan_resi (nomor_resi),
  FOREIGN KEY (jenis_surat_kode) REFERENCES jenis_surat(kode),
  FOREIGN KEY (pemohon_id) REFERENCES users(id),
  KEY idx_pengajuan_pemohon (pemohon_id),
  KEY idx_pengajuan_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 000005_create_pengajuan_riwayat_status.up.sql
CREATE TABLE pengajuan_riwayat_status (
  id            CHAR(26) NOT NULL PRIMARY KEY,
  pengajuan_id  CHAR(26) NOT NULL,
  status        ENUM('diajukan','diverifikasi','diproses','selesai','ditolak') NOT NULL,
  catatan       TEXT NULL,
  changed_by    CHAR(26) NULL,                     -- admin yang mengubah (null jika sistem)
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pengajuan_id) REFERENCES pengajuan_surat(id) ON DELETE CASCADE,
  KEY idx_riwayat_pengajuan (pengajuan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 000006_create_pengajuan_lampiran.up.sql
CREATE TABLE pengajuan_lampiran (
  id            CHAR(26)     NOT NULL PRIMARY KEY,
  pengajuan_id  CHAR(26)     NOT NULL,
  nama_file     VARCHAR(255) NOT NULL,
  url           VARCHAR(255) NOT NULL,
  ukuran_bytes  INT          NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pengajuan_id) REFERENCES pengajuan_surat(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Tabel lain (`pengaduan`, `berita`, `profil_desa`, `statistik_penduduk`, `apbdes_item`, `agenda_kegiatan`, `galeri_album`, `galeri_item`, `umkm`) mengikuti pola yang sama: primary key `CHAR(26)` ULID, `created_at`/`updated_at` standar, foreign key eksplisit, index pada kolom yang sering difilter (`slug`, `kategori`, `status`, `tahun`).

> **Catatan desain:** ID memakai **ULID** (bukan auto-increment) agar dapat digenerate di sisi aplikasi sebelum insert (memudahkan penulisan test & menghindari kebocoran informasi jumlah baris lewat ID berurutan), sekaligus tetap urut secara waktu (berbeda dari UUID v4 acak murni).

## 4. Matriks Otorisasi Endpoint

| Endpoint (ringkas) | Publik | `warga` | `admin` | `super_admin` |
|---|:---:|:---:|:---:|:---:|
| `GET` berita, layanan, statistik, apbdes, galeri, umkm (baca) | ✅ | ✅ | ✅ | ✅ |
| `POST /auth/register`, `/auth/login`, `/auth/refresh` | ✅ | — | — | — |
| `POST /pengajuan`, `GET /pengajuan/saya`, `POST /pengaduan` | — | ✅ | ✅ | ✅ |
| `GET /pengajuan/{nomorResi}` (lacak) | ✅ | ✅ | ✅ | ✅ |
| `POST/PUT/DELETE` berita, layanan, galeri, umkm, statistik, apbdes | — | — | ✅ | ✅ |
| `PATCH /pengajuan/{id}/status`, `PATCH /pengaduan/{id}/status` | — | — | ✅ | ✅ |
| `/users` (CRUD pengguna admin) | — | — | — | ✅ |

## 5. Alur Autentikasi

### 5.1 Registrasi & Login
1. `POST /api/auth/register` → validasi input, cek email unik, hash password (bcrypt), simpan user role `warga`.
2. `POST /api/auth/login` → verifikasi password, terbitkan:
   - **Access token** (JWT, klaim: `sub` (user id), `role`, `exp` 15 menit, ditandatangani `JWT_ACCESS_SECRET`).
   - **Refresh token** (string acak 256-bit, disimpan **hash SHA-256**-nya di tabel `refresh_tokens`, masa berlaku 30 hari).

### 5.2 Refresh Token (dengan rotasi)
1. `POST /api/auth/refresh` menerima refresh token lama.
2. Backend hash token yang diterima, cari di `refresh_tokens`.
3. Jika tidak ditemukan/kedaluwarsa/sudah dicabut → tolak (401).
4. Jika token sudah pernah "diganti" sebelumnya (`replaced_by` terisi) tapi dipakai lagi → **indikasi pencurian token**: cabut seluruh refresh token milik user tersebut, tolak request.
5. Jika valid → terbitkan access token baru + refresh token baru, tandai token lama `revoked_at` + `replaced_by` ke token baru (rotasi).

### 5.3 Logout
`POST /api/auth/logout` → cabut (revoke) refresh token yang sedang dipakai.

### 5.4 Middleware Auth
- `AuthMiddleware`: parse header `Authorization: Bearer <access_token>`, verifikasi signature & masa berlaku, inject `UserClaims` ke `context.Context`.
- `RequireRole(roles ...string)`: cek `UserClaims.Role` termasuk dalam daftar yang diizinkan, kembalikan 403 bila tidak.

## 6. Konvensi Response

### 6.1 Response Sukses
```json
{
  "data": { "...": "..." },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```
`meta` hanya muncul untuk endpoint list/paginated.

### 6.2 Response Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid",
    "details": [
      { "field": "email", "message": "Format email tidak valid" }
    ]
  }
}
```

| Kode Error | HTTP Status | Kapan dipakai |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input gagal validasi |
| `UNAUTHORIZED` | 401 | Token tidak ada/invalid/kedaluwarsa |
| `FORBIDDEN` | 403 | Role tidak diizinkan |
| `NOT_FOUND` | 404 | Resource tidak ditemukan |
| `CONFLICT` | 409 | Duplikasi (mis. email sudah terdaftar) |
| `INTERNAL_ERROR` | 500 | Kegagalan tak terduga (jangan bocorkan detail internal ke client) |

### 6.3 Pagination Query Params
`?page=1&limit=10&search=&kategori=&sort=-created_at` — parameter tidak wajib punya default (`page=1`, `limit=10`, `sort=-created_at`).

## 7. Kontrak Endpoint Lengkap

### 7.1 Auth
| Method | Path | Auth | Body/Query |
|---|---|---|---|
| POST | `/api/auth/register` | Publik | `{ nama, email, password, nik? }` |
| POST | `/api/auth/login` | Publik | `{ email, password }` → `{ accessToken, refreshToken, user }` |
| POST | `/api/auth/refresh` | Publik (bawa refresh token) | `{ refreshToken }` → `{ accessToken, refreshToken }` |
| POST | `/api/auth/logout` | Bearer | `{ refreshToken }` |
| GET | `/api/auth/me` | Bearer | — → data user aktif |

### 7.2 Berita
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/berita` | Publik | Query: `page,limit,kategori,search` |
| GET | `/api/berita/{slug}` | Publik | — |
| GET | `/api/admin/berita` | `admin+` | List termasuk draft |
| POST | `/api/berita` | `admin+` | Buat berita |
| PUT | `/api/berita/{id}` | `admin+` | Ubah berita |
| DELETE | `/api/berita/{id}` | `admin+` | Hapus berita |

### 7.3 Layanan Persuratan
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/layanan` | Publik | List jenis surat aktif |
| GET | `/api/layanan/{kode}` | Publik | Detail jenis surat |
| GET | `/api/admin/layanan` | `admin+` | List termasuk layanan nonaktif |
| POST | `/api/layanan` | `admin+` | Tambah jenis surat |
| PUT | `/api/layanan/{kode}` | `admin+` | Ubah jenis surat |
| POST | `/api/pengajuan` | `warga+` | Submit pengajuan (multipart: `data` JSON + file lampiran) → `{ nomorResi, ... }` |
| GET | `/api/pengajuan/{nomorResi}` | Publik | Lacak status |
| GET | `/api/pengajuan/saya` | `warga+` | Riwayat pengajuan milik user login |
| GET | `/api/pengajuan/{id}/lampiran/{lampiranId}` | Pemohon/admin | Unduh lampiran privat |
| GET | `/api/pengajuan` | `admin+` | List pengajuan berhalaman: `page`, `limit` (maks. 100), `status`, `search`, `sort`; respons `{ items, meta }` |
| PATCH | `/api/pengajuan/{id}/status` | `admin+` | `{ status, catatan? }` |

### 7.4 Pengaduan
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/pengaduan` | `warga+` | `{ kategori, judul, deskripsi, lokasi? }` |
| GET | `/api/pengaduan/{nomorTiket}` | Publik | Lacak status |
| GET | `/api/pengaduan` | `admin+` | List pengaduan berhalaman: `page`, `limit` (maks. 100), `status`, `search`, `sort`; respons `{ items, meta }` |
| PATCH | `/api/pengaduan/{id}/status` | `admin+` | `{ status, tanggapanAdmin? }` |

### 7.5 Informasi Desa
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/profil-desa` | Publik | — |
| PUT | `/api/profil-desa` | `admin+` | — |
| GET | `/api/statistik/penduduk?tahun=` | Publik | — |
| POST/PUT | `/api/statistik/penduduk` | `admin+` | — |
| GET | `/api/apbdes?tahun=` | Publik | — |
| POST/PUT | `/api/apbdes` | `admin+` | — |
| GET | `/api/agenda` | Publik | Query: `bulan,tahun` |
| POST/PUT/DELETE | `/api/agenda/{id}` | `admin+` | — |

### 7.6 Galeri & UMKM
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/galeri` | Publik | List album |
| GET | `/api/galeri/{id}` | Publik | Detail album + item |
| POST/PUT/DELETE | `/api/galeri/{id}` | `admin+` | — |
| GET | `/api/umkm` | Publik | List + filter kategori |
| GET | `/api/umkm/{slug}` | Publik | Detail |
| POST/PUT/DELETE | `/api/umkm/{id}` | `admin+` | — |

### 7.7 Dashboard & Manajemen Pengguna
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/users` | `super_admin` | List pengguna berhalaman: `page`, `limit` (maks. 100), `search`; respons `{ items, meta }` |
| POST | `/api/users` | `super_admin` | Buat akun admin baru |
| PUT | `/api/users/{id}` | `super_admin` | Ubah role/status aktif |
| DELETE | `/api/users/{id}` | `super_admin` | Nonaktifkan akun |

### 7.8 Kesehatan Sistem
| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/healthz` | Publik | Liveness check |
| GET | `/readyz` | Publik | Readiness check (cek koneksi DB) |

## 8. Upload File

- Endpoint yang menerima file (`POST /api/pengajuan`, galeri, UMKM) memakai `multipart/form-data`.
- Validasi: ukuran maksimum (misal 5MB per file), tipe MIME diizinkan (`image/jpeg`, `image/png`, `application/pdf`).
- Disimpan via interface `FileStorage`:
  ```go
  type FileStorage interface {
      Save(ctx context.Context, folder string, file io.Reader, filename string) (url string, err error)
      Delete(ctx context.Context, url string) error
  }
  ```
- Implementasi `local_storage.go` menyimpan ke `FILE_STORAGE_PATH` dan menyajikan lewat static file server (`/uploads/...`); implementasi S3-compatible menyusul di Fase 3 tanpa mengubah interface.

## 9. Keamanan

- **Password**: bcrypt cost 12, tidak pernah dikembalikan di response mana pun.
- **JWT**: secret minimal 256-bit, algoritma HS256 (atau RS256 bila ingin verifikasi terdistribusi di masa depan), access token berumur pendek.
- **Rate limiting**: terapkan token-bucket sederhana per-IP khusus endpoint `login`, `register`, dan `refresh` untuk mencegah brute force.
- **CORS**: whitelist origin dari `CORS_ALLOWED_ORIGINS`, jangan gunakan `*` bila `Authorization` header dipakai.
- **SQL Injection**: seluruh akses data lewat query terparameterisasi hasil generate sqlc — tidak ada string concatenation SQL.
- **Input validation**: setiap DTO tervalidasi (`validator` tags) sebelum diteruskan ke usecase.
- **Audit trail**: setiap perubahan status pengajuan/pengaduan tercatat siapa (`changed_by`) dan kapan.

## 10. Logging & Observability

- `log/slog` dengan handler JSON di production.
- Middleware `RequestID` menambahkan header `X-Request-ID` (generate bila belum ada) dan menyisipkannya ke setiap log entry dalam request tsb.
- Log minimal per request: method, path, status code, durasi, request ID, user id (bila ada).
- `/healthz` → selalu 200 bila proses hidup. `/readyz` → 200 hanya bila `db.Ping()` berhasil.

## 11. Testing Plan

Lihat `AGENTS-BACKEND.md` §9 untuk tools. Prioritas skenario:
- Alur lengkap: registrasi → login → ajukan surat → admin verifikasi → proses → selesai (integrasi end-to-end).
- Rotasi refresh token & deteksi reuse token lama.
- Validasi input gagal mengembalikan `VALIDATION_ERROR` dengan detail field yang benar.
- RBAC: akses endpoint admin oleh role `warga` harus 403.

## 12. Deployment

```yaml
# docker-compose.yml (ringkas)
services:
  api:
    build: .
    ports: ["8080:8080"]
    env_file: .env
    depends_on: [mysql]
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes: ["mysql_data:/var/lib/mysql"]
    ports: ["3306:3306"]
volumes:
  mysql_data:
```

- Migrasi dijalankan sebagai langkah terpisah sebelum start API (`migrate -path migrations -database "$DATABASE_URL" up`), bukan otomatis di dalam `main.go` untuk production (hindari race condition saat multi-instance start bersamaan).
- Build image lewat multi-stage Dockerfile (`golang:1.26.6` untuk build, `gcr.io/distroless/static` atau `alpine` untuk runtime).
- Gunakan graceful shutdown (`http.Server.Shutdown` merespons `SIGTERM`) agar request yang sedang berjalan tidak terputus saat rolling deploy.
