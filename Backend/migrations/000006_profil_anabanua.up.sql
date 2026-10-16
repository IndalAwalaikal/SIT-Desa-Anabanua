-- Perbarui fakta profil Desa Anabanua berdasarkan informasi desa yang diberikan.
UPDATE profil_desa
SET data = JSON_SET(
  data,
  '$.nama', 'Desa Anabanua',
  '$.kecamatan', 'Barru',
  '$.kabupaten', 'Barru',
  '$.provinsi', 'Sulawesi Selatan',
  '$.kodePos', '90712',
  '$.alamatKantor', 'Dusun Gellengnge, Jl. Poros Pekkae–Soppeng, Desa Anabanua',
  '$.kodeWilayah', '73.11.03.2008',
  '$.fotoKantor', '/kantor_desa.png',
  '$.misi', JSON_ARRAY(
    'Meningkatkan kualitas pelayanan publik desa melalui digitalisasi dan transparansi pemerintahan.',
    'Mengembangkan potensi ekonomi lokal berbasis pertanian, perkebunan, UMKM, dan kewirausahaan warga.',
    'Melestarikan nilai budaya, kearifan lokal, dan semangat kebersamaan masyarakat.',
    'Meningkatkan kualitas sumber daya manusia melalui pendidikan dan pelatihan keterampilan.'
  ),
  '$.riwayatKepalaDesa', JSON_ARRAY(
    JSON_OBJECT('nama','Haruna','periode','1990–1994','keterangan','Kepala Desa Persiapan'),
    JSON_OBJECT('nama','Marhaeni','periode','1994–2002','keterangan','Kepala desa definitif pertama'),
    JSON_OBJECT('nama','Sahnun.M','periode','2002–2014','keterangan','Kepala Desa Anabanua'),
    JSON_OBJECT('nama',NULL,'periode','2014–2022','keterangan','Data belum tersedia'),
    JSON_OBJECT('nama','Syamsuryadi, A.Md','periode','25 Okt–19 Des 2022','keterangan','Penjabat sementara (PLH)'),
    JSON_OBJECT('nama','Faharuddin','periode','2023–2029','keterangan','Kepala desa definitif')
  ),
  '$.sejarah', 'Desa Anabanua merupakan hasil pemekaran dari Desa Palakka. Desa Persiapan Latuttu dibentuk pada 1990 di bawah pimpinan Haruna, kepala desa dari Desa Palakka. Status desa definitif diperoleh pada 1993. Pemilihan kepala desa pertama dilaksanakan pada 1994 dan dimenangkan Marhaeni, yang sebelumnya menjabat sebagai Sekretaris Desa. Nama Anabanua dikaitkan dengan dua dusun awal, Allejjang dan Banga-bangae, serta dimaknai sebagai anak dari kampung yang dimekarkan dari Palakka. Tradisi pertanian yang dikenal di desa ini antara lain Maddoja Bine, yaitu begadang bersama menjaga benih padi sebelum musim tanam.',
  '$.luasWilayah', '± 20 km²',
  '$.jumlahDusun', 4,
  '$.jumlahRT', 14,
  '$.ketinggian', '0–800 mdpl',
  '$.suhuRataRata', '20–30°C',
  '$.curahHujanTahunan', '± 1.000 mm/tahun',
  '$.batasWilayah', JSON_OBJECT(
    'utara', 'Desa Palakka',
    'selatan', 'Desa Libureng',
    'timur', 'Desa Harapan',
    'barat', 'Kelurahan Coppo'
  ),
  '$.dusun', JSON_ARRAY('Banga-bangae', 'Daccipong', 'Gellengnge', 'Allejjang'),
  '$.demografiKampungKB', JSON_OBJECT(
    'sumber', 'Kampung KB (BKKBN)',
    'jumlahJiwa', 2419,
    'jumlahKK', 633,
    'jumlahPUS', 341,
    'pusBerKB', 273,
    'pusTidakBerKB', 68,
    'keluargaDenganBalita', 147,
    'keluargaDenganRemaja', 393,
    'keluargaDenganLansia', 198,
    'jumlahRemaja', 12
  )
)
WHERE id = 1;

-- Ganti contoh potensi generik dengan komoditas yang diinformasikan desa.
UPDATE potensi_desa
SET nama = 'Padi', kategori = 'Pertanian', deskripsi = 'Pertanian padi sawah menjadi salah satu mata pencaharian masyarakat Desa Anabanua.'
WHERE id = 'pot-001';
UPDATE potensi_desa
SET nama = 'Kakao', kategori = 'Perkebunan', deskripsi = 'Kakao dibudidayakan warga, termasuk oleh kelompok tani di Dusun Banga-bangae.'
WHERE id = 'pot-002';
UPDATE potensi_desa
SET nama = 'Kopi', kategori = 'Perkebunan', deskripsi = 'Kopi dibudidayakan warga, termasuk oleh kelompok tani di Dusun Banga-bangae.'
WHERE id = 'pot-003';

-- Daftar sekolah/lembaga pendidikan yang disampaikan untuk profil Anabanua.
UPDATE fasilitas_desa SET nama='UPTD SD Negeri 27 Barru', kategori='pendidikan', alamat='Dusun Banga-bangae', dusun='Banga-bangae', deskripsi='Sekolah dasar negeri; akreditasi B.' WHERE id='fas-02';
UPDATE fasilitas_desa SET nama='UPTD SD Negeri 30 Barru', kategori='pendidikan', alamat='Dusun Gellengnge', dusun='Gellengnge', deskripsi='Sekolah dasar negeri; akreditasi C.' WHERE id='fas-03';
UPDATE fasilitas_desa SET nama='UPTD SD Negeri 31 Barru', kategori='pendidikan', alamat='Dusun Allejjang', dusun='Allejjang', deskripsi='Sekolah dasar negeri; akreditasi C.' WHERE id='fas-04';
UPDATE fasilitas_desa SET nama='MIS DDI Banga-Banga', kategori='pendidikan', alamat='Dusun Daccipong', dusun='Daccipong', deskripsi='Madrasah ibtidaiyah swasta di bawah Kementerian Agama; didirikan 1 Desember 1986.' WHERE id='fas-05';
UPDATE fasilitas_desa SET nama='UPTD SMP Negeri SATAP 4 Barru', kategori='pendidikan', alamat='Dusun Banga-bangae', dusun='Banga-bangae', deskripsi='Sekolah menengah pertama negeri dengan sistem Satu Atap; NPSN 40314184.' WHERE id='fas-06';
INSERT INTO fasilitas_desa (id,nama,kategori,alamat,dusun,deskripsi,kontak,jam_layanan)
VALUES ('fas-07','KB Abadi Banga-Banga','pendidikan','Dusun Banga-bangae','Banga-bangae','Kelompok Bermain / PAUD.',NULL,NULL)
ON DUPLICATE KEY UPDATE nama=VALUES(nama), kategori=VALUES(kategori), alamat=VALUES(alamat), dusun=VALUES(dusun), deskripsi=VALUES(deskripsi), kontak=VALUES(kontak), jam_layanan=VALUES(jam_layanan);

UPDATE dusun SET nama='Banga-bangae' WHERE id='dsn-001';
UPDATE dusun SET nama='Daccipong' WHERE id='dsn-002';
UPDATE dusun SET nama='Gellengnge' WHERE id='dsn-003';
UPDATE dusun SET nama='Allejjang' WHERE id='dsn-004';

-- Tambahan fasilitas desa yang diinformasikan.
INSERT INTO fasilitas_desa (id,nama,kategori,alamat,dusun,deskripsi,kontak,jam_layanan)
VALUES
  ('fas-08','Lapangan Latuttu','olahraga','Dusun Banga-bangae','Banga-bangae','Lapangan olahraga Desa Anabanua.',NULL,NULL),
  ('fas-09','Posyandu Batu Gua','kesehatan','Dusun Banga-bangae','Banga-bangae','Posyandu yang berada di Dusun Banga-bangae.',NULL,NULL),
  ('fas-10','Puskesmas Pembantu Dusun Gellengnge','kesehatan','Dusun Gellengnge','Gellengnge','Puskesmas pembantu untuk pelayanan kesehatan masyarakat Dusun Gellengnge.',NULL,NULL)
ON DUPLICATE KEY UPDATE
  nama=VALUES(nama), kategori=VALUES(kategori), alamat=VALUES(alamat), dusun=VALUES(dusun),
  deskripsi=VALUES(deskripsi), kontak=VALUES(kontak), jam_layanan=VALUES(jam_layanan);
