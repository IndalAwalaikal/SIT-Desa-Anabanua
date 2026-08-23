-- Migration 000009: pending registrations.
--
-- Registrasi warga TIDAK lagi langsung membuat baris di `users`. Data sementara
-- ditahan di `pending_registrations` (ber-email unik) sampai OTP verifikasi email
-- berhasil. Dengan begitu:
--   * email/NIK yang salah-verifikasi bisa didaftarkan ulang tanpa konflik.
--   * tidak ada akun non-aktif / tak-terverifikasi yang "mencuri" email unik.
-- Baris dipindahkan ke `users` hanya pada VerifyOTP yang sukses.

CREATE TABLE IF NOT EXISTS pending_registrations (
  email          VARCHAR(191) NOT NULL PRIMARY KEY,
  nama           VARCHAR(150) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  nik            VARCHAR(16)  NULL,
  telepon        VARCHAR(30)  NULL,
  alamat         TEXT         NULL,
  otp_code       VARCHAR(10)  NOT NULL,
  otp_expires_at DATETIME     NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
