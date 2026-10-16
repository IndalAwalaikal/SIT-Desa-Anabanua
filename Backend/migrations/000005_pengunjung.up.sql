-- 000005: Statistik pengunjung situs publik (per hari).
-- pengunjung = pengunjung unik per hari (dideduplikasi berdasarkan hash alamat IP)
-- kunjungan  = total tampilan halaman per hari

CREATE TABLE IF NOT EXISTS pengunjung_harian (
  tanggal    DATE NOT NULL,
  pengunjung INT NOT NULL DEFAULT 0,
  kunjungan  INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menyimpan hash IP unik per hari sebagai dasar dedupe pengunjung unik.
-- Baris lama diarsipkan (dihapus) secara berkala agar tabel tidak membesar.
CREATE TABLE IF NOT EXISTS pengunjung_harian_ip (
  tanggal    DATE NOT NULL,
  ip_hash    CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tanggal, ip_hash),
  KEY idx_phi_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;