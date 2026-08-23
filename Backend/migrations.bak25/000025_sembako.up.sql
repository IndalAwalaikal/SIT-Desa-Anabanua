-- 000025: pembagian sembako — periode distribusi + rincian barang per periode.
-- Status tidak disimpan di DB; diturunkan dari tanggal saat dibaca agar tidak pernah basi.

CREATE TABLE sembako_period (
    id VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    periode VARCHAR(100) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NULL,
    target_penerima INT NULL COMMENT 'estimasi jumlah KK penerima',
    lokasi VARCHAR(255) NULL,
    keterangan TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sembako_period_mulai (tanggal_mulai DESC)
);

CREATE TABLE sembako_item (
    id VARCHAR(50) PRIMARY KEY,
    period_id VARCHAR(50) NOT NULL,
    nama_barang VARCHAR(150) NOT NULL,
    satuan VARCHAR(30) NOT NULL DEFAULT 'kg',
    jumlah_per_kk DECIMAL(10,2) NOT NULL DEFAULT 0,
    keterangan VARCHAR(255) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_sembako_item_period FOREIGN KEY (period_id)
        REFERENCES sembako_period(id) ON DELETE CASCADE,
    INDEX idx_sembako_item_period (period_id, sort_order)
);

-- Seed demo: satu periode berjalan + satu periode lampau.
INSERT INTO sembako_period (id,nama,periode,tanggal_mulai,tanggal_selesai,target_penerima,lokasi,keterangan) VALUES
('sbp-001','Pembagian Sembako Semester I 2026','Semester I 2026','2026-08-10','2026-08-25',812,'Balai Desa Borong','Bansos sembaka BLT-DD untuk 812 KK penerima manfaat.'),
('sbp-002','Pembagian Sembako Semester II 2025','Semester II 2025','2025-11-03','2025-11-14',798,'Balai Desa Borong','Distribusi rutin Bansos sembaka melalui Bulog.');

INSERT INTO sembako_item (id,period_id,nama_barang,satuan,jumlah_per_kk,keterangan,sort_order) VALUES
('sbi-001-01','sbp-001','Beras Premium','kg',10.00,'Bulog kualitas premium',1),
('sbi-001-02','sbp-001','Minyak Goreng Kemasan','liter',2.00,'Kemasan 1 liter',2),
('sbi-001-03','sbp-001','Gula Pasir','kg',1.00,NULL,3),
('sbi-001-04','sbp-001','Telur Ayam','kg',1.00,'Segar, kuota per KK',4),
('sbi-002-01','sbp-002','Beras Medium','kg',10.00,'Bulog kualitas medium',1),
('sbi-002-02','sbp-002','Minyak Goreng Kemasan','liter',2.00,'Kemasan 1 liter',2),
('sbi-002-03','sbp-002','Gula Pasir','kg',1.00,NULL,3);
