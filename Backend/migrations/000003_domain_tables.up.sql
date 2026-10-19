-- consolidated from 000014_user_demographics.up.sql
-- Migration 000014: Expand user profile with demographic fields for smart persuratan auto-fill.
ALTER TABLE users ADD COLUMN no_kk             VARCHAR(20)  NULL AFTER nik;
ALTER TABLE users ADD COLUMN tempat_lahir      VARCHAR(100) NULL AFTER no_kk;
ALTER TABLE users ADD COLUMN tanggal_lahir     DATE         NULL AFTER tempat_lahir;
ALTER TABLE users ADD COLUMN jenis_kelamin     ENUM('L','P') NULL AFTER tanggal_lahir;
ALTER TABLE users ADD COLUMN agama             VARCHAR(50)  NULL AFTER jenis_kelamin;
ALTER TABLE users ADD COLUMN status_perkawinan VARCHAR(50)  NULL AFTER agama;
ALTER TABLE users ADD COLUMN pekerjaan        VARCHAR(100) NULL AFTER status_perkawinan;
ALTER TABLE users ADD COLUMN rt                VARCHAR(5)   NULL AFTER pekerjaan;
ALTER TABLE users ADD COLUMN rw                VARCHAR(5)   NULL AFTER rt;
ALTER TABLE users ADD COLUMN dusun             VARCHAR(100) NULL AFTER rw;

-- consolidated from 000015_pajak.up.sql
-- 000015: Transparansi Pajak Desa
-- Alur: warga bayar ke desa -> desa catat (tercatat) -> verifikasi -> setoran ke BPD (disetor) -> konfirmasi (dikonfirmasi_bpd)

CREATE TABLE master_jenis_pajak (
  id CHAR(26) PRIMARY KEY,
  kode VARCHAR(40) NOT NULL UNIQUE,
  nama VARCHAR(150) NOT NULL,
  kategori VARCHAR(50) NOT NULL DEFAULT 'lainnya',
  satuan VARCHAR(80) NULL,
  periode VARCHAR(20) NOT NULL DEFAULT 'TAHUNAN',
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wajib_pajak (
  id CHAR(26) PRIMARY KEY,
  user_id CHAR(26) COLLATE utf8mb4_0900_ai_ci NULL,
  no_objek VARCHAR(100) NOT NULL DEFAULT '',
  nama VARCHAR(150) NOT NULL,
  nik VARCHAR(30) NULL,
  alamat VARCHAR(255) NOT NULL DEFAULT '',
  rt VARCHAR(10) NOT NULL DEFAULT '',
  rw VARCHAR(10) NOT NULL DEFAULT '',
  dusun VARCHAR(100) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_wp_user (user_id),
  KEY idx_wp_dusun (dusun),
  CONSTRAINT fk_wp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE setoran_pajak (
  id CHAR(26) PRIMARY KEY,
  nomor_setoran VARCHAR(40) NOT NULL UNIQUE,
  tujuan VARCHAR(255) NOT NULL,
  tanggal_setor DATE NOT NULL,
  total_setor DECIMAL(15,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'disetor',
  disetor_oleh VARCHAR(150) NOT NULL DEFAULT '',
  diterima_oleh VARCHAR(150) NULL,
  nomor_bukti_penerimaan VARCHAR(100) NULL,
  tgl_konfirmasi DATETIME NULL,
  url_bukti VARCHAR(255) NULL,
  catatan TEXT NULL,
  dibuat_oleh CHAR(26) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_setoran_status (status),
  KEY idx_setoran_tanggal (tanggal_setor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transaksi_pajak (
  id CHAR(26) PRIMARY KEY,
  nomor_bukti VARCHAR(40) NOT NULL UNIQUE,
  jenis_pajak_id CHAR(26) NOT NULL,
  wajib_pajak_id CHAR(26) NOT NULL,
  tahun INT NOT NULL,
  periode VARCHAR(20) NOT NULL DEFAULT '',
  nominal DECIMAL(15,2) NOT NULL,
  tanggal_bayar DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'tercatat',
  catatan TEXT NULL,
  catatan_pembatalan TEXT NULL,
  pencatat_id CHAR(26) NULL,
  verifikator_id CHAR(26) NULL,
  tgl_verifikasi DATETIME NULL,
  setoran_id CHAR(26) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tp_status_tahun (status, tahun),
  KEY idx_tp_jenis (jenis_pajak_id, tahun),
  KEY idx_tp_wp (wajib_pajak_id),
  KEY idx_tp_setoran (setoran_id),
  CONSTRAINT fk_tp_jenis FOREIGN KEY (jenis_pajak_id) REFERENCES master_jenis_pajak(id),
  CONSTRAINT fk_tp_wp FOREIGN KEY (wajib_pajak_id) REFERENCES wajib_pajak(id),
  CONSTRAINT fk_tp_setoran FOREIGN KEY (setoran_id) REFERENCES setoran_pajak(id) ON DELETE SET NULL,
  CONSTRAINT chk_tp_nominal CHECK (nominal > 0),
  CONSTRAINT chk_tp_tahun CHECK (tahun BETWEEN 2000 AND 2100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_log_pajak (
  id CHAR(26) PRIMARY KEY,
  ref_tipe VARCHAR(20) NOT NULL,
  ref_id CHAR(26) NOT NULL,
  perubahan VARCHAR(40) NOT NULL,
  status_lama VARCHAR(30) NOT NULL DEFAULT '',
  status_baru VARCHAR(30) NOT NULL DEFAULT '',
  catatan TEXT NULL,
  user_id CHAR(26) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_ref (ref_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed jenis pajak (contoh; dapat dikelola admin)
INSERT INTO master_jenis_pajak (id,kode,nama,kategori,satuan,periode,aktif) VALUES
('jpk-001','PBB','Pajak Bumi dan Bangunan','pajak_daerah','SPPT (Tahunan)','TAHUNAN',1),
('jpk-002','RETRI_SAMPAH','Retribusi Pelayanan Persampahan','retribusi','Tarif per Rumah','BULANAN',1),
('jpk-003','RETRI_PASAR','Retribusi Pelayanan Pasar','retribusi','Tarif per Blok','BULANAN',1),
('jpk-004','LAIN','Retribusi / Pajak Lainnya','lainnya',NULL,'TAHUNAN',1);

-- consolidated from 000016_notifications.up.sql
CREATE TABLE IF NOT EXISTS notifikasi (
  id CHAR(26) PRIMARY KEY,
  user_id CHAR(26) NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
  link VARCHAR(500) NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_notifikasi_user(user_id, is_read, created_at)
);

-- consolidated from 000017_fulltext_search.up.sql
-- FULLTEXT indexes on InnoDB teks/varchar kolom.
-- NB: kolom produk_unggulan pada umkm adalah tipe JSON, yang TIDAK didukung
-- oleh FULLTEXT index; ia otomatis dikelompokkan lewat generated column jika
-- dibutuhkan. hanya kolom text/varchar yang diindeks di sini agar berjalan
-- pada MySQL 8.4 (error 1072/3152 terjadi bila memaksa kolom nama/JSON).

ALTER TABLE berita ADD FULLTEXT INDEX idx_berita_ft(judul, ringkasan, konten);
ALTER TABLE umkm ADD FULLTEXT INDEX idx_umkm_ft(nama_usaha, deskripsi);
ALTER TABLE pengaduan ADD FULLTEXT INDEX idx_pengaduan_ft(judul, deskripsi);

-- consolidated from 000018_add_last_used_at_to_refresh_tokens.up.sql
ALTER TABLE refresh_tokens ADD COLUMN last_used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- consolidated from 000019_statistik_tren_bulanan.up.sql
-- 000019: tabel tren bulanan kependudukan (kelahiran/kematian/pindah) untuk chart garis.
CREATE TABLE IF NOT EXISTS statistik_bulanan (
    tahun         SMALLINT NOT NULL,
    bulan         TINYINT  NOT NULL COMMENT '1-12',
    lahir         INT NOT NULL DEFAULT 0,
    meninggal     INT NOT NULL DEFAULT 0,
    pindah_masuk  INT NOT NULL DEFAULT 0,
    pindah_keluar INT NOT NULL DEFAULT 0,
    PRIMARY KEY (tahun, bulan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data realistis (mock) untuk 2025 & 2026 agar chart langsung terisi.
INSERT IGNORE INTO statistik_bulanan (tahun, bulan, lahir, meninggal, pindah_masuk, pindah_keluar) VALUES
(2026, 1, 14, 6,  9, 7),
(2026, 2, 16, 5,  8, 6),
(2026, 3, 12, 7, 10, 5),
(2026, 4, 18, 4, 11, 6),
(2026, 5, 15, 6,  9, 8),
(2026, 6, 17, 5, 12, 4),
(2026, 7, 13, 6, 10, 7),
(2026, 8, 15, 4,  8, 5),
(2026, 9, 11, 7,  9, 6),
(2026, 10, 14, 5, 11, 4),
(2026, 11, 16, 4, 10, 6),
(2026, 12, 15, 5,  9, 5),
(2025, 1, 13, 6,  8, 7),
(2025, 2, 15, 5,  9, 5),
(2025, 3, 11, 6, 10, 6),
(2025, 4, 17, 5, 11, 5),
(2025, 5, 14, 6,  9, 8),
(2025, 6, 16, 5, 12, 5),
(2025, 7, 12, 6, 10, 7),
(2025, 8, 15, 4,  9, 6),
(2025, 9, 10, 7,  9, 6),
(2025, 10, 14, 5, 10, 4),
(2025, 11, 16, 5, 11, 6),
(2025, 12, 14, 4,  9, 5);

-- consolidated from 000020_sekilas_info.up.sql
CREATE TABLE sekilas_info (
    id VARCHAR(50) PRIMARY KEY,
    konten TEXT NOT NULL,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
