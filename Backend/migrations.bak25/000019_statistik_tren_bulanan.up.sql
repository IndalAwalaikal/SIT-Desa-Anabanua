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
