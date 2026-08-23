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
  user_id CHAR(26) NULL,
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