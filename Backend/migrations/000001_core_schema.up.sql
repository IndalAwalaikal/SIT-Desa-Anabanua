-- consolidated from 000001_initial.up.sql
CREATE TABLE users (id CHAR(26) PRIMARY KEY, nama VARCHAR(150) NOT NULL, email VARCHAR(191) NOT NULL, password_hash VARCHAR(255) NOT NULL, nik VARCHAR(16) NULL, telepon VARCHAR(30) NULL, alamat TEXT NULL, role ENUM('warga','admin','super_admin') NOT NULL DEFAULT 'warga', avatar_url VARCHAR(255) NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uk_users_email(email), UNIQUE KEY uk_users_nik(nik));
CREATE TABLE refresh_tokens (id CHAR(26) PRIMARY KEY, user_id CHAR(26) NOT NULL, token_hash VARCHAR(255) NOT NULL UNIQUE, expires_at DATETIME NOT NULL, revoked_at DATETIME NULL, replaced_by CHAR(26) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, KEY idx_rt_user(user_id));
CREATE TABLE jenis_surat (kode VARCHAR(10) PRIMARY KEY, nama VARCHAR(150) NOT NULL, deskripsi TEXT NULL, persyaratan JSON NOT NULL, form_fields JSON NOT NULL, estimasi_hari INT NOT NULL DEFAULT 3, ikon VARCHAR(50) NOT NULL DEFAULT 'FileText', is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE pengajuan_surat (id CHAR(26) PRIMARY KEY, nomor_resi VARCHAR(30) NOT NULL UNIQUE, jenis_surat_kode VARCHAR(10) NOT NULL, pemohon_id CHAR(26) NOT NULL, data_isian JSON NOT NULL, status ENUM('diajukan','diverifikasi','diproses','selesai','ditolak') NOT NULL DEFAULT 'diajukan', catatan_admin TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY(jenis_surat_kode) REFERENCES jenis_surat(kode), FOREIGN KEY(pemohon_id) REFERENCES users(id), KEY idx_ps_owner(pemohon_id), KEY idx_ps_status(status));
CREATE TABLE pengajuan_lampiran (id CHAR(26) PRIMARY KEY, pengajuan_id CHAR(26) NOT NULL, nama_file VARCHAR(255) NOT NULL, url VARCHAR(255) NOT NULL, ukuran_bytes INT NOT NULL, mime_type VARCHAR(100) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(pengajuan_id) REFERENCES pengajuan_surat(id) ON DELETE CASCADE);
CREATE TABLE pengajuan_riwayat_status (id CHAR(26) PRIMARY KEY, pengajuan_id CHAR(26) NOT NULL, status ENUM('diajukan','diverifikasi','diproses','selesai','ditolak') NOT NULL, catatan TEXT NULL, changed_by CHAR(26) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(pengajuan_id) REFERENCES pengajuan_surat(id) ON DELETE CASCADE, FOREIGN KEY(changed_by) REFERENCES users(id) ON DELETE SET NULL, KEY idx_prs_pengajuan(pengajuan_id));
CREATE TABLE pengaduan (id CHAR(26) PRIMARY KEY, nomor_tiket VARCHAR(30) NOT NULL UNIQUE, pelapor_id CHAR(26) NOT NULL, kategori ENUM('infrastruktur','layanan','lingkungan','lainnya') NOT NULL, judul VARCHAR(200) NOT NULL, deskripsi TEXT NOT NULL, lokasi VARCHAR(255) NULL, status ENUM('diterima','ditindaklanjuti','selesai') NOT NULL DEFAULT 'diterima', tanggapan_admin TEXT NULL, changed_by CHAR(26) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY(pelapor_id) REFERENCES users(id), FOREIGN KEY(changed_by) REFERENCES users(id) ON DELETE SET NULL, KEY idx_pengaduan_status(status));
CREATE TABLE berita (id CHAR(26) PRIMARY KEY, slug VARCHAR(220) NOT NULL UNIQUE, judul VARCHAR(220) NOT NULL, ringkasan TEXT NOT NULL, konten LONGTEXT NOT NULL, kategori ENUM('pengumuman','kegiatan','pembangunan','lainnya') NOT NULL, gambar_sampul VARCHAR(255) NOT NULL, penulis_id CHAR(26) NULL, tags JSON NOT NULL, status ENUM('draft','terbit') NOT NULL DEFAULT 'terbit', tanggal_terbit DATETIME NULL, dibaca INT NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY(penulis_id) REFERENCES users(id) ON DELETE SET NULL, KEY idx_berita_public(status,tanggal_terbit), KEY idx_berita_kategori(kategori));
CREATE TABLE profil_desa (id TINYINT PRIMARY KEY DEFAULT 1, data JSON NOT NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE statistik_penduduk (tahun SMALLINT PRIMARY KEY, data JSON NOT NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE apbdes_item (id CHAR(26) PRIMARY KEY, tahun SMALLINT NOT NULL, kategori ENUM('pendapatan','belanja') NOT NULL, sub_kategori VARCHAR(150) NOT NULL, jumlah DECIMAL(18,2) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY idx_apbdes_year(tahun));
CREATE TABLE agenda_kegiatan (id CHAR(26) PRIMARY KEY, judul VARCHAR(200) NOT NULL, deskripsi TEXT NOT NULL, tanggal_mulai DATETIME NOT NULL, tanggal_selesai DATETIME NULL, lokasi VARCHAR(255) NOT NULL, penyelenggara VARCHAR(150) NOT NULL, kategori ENUM('musyawarah','gotong-royong','pelatihan','perayaan','lainnya') NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY idx_agenda_date(tanggal_mulai));
CREATE TABLE galeri_album (id CHAR(26) PRIMARY KEY, judul VARCHAR(200) NOT NULL, deskripsi TEXT NOT NULL, tanggal DATE NOT NULL, kategori VARCHAR(100) NULL, cover_foto VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE galeri_item (id CHAR(26) PRIMARY KEY, album_id CHAR(26) NOT NULL, url VARCHAR(255) NOT NULL, caption VARCHAR(255) NOT NULL DEFAULT '', tanggal DATE NOT NULL, FOREIGN KEY(album_id) REFERENCES galeri_album(id) ON DELETE CASCADE);
CREATE TABLE umkm (id CHAR(26) PRIMARY KEY, slug VARCHAR(220) NOT NULL UNIQUE, nama_usaha VARCHAR(200) NOT NULL, pemilik VARCHAR(150) NOT NULL, kategori VARCHAR(100) NOT NULL, deskripsi TEXT NOT NULL, foto JSON NOT NULL, kontak VARCHAR(100) NOT NULL, alamat TEXT NOT NULL, produk_unggulan JSON NOT NULL, jam_operasional VARCHAR(150) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY idx_umkm_category(kategori));
CREATE TABLE perangkat_desa (id CHAR(26) PRIMARY KEY, nama VARCHAR(150) NOT NULL, jabatan VARCHAR(150) NOT NULL, nip VARCHAR(50) NULL, foto VARCHAR(255) NOT NULL, periode VARCHAR(100) NOT NULL);
CREATE TABLE dusun (id CHAR(26) PRIMARY KEY, nama VARCHAR(150) NOT NULL, ketua VARCHAR(150) NOT NULL, jumlah_rt INT NOT NULL, jumlah_rw INT NOT NULL, jumlah_penduduk INT NOT NULL, luas_wilayah VARCHAR(100) NOT NULL);
CREATE TABLE potensi_desa (id CHAR(26) PRIMARY KEY, nama VARCHAR(150) NOT NULL, kategori VARCHAR(100) NOT NULL, deskripsi TEXT NOT NULL, foto VARCHAR(255) NOT NULL);
CREATE TABLE fasilitas_desa (id CHAR(26) PRIMARY KEY, nama VARCHAR(150) NOT NULL, kategori ENUM('pendidikan','kesehatan','ibadah','olahraga','pemerintahan','umum') NOT NULL, alamat TEXT NOT NULL, dusun VARCHAR(150) NOT NULL, deskripsi TEXT NOT NULL, kontak VARCHAR(100) NULL, jam_layanan VARCHAR(150) NULL, KEY idx_fasilitas_kategori(kategori));

-- consolidated from 000002_seed_core.up.sql
-- 000002: add dokumen_hasil column + seed jenis surat
ALTER TABLE pengajuan_surat ADD COLUMN dokumen_hasil JSON NULL AFTER catatan_admin;

-- Accounts are intentionally not seeded. Production accounts must be created
-- by an operator with a unique password supplied through a secure channel.

-- Jenis Surat
INSERT IGNORE INTO jenis_surat (kode,nama,deskripsi,persyaratan,form_fields,estimasi_hari,ikon,is_active) VALUES
('SKD','Surat Keterangan Domisili','Surat yang menerangkan tempat tinggal/domisili seseorang di wilayah Desa Borong.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Pas foto 3x4 (2 lembar)'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaLengkap','label','Nama Lengkap','type','text','required',TRUE,'placeholder','Sesuai KTP'),
  JSON_OBJECT('name','nik','label','NIK','type','text','required',TRUE,'placeholder','16 digit NIK'),
  JSON_OBJECT('name','alamatLengkap','label','Alamat Lengkap','type','textarea','required',TRUE),
  JSON_OBJECT('name','keperluan','label','Keperluan','type','text','required',TRUE,'placeholder','Contoh: Pendaftaran sekolah'),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',TRUE)
 ),2,'Home',TRUE),
('SKU','Surat Keterangan Usaha','Surat keterangan untuk menerangkan bahwa seseorang memiliki usaha di Desa Borong.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Foto lokasi usaha'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaLengkap','label','Nama Lengkap','type','text','required',TRUE),
  JSON_OBJECT('name','nik','label','NIK','type','text','required',TRUE),
  JSON_OBJECT('name','namaUsaha','label','Nama Usaha','type','text','required',TRUE),
  JSON_OBJECT('name','jenisUsaha','label','Jenis Usaha','type','select','required',TRUE,'options',JSON_ARRAY('Perdagangan','Jasa','Pertanian','Kerajinan','Kuliner','Lainnya')),
  JSON_OBJECT('name','alamatUsaha','label','Alamat Usaha','type','textarea','required',TRUE),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',TRUE)
 ),3,'Store',TRUE),
('SKTM','Surat Keterangan Tidak Mampu','Surat keterangan yang menyatakan bahwa seseorang tergolong keluarga kurang mampu.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Surat pernyataan RT/RW'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaLengkap','label','Nama Lengkap','type','text','required',TRUE),
  JSON_OBJECT('name','nik','label','NIK','type','text','required',TRUE),
  JSON_OBJECT('name','pekerjaan','label','Pekerjaan','type','text','required',TRUE),
  JSON_OBJECT('name','penghasilanPerBulan','label','Penghasilan Per Bulan (Rp)','type','number','required',TRUE),
  JSON_OBJECT('name','keperluan','label','Keperluan','type','text','required',TRUE,'placeholder','Contoh: Bantuan biaya pendidikan'),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',TRUE)
 ),3,'Heart',TRUE),
('SPN','Surat Pengantar Nikah','Surat pengantar untuk keperluan pencatatan perkawinan di KUA/Disdukcapil.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Akta kelahiran','Pas foto 3x4 (2 lembar)'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaCalonSuami','label','Nama Calon Suami','type','text','required',TRUE),
  JSON_OBJECT('name','namaCalonIstri','label','Nama Calon Istri','type','text','required',TRUE),
  JSON_OBJECT('name','tanggalRencanaNikah','label','Tanggal Rencana Nikah','type','date','required',TRUE),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',TRUE)
 ),3,'HeartHandshake',TRUE);

-- consolidated from 000003_seed_content.up.sql
-- 000003: seed profil desa, perangkat, dusun, potensi, fasilitas

INSERT IGNORE INTO profil_desa (id,data) VALUES (1, JSON_OBJECT(
 'nama','Desa Borong','kecamatan','Herlang','kabupaten','Bulukumba','provinsi','Sulawesi Selatan','kodePos','92571',
 'sejarah','Desa Borong berada di Kecamatan Herlang, Kabupaten Bulukumba, Provinsi Sulawesi Selatan. Kehidupan masyarakat tumbuh dari semangat gotong royong, pengelolaan sumber daya pesisir dan pertanian, serta kedekatan antarkeluarga yang terus dijaga dari generasi ke generasi.',
 'visi','Mewujudkan Desa Borong yang mandiri, sejahtera, dan berdaya saing melalui pelayanan publik yang terbuka, gotong royong, serta pengembangan potensi lokal.',
 'misi',JSON_ARRAY('Meningkatkan kualitas pelayanan publik desa melalui digitalisasi dan transparansi pemerintahan.','Mengembangkan potensi ekonomi lokal berbasis pertanian, perikanan, UMKM, dan kewirausahaan warga.','Melestarikan nilai budaya, kearifan lokal, dan semangat kebersamaan masyarakat.','Meningkatkan kualitas sumber daya manusia melalui pendidikan dan pelatihan keterampilan.'),
 'luasWilayah','12,5 km²','jumlahDusun',4,'jumlahRW',8,'jumlahRT',16,
 'alamatKantor','Jl. Poros Desa Borong, Kecamatan Herlang, Kabupaten Bulukumba','telepon','(0413) 810123','email','desaborong@bulukumbakab.go.id','website','https://desaborong.bulukumbakab.go.id','jamLayanan','Senin - Jumat, 08:00 - 16:00 WITA',
 'koordinat',JSON_OBJECT('lat',-5.548,'lng',120.399),
 'fotoKantor','https://images.unsplash.com/photo-1555521893-f50a5a5e4172?w=800&q=80',
 'fotoBanner',JSON_ARRAY('https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=1600&q=80','https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1600&q=80')
));

INSERT IGNORE INTO perangkat_desa (id,nama,jabatan,nip,foto,periode) VALUES
('pd-001','Drs. Paulus Tandilino','Kepala Desa','196512151990031005','https://ui-avatars.com/api/?name=Paulus+Tandilino&size=200&background=16a34a&color=fff','2023 - 2029'),
('pd-002','Martha Rantebua, S.Sos','Sekretaris Desa','197803222005012004','https://ui-avatars.com/api/?name=Martha+Rantebua&size=200&background=2563eb&color=fff','2023 - 2029'),
('pd-003','Yohanis Pasang','Kaur Tata Usaha & Umum',NULL,'https://ui-avatars.com/api/?name=Yohanis+Pasang&size=200&background=16a34a&color=fff','2023 - 2029'),
('pd-004','Simon Palimbong, SE','Kaur Keuangan',NULL,'https://ui-avatars.com/api/?name=Simon+Palimbong&size=200&background=2563eb&color=fff','2023 - 2029'),
('pd-005','Markus Toding','Kasi Pemerintahan',NULL,'https://ui-avatars.com/api/?name=Markus+Toding&size=200&background=16a34a&color=fff','2023 - 2029'),
('pd-008','Petrus Banne','Kasi Pelayanan',NULL,'https://ui-avatars.com/api/?name=Petrus+Banne&size=200&background=2563eb&color=fff','2023 - 2029');

INSERT IGNORE INTO dusun (id,nama,ketua,jumlah_rt,jumlah_rw,jumlah_penduduk,luas_wilayah) VALUES
('dsn-001','Dusun Borong Utara','Agustinus Allo',4,2,687,'3,2 km²'),
('dsn-002','Dusun Borong Selatan','Daniel Rante',4,2,723,'3,5 km²'),
('dsn-003','Dusun Tondon','Yakobus Mangera',4,2,512,'2,8 km²'),
('dsn-004','Dusun Lembang','Matius Parinding',4,2,498,'3,0 km²');

INSERT IGNORE INTO potensi_desa (id,nama,kategori,deskripsi,foto) VALUES
('pot-001','Kopi Arabika Borong','Pertanian','Kopi arabika yang ditanam di ketinggian optimal dengan cita rasa khas Bulukumba yang dikenal luas.','https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80'),
('pot-002','Tenun Khas Bulukumba','Kerajinan','Kain tenun tradisional dengan motif geometris khas yang menjadi warisan budaya setempat.','https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80'),
('pot-003','Wisata Bahari','Pariwisata','Potensi wisata pesisir dan bahari yang dikelola masyarakat untuk meningkatkan ekonomi lokal.','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80');

INSERT IGNORE INTO fasilitas_desa (id,nama,kategori,alamat,dusun,deskripsi,kontak,jam_layanan) VALUES
('fas-01','Kantor Desa Borong','pemerintahan','Jl. Poros Desa Borong','Borong Utara','Pusat pelayanan administrasi, informasi, dan musyawarah warga.','(0413) 810123','Senin–Jumat, 08.00–16.00 WITA'),
('fas-02','UPT SD Negeri Borong','pendidikan','Jl. Pendidikan No. 1','Borong Utara','Layanan pendidikan dasar untuk anak usia sekolah dasar.',NULL,NULL),
('fas-03','Posyandu Melati','kesehatan','Balai Dusun Borong Selatan','Borong Selatan','Layanan kesehatan ibu, bayi, balita, dan lansia setiap bulan.',NULL,'Minggu kedua tiap bulan, 08.00 WITA'),
('fas-04','Masjid Nurul Huda','ibadah','Jl. Poros Herlang','Borong Selatan','Fasilitas ibadah dan pembinaan keagamaan masyarakat.',NULL,NULL),
('fas-05','Lapangan Desa Borong','olahraga','Kompleks Kantor Desa','Borong Utara','Lapangan olahraga, upacara, dan kegiatan masyarakat desa.',NULL,NULL),
('fas-06','Poskesdes Borong','kesehatan','Jl. Poros Desa Borong','Tondon','Layanan kesehatan dasar dan rujukan warga.',NULL,NULL);

-- consolidated from 000004_seed_finance.up.sql
-- 000004: seed statistik, APBDes, agenda

INSERT IGNORE INTO statistik_penduduk (tahun,data) VALUES (2026, JSON_OBJECT(
 'tahun',2026,'totalPenduduk',2420,'lakiLaki',1215,'perempuan',1205,'jumlahKK',640,
 'perDusun',JSON_ARRAY(
  JSON_OBJECT('dusun','Borong Utara','jumlah',687),
  JSON_OBJECT('dusun','Borong Selatan','jumlah',723),
  JSON_OBJECT('dusun','Tondon','jumlah',512),
  JSON_OBJECT('dusun','Lembang','jumlah',498)),
 'rincianDusun',JSON_ARRAY(
  JSON_OBJECT('dusun','Borong Utara','lakiLaki',345,'perempuan',342,'kepalaKeluarga',180,'kelahiran',12,'kematian',4,'pindahMasuk',8,'pindahKeluar',3),
  JSON_OBJECT('dusun','Borong Selatan','lakiLaki',363,'perempuan',360,'kepalaKeluarga',192,'kelahiran',15,'kematian',6,'pindahMasuk',10,'pindahKeluar',5),
  JSON_OBJECT('dusun','Tondon','lakiLaki',256,'perempuan',256,'kepalaKeluarga',136,'kelahiran',9,'kematian',3,'pindahMasuk',5,'pindahKeluar',2),
  JSON_OBJECT('dusun','Lembang','lakiLaki',251,'perempuan',247,'kepalaKeluarga',132,'kelahiran',7,'kematian',2,'pindahMasuk',4,'pindahKeluar',2)),
 'perKelompokUsia',JSON_ARRAY(
  JSON_OBJECT('rentang','0-4 Tahun','jumlah',185),JSON_OBJECT('rentang','5-14 Tahun','jumlah',390),
  JSON_OBJECT('rentang','15-24 Tahun','jumlah',420),JSON_OBJECT('rentang','25-54 Tahun','jumlah',980),
  JSON_OBJECT('rentang','55-64 Tahun','jumlah',265),JSON_OBJECT('rentang','65+ Tahun','jumlah',180)),
 'perPendidikan',JSON_ARRAY(
  JSON_OBJECT('jenjang','Belum/Tidak Sekolah','jumlah',210),JSON_OBJECT('jenjang','SD / Sederajat','jumlah',620),
  JSON_OBJECT('jenjang','SMP / Sederajat','jumlah',540),JSON_OBJECT('jenjang','SMA / SMK','jumlah',780),
  JSON_OBJECT('jenjang','Diploma (D1-D3)','jumlah',95),JSON_OBJECT('jenjang','Sarjana (S1-S3)','jumlah',175)),
 'perPekerjaan',JSON_ARRAY(
  JSON_OBJECT('pekerjaan','Petani / Pekebun','jumlah',1120),JSON_OBJECT('pekerjaan','Pengrajin','jumlah',180),
  JSON_OBJECT('pekerjaan','Pedagang / UMKM','jumlah',240),JSON_OBJECT('pekerjaan','PNS / TNI / Polri','jumlah',65),
  JSON_OBJECT('pekerjaan','Karyawan Swasta','jumlah',190),JSON_OBJECT('pekerjaan','Pelajar / Mahasiswa','jumlah',480),
  JSON_OBJECT('pekerjaan','Lainnya','jumlah',145)),
 'perAgama',JSON_ARRAY(
  JSON_OBJECT('agama','Islam','jumlah',2350),
  JSON_OBJECT('agama','Kristen Protestan','jumlah',50),
  JSON_OBJECT('agama','Katolik','jumlah',15),
  JSON_OBJECT('agama','Hindu','jumlah',5))
));

INSERT IGNORE INTO apbdes_item (id,tahun,kategori,sub_kategori,jumlah) VALUES
('apb-01',2026,'pendapatan','Dana Desa (APBN)',1150000000),
('apb-02',2026,'pendapatan','Alokasi Dana Desa (ADD)',720000000),
('apb-03',2026,'pendapatan','Bagi Hasil Pajak & Retribusi',180000000),
('apb-04',2026,'pendapatan','Pendapatan Asli Desa (PADes)',100000000),
('apb-05',2026,'belanja','Penyelenggaraan Pemerintahan Desa',650000000),
('apb-06',2026,'belanja','Pelaksanaan Pembangunan Desa',920000000),
('apb-07',2026,'belanja','Pembinaan Kemasyarakatan Desa',245000000),
('apb-08',2026,'belanja','Pemberdayaan Masyarakat Desa',230000000),
('apb-09',2026,'belanja','Penanggulangan Bencana & Darurat',80000000);

INSERT IGNORE INTO agenda_kegiatan (id,judul,deskripsi,tanggal_mulai,tanggal_selesai,lokasi,penyelenggara,kategori)
VALUES
('agd-001','Lomba HUT RI ke-81 Desa Borong','Rangkaian pesta rakyat dan perlombaan memperingati HUT Kemerdekaan RI ke-81.',
 '2026-08-15 08:00:00','2026-08-17 18:00:00','Lapangan Utama Desa Borong','Panitia HUT RI Desa Borong','perayaan'),
('agd-002','Musyawarah Perencanaan Pembangunan Desa','Musyawarah tahunan penetapan prioritas pembangunan RKPDesa tahun 2027.',
 '2026-08-25 09:00:00',NULL,'Aula Kantor Desa Borong','BPD & Pemerintah Desa Borong','musyawarah');

-- consolidated from 000005_seed_catalog.up.sql
-- 000005: seed galeri & UMKM
INSERT IGNORE INTO galeri_album (id,judul,deskripsi,tanggal,kategori,cover_foto) VALUES
('alb-001','Panen Kopi Bersama Petani Dusun Tondon','Suasana kegembiraan musim panen raya kopi arabika bersama kelompok tani.',
 '2026-06-15','pertanian','https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80');
INSERT IGNORE INTO galeri_item (id,album_id,url,caption,tanggal) VALUES
('alb-001f1','alb-001','https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80','Buah Kopi Arabika Siap Petik','2026-06-15'),
('alb-001f2','alb-001','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80','Proses Sortir dan Sangrai Kopi','2026-06-16');

INSERT IGNORE INTO umkm (id,slug,nama_usaha,pemilik,kategori,deskripsi,foto,kontak,alamat,produk_unggulan,jam_operasional) VALUES
('umkm-001','hasil-tani-borong','Hasil Tani Borong','Andi Rahman','Pertanian',
 'Produk pertanian pilihan warga Desa Borong yang dipanen dan diolah dengan perhatian pada kualitas.',
 JSON_ARRAY('https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80'),'0812-4567-8901',
 'Desa Borong, Kecamatan Herlang, Kabupaten Bulukumba',
 JSON_ARRAY('Beras Lokal','Sayuran Segar','Olahan Hasil Tani'),'08.00 - 18.00 WITA'),
('umkm-002','dapur-rasa-borong','Dapur Rasa Borong','Hj. Fatmawati','Kuliner & Resto',
 'Kuliner rumahan khas Sulawesi Selatan dengan menu harian yang segar dan ramah untuk keluarga.',
 JSON_ARRAY('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'),'0813-7788-9900',
 'Jl. Poros Borong No. 15, Desa Borong',
 JSON_ARRAY('Ikan Bakar','Nasi Kuning','Kue Tradisional'),'10.00 - 21.00 WITA');
