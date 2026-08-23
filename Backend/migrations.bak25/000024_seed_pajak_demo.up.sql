-- 000024: Seed data demo modul Pajak (wajib pajak, transaksi, setoran, audit)
-- Alur status: tercatat -> diverifikasi -> disetor -> dikonfirmasi_bpd
-- Referensi jenis pajak dari 000015: jpk-001=PBB, jpk-002=RETRI_SAMPAH, jpk-003=RETRI_PASAR

-- ── Wajib Pajak ───────────────────────────────────────────────────────────────
INSERT IGNORE INTO wajib_pajak (id, no_objek, nama, nik, alamat, rt, rw, dusun) VALUES
('wp-001','73.02.09.01.001','Andi Bakri','7302091211800001','Jl. Poros Desa, Dusun Borong Utara','001','002','Borong Utara'),
('wp-002','73.02.09.01.002','Sitti Rahma','7302094403850002','Jl. Poros Desa, Dusun Borong Utara','001','002','Borong Utara'),
('wp-003','73.02.09.01.003','Hasan Basri','7302092206790003','Jl. Poros Desa, Dusun Borong Utara','002','002','Borong Utara'),
('wp-004','73.02.09.02.001','Nur Aisyah','7302095105900004','Jl. Pendidikan, Dusun Borong Selatan','003','004','Borong Selatan'),
('wp-005','73.02.09.02.002','Jumiati','7302094504830005','Pasar Rakyat, Dusun Borong Selatan','003','004','Borong Selatan'),
('wp-006','73.02.09.02.003','Syamsuddin','7302091007820006','Jl. Pendidikan, Dusun Borong Selatan','004','004','Borong Selatan'),
('wp-007','73.02.09.03.001','Karta Mappangara','7302091902780007','Jl. Wisata, Dusun Tondon','001','001','Tondon'),
('wp-008','73.02.09.03.002','Darmawati','7302094208920008','Jl. Wisata, Dusun Tondon','001','001','Tondon'),
('wp-009','73.02.09.03.003','Muhammad Yusuf','7302090111760009','Jl. Wisata, Dusun Tondon','002','001','Tondon'),
('wp-010','73.02.09.04.001','Rosmawati','7302094804880010','Jl. Sepakat, Dusun Lembang','001','002','Lembang'),
('wp-011','73.02.09.04.002','Abd. Karim','7302091506740011','Jl. Sepakat, Dusun Lembang','001','002','Lembang'),
('wp-012','73.02.09.04.003','Baharuddin','7302090903840012','Pasar Rakyat, Dusun Lembang','002','002','Lembang'),
('wp-013','73.02.09.01.004','Murniati','7302095007950013','Jl. Poros Desa, Dusun Borong Utara','002','002','Borong Utara'),
('wp-014','73.02.09.03.004','Syahrul','7302091511900014','Jl. Wisata, Dusun Tondon','002','001','Tondon');

-- ── Setoran Pajak (harus di-insert sebelum transaksi karena FK setoran_id) ────
INSERT IGNORE INTO setoran_pajak
(id, nomor_setoran, tujuan, tanggal_setor, total_setor, status, disetor_oleh, diterima_oleh, nomor_bukti_penerimaan, tgl_konfirmasi, catatan, dibuat_oleh)
VALUES
('stn-2025-001','ST-2025-00001','Setoran PBB ke BPD Desa Borong','2025-04-10',2875000,'dikonfirmasi','Yohanes Pasang','BPD Desa Borong','BUKTI-2025-0001','2025-04-12 09:00:00','Setoran TA 2025 periode Januari - Maret.',NULL),
('stn-2026-001','ST-2026-00001','Setoran Pajak & Retribusi ke BPD','2026-02-28',1455000,'disetor','Yohanes Pasang',NULL,NULL,NULL,'Setoran tahap I TA 2026.',NULL),
('stn-2026-002','ST-2026-00002','Setoran Pajak & Retribusi ke BPD','2026-04-30',1695000,'disetor','Yohanes Pasang',NULL,NULL,NULL,'Setoran tahap II TA 2026.',NULL),
('stn-2026-003','ST-2026-00003','Setoran PBB ke BPD Desa Borong','2026-05-12',615000,'dikonfirmasi','Yohanes Pasang','BPD Desa Borong','BUKTI-2026-0007','2026-05-15 10:00:00','Setoran PBB tahap I, telah diterima BPD.',NULL);

-- ── Transaksi Pajak TA 2026 (tahun berjalan): 12 PBB + 6 Retribusi Sampah + 4 Retribusi Pasar ──
INSERT IGNORE INTO transaksi_pajak
(id, nomor_bukti, jenis_pajak_id, wajib_pajak_id, tahun, periode, nominal, tanggal_bayar, status, catatan, pencatat_id, verifikator_id, tgl_verifikasi, setoran_id)
VALUES
('trx-2026-001','PK-2026-00001','jpk-001','wp-001',2026,'TAHUNAN',425000,'2026-01-12','disetor','PBB TA 2026 lunas.',NULL,NULL,'2026-01-14 09:00:00','stn-2026-001'),
('trx-2026-002','PK-2026-00002','jpk-001','wp-002',2026,'TAHUNAN',380000,'2026-01-15','disetor','PBB TA 2026 lunas.',NULL,NULL,'2026-01-16 09:00:00','stn-2026-001'),
('trx-2026-003','PK-2026-00003','jpk-001','wp-003',2026,'TAHUNAN',610000,'2026-01-18','disetor','PBB TA 2026 lunas.',NULL,NULL,'2026-01-20 09:00:00','stn-2026-001'),
('trx-2026-004','PK-2026-00004','jpk-001','wp-004',2026,'TAHUNAN',275000,'2026-02-02','dikonfirmasi_bpd','PBB TA 2026 lunas.',NULL,NULL,'2026-02-04 09:00:00','stn-2026-003'),
('trx-2026-005','PK-2026-00005','jpk-001','wp-005',2026,'TAHUNAN',340000,'2026-02-05','dikonfirmasi_bpd','PBB TA 2026 lunas.',NULL,NULL,'2026-02-06 09:00:00','stn-2026-003'),
('trx-2026-006','PK-2026-00006','jpk-001','wp-006',2026,'TAHUNAN',720000,'2026-03-03','disetor','PBB TA 2026 lunas.',NULL,NULL,'2026-03-05 09:00:00','stn-2026-002'),
('trx-2026-007','PK-2026-00007','jpk-001','wp-007',2026,'TAHUNAN',465000,'2026-03-10','diverifikasi','Menunggu setoran tahap III.',NULL,NULL,'2026-03-12 09:00:00',NULL),
('trx-2026-008','PK-2026-00008','jpk-001','wp-008',2026,'TAHUNAN',295000,'2026-03-14','diverifikasi','Menunggu setoran tahap III.',NULL,NULL,'2026-03-16 09:00:00',NULL),
('trx-2026-009','PK-2026-00009','jpk-001','wp-009',2026,'TAHUNAN',540000,'2026-04-02','tercatat','Belum diverifikasi.',NULL,NULL,NULL,NULL),
('trx-2026-010','PK-2026-00010','jpk-001','wp-010',2026,'TAHUNAN',385000,'2026-04-08','tercatat','Belum diverifikasi.',NULL,NULL,NULL,NULL),
('trx-2026-011','PK-2026-00011','jpk-001','wp-011',2026,'TAHUNAN',490000,'2026-04-12','tercatat','Belum diverifikasi.',NULL,NULL,NULL,NULL),
('trx-2026-012','PK-2026-00012','jpk-001','wp-012',2026,'TAHUNAN',260000,'2026-04-15','tercatat','Belum diverifikasi.',NULL,NULL,NULL,NULL),
('trx-2026-013','PK-2026-00013','jpk-002','wp-001',2026,'BULANAN',20000,'2026-01-15','disetor','Retribusi sampah Januari.',NULL,NULL,'2026-01-17 09:00:00','stn-2026-001'),
('trx-2026-014','PK-2026-00014','jpk-002','wp-003',2026,'BULANAN',20000,'2026-02-15','disetor','Retribusi sampah Februari.',NULL,NULL,'2026-02-17 09:00:00','stn-2026-001'),
('trx-2026-015','PK-2026-00015','jpk-002','wp-008',2026,'BULANAN',15000,'2026-02-20','disetor','Retribusi sampah Februari.',NULL,NULL,'2026-02-22 09:00:00','stn-2026-002'),
('trx-2026-016','PK-2026-00016','jpk-002','wp-010',2026,'BULANAN',15000,'2026-03-10','disetor','Retribusi sampah Maret.',NULL,NULL,'2026-03-12 09:00:00','stn-2026-002'),
('trx-2026-017','PK-2026-00017','jpk-002','wp-013',2026,'BULANAN',20000,'2026-03-15','disetor','Retribusi sampah Maret.',NULL,NULL,'2026-03-17 09:00:00','stn-2026-002'),
('trx-2026-018','PK-2026-00018','jpk-002','wp-014',2026,'BULANAN',25000,'2026-04-12','disetor','Retribusi sampah April.',NULL,NULL,'2026-04-14 09:00:00','stn-2026-002'),
('trx-2026-019','PK-2026-00019','jpk-003','wp-005',2026,'BULANAN',200000,'2026-01-05','disetor','Retribusi pasar blok A Januari.',NULL,NULL,'2026-01-07 09:00:00','stn-2026-002'),
('trx-2026-020','PK-2026-00020','jpk-003','wp-005',2026,'BULANAN',200000,'2026-02-05','disetor','Retribusi pasar blok A Februari.',NULL,NULL,'2026-02-07 09:00:00','stn-2026-002'),
('trx-2026-021','PK-2026-00021','jpk-003','wp-012',2026,'BULANAN',250000,'2026-01-07','disetor','Retribusi pasar blok C Januari.',NULL,NULL,'2026-01-09 09:00:00','stn-2026-002'),
('trx-2026-022','PK-2026-00022','jpk-003','wp-012',2026,'BULANAN',250000,'2026-02-07','disetor','Retribusi pasar blok C Februari.',NULL,NULL,'2026-02-09 09:00:00','stn-2026-002');

-- ── Transaksi histori TA 2025 (sudah dikonfirmasi BPD) ────────────────────────
INSERT IGNORE INTO transaksi_pajak
(id, nomor_bukti, jenis_pajak_id, wajib_pajak_id, tahun, periode, nominal, tanggal_bayar, status, catatan, pencatat_id, verifikator_id, tgl_verifikasi, setoran_id)
VALUES
('trx-2025-001','PK-2025-00001','jpk-001','wp-001',2025,'TAHUNAN',400000,'2025-02-10','dikonfirmasi_bpd','PBB TA 2025 lunas.',NULL,NULL,'2025-02-12 09:00:00','stn-2025-001'),
('trx-2025-002','PK-2025-00002','jpk-001','wp-002',2025,'TAHUNAN',360000,'2025-02-12','dikonfirmasi_bpd','PBB TA 2025 lunas.',NULL,NULL,'2025-02-14 09:00:00','stn-2025-001'),
('trx-2025-003','PK-2025-00003','jpk-001','wp-003',2025,'TAHUNAN',590000,'2025-02-15','dikonfirmasi_bpd','PBB TA 2025 lunas.',NULL,NULL,'2025-02-17 09:00:00','stn-2025-001'),
('trx-2025-004','PK-2025-00004','jpk-001','wp-006',2025,'TAHUNAN',700000,'2025-02-18','dikonfirmasi_bpd','PBB TA 2025 lunas.',NULL,NULL,'2025-02-20 09:00:00','stn-2025-001'),
('trx-2025-005','PK-2025-00005','jpk-001','wp-007',2025,'TAHUNAN',450000,'2025-02-20','dikonfirmasi_bpd','PBB TA 2025 lunas.',NULL,NULL,'2025-02-22 09:00:00','stn-2025-001'),
('trx-2025-006','PK-2025-00006','jpk-001','wp-010',2025,'TAHUNAN',375000,'2025-02-25','dikonfirmasi_bpd','PBB TA 2025 lunas.',NULL,NULL,'2025-02-27 09:00:00','stn-2025-001');

-- ── Audit trail (representatif: setoran + beberapa transaksi penting) ─────────
INSERT IGNORE INTO audit_log_pajak (id, ref_tipe, ref_id, perubahan, status_lama, status_baru, catatan)
VALUES
('aud-001','SETORAN','stn-2025-001','KONFIRMASI','disetor','dikonfirmasi','Setoran PBB 2025 dikonfirmasi BPD.'),
('aud-002','SETORAN','stn-2026-001','SETOR','','disetor','Transaksi PBB + Sampah tahap I disetor ke BPD.'),
('aud-003','SETORAN','stn-2026-002','SETOR','','disetor','Transaksi Retribusi + Pasar tahap II disetor ke BPD.'),
('aud-004','SETORAN','stn-2026-003','KONFIRMASI','disetor','dikonfirmasi','Setoran PBB tahap I diterima BPD.'),
('aud-005','TRANSAKSI','trx-2026-004','VERIFIKASI','tercatat','diverifikasi','Verifikasi kebenaran pembayaran PBB.'),
('aud-006','TRANSAKSI','trx-2026-004','SETOR','diverifikasi','disetor','Masuk batch setoran tahap I.'),
('aud-007','TRANSAKSI','trx-2026-004','KONFIRMASI','disetor','dikonfirmasi_bpd','BPD menerima dan mengonfirmasi.'),
('aud-008','TRANSAKSI','trx-2026-001','VERIFIKASI','tercatat','diverifikasi','Verifikasi pembayaran PBB WP-001.'),
('aud-009','TRANSAKSI','trx-2026-001','SETOR','diverifikasi','disetor','Masuk batch setoran tahap I.'),
('aud-010','TRANSAKSI','trx-2026-006','VERIFIKASI','tercatat','diverifikasi','Verifikasi pembayaran PBB WP-006.'),
('aud-011','TRANSAKSI','trx-2026-006','SETOR','diverifikasi','disetor','Masuk batch setoran tahap II.');
