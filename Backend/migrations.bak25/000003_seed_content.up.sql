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
