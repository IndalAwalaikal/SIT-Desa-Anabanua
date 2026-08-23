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
