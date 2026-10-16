-- Pulihkan nilai awal profil yang disediakan seed 000001.
UPDATE profil_desa
SET data = JSON_SET(
  JSON_REMOVE(data, '$.kodeWilayah', '$.ketinggian', '$.suhuRataRata', '$.curahHujanTahunan', '$.batasWilayah', '$.dusun', '$.demografiKampungKB', '$.riwayatKepalaDesa'),
  '$.fotoKantor', 'https://images.unsplash.com/photo-1555521893-f50a5a5e4172?w=800&q=80',
  '$.alamatKantor', 'Jl. Poros Desa Anabanua, Kecamatan Barru, Kabupaten Barru',
  '$.misi', JSON_ARRAY(
    'Meningkatkan kualitas pelayanan publik desa melalui digitalisasi dan transparansi pemerintahan.',
    'Mengembangkan potensi ekonomi lokal berbasis pertanian, perkebunan, UMKM, dan kewirausahaan warga.',
    'Melestarikan nilai budaya, kearifan lokal, dan semangat kebersamaan masyarakat.',
    'Meningkatkan kualitas sumber daya manusia melalui pendidikan dan pelatihan keterampilan.'
  ),
  '$.sejarah', 'Desa Anabanua berada di wilayah pegunungan Kecamatan Barru, Kabupaten Barru, Provinsi Sulawesi Selatan. Kehidupan masyarakat tumbuh dari semangat gotong royong, pertanian, perkebunan, dan tradisi lokal yang diwariskan dari generasi ke generasi.',
  '$.luasWilayah', '20 km²',
  '$.jumlahDusun', 4,
  '$.jumlahRT', 16
)
WHERE id = 1;

UPDATE potensi_desa
SET nama='Kopi Arabika Anabanua', kategori='Pertanian', deskripsi='Kopi arabika yang ditanam di ketinggian optimal dengan cita rasa khas Barru yang dikenal luas.'
WHERE id='pot-001';
UPDATE potensi_desa
SET nama='Tenun Khas Barru', kategori='Kerajinan', deskripsi='Kain tenun tradisional dengan motif geometris khas yang menjadi warisan budaya setempat.'
WHERE id='pot-002';
UPDATE potensi_desa
SET nama='Kebun Kakao dan Kopi', kategori='Perkebunan', deskripsi='Kakao dan kopi dibudidayakan warga, termasuk oleh kelompok tani di Dusun Banga-bangae.'
WHERE id='pot-003';

UPDATE fasilitas_desa SET nama='UPT SD Negeri Anabanua', kategori='pendidikan', alamat='Jl. Pendidikan No. 1', dusun='Anabanua Utara', deskripsi='Layanan pendidikan dasar untuk anak usia sekolah dasar.' WHERE id='fas-02';
UPDATE fasilitas_desa SET nama='Posyandu Melati', kategori='kesehatan', alamat='Balai Dusun Anabanua Selatan', dusun='Anabanua Selatan', deskripsi='Layanan kesehatan ibu, bayi, balita, dan lansia setiap bulan.', jam_layanan='Minggu kedua tiap bulan, 08.00 WITA' WHERE id='fas-03';
UPDATE fasilitas_desa SET nama='Masjid Nurul Huda', kategori='ibadah', alamat='Jl. Poros Barru', dusun='Anabanua Selatan', deskripsi='Fasilitas ibadah dan pembinaan keagamaan masyarakat.' WHERE id='fas-04';
UPDATE fasilitas_desa SET nama='Lapangan Desa Anabanua', kategori='olahraga', alamat='Kompleks Kantor Desa', dusun='Anabanua Utara', deskripsi='Lapangan olahraga, upacara, dan kegiatan masyarakat desa.' WHERE id='fas-05';
UPDATE fasilitas_desa SET nama='Poskesdes Anabanua', kategori='kesehatan', alamat='Jl. Poros Desa Anabanua', dusun='Tondon', deskripsi='Layanan kesehatan dasar dan rujukan warga.' WHERE id='fas-06';
DELETE FROM fasilitas_desa WHERE id='fas-07';

UPDATE dusun SET nama='Dusun Anabanua Utara' WHERE id='dsn-001';
UPDATE dusun SET nama='Dusun Anabanua Selatan' WHERE id='dsn-002';
UPDATE dusun SET nama='Dusun Anabanua Timur' WHERE id='dsn-003';
UPDATE dusun SET nama='Dusun Anabanua Barat' WHERE id='dsn-004';

DELETE FROM fasilitas_desa WHERE id IN ('fas-08','fas-09','fas-10');
