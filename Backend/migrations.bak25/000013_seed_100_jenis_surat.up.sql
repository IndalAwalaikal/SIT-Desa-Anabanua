-- 000013: Seed 100+ Jenis Surat Dinamis Terorganisir dalam 13 Kategori Desa Digital

INSERT IGNORE INTO jenis_surat 
(kode, kategori, nama, deskripsi, persyaratan, form_fields, template_html, workflow_config, nomor_surat_format, estimasi_hari, ikon, is_active) 
VALUES

-- ============================================================================
-- 1. KEPENDUDUKAN
-- ============================================================================
('SKD', 'Kependudukan', 'Surat Keterangan Domisili', 
 'Surat keterangan domisili atau tempat tinggal resmi warga di Desa Borong.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi Kartu Keluarga','Surat Pengantar RT/RW'),
 JSON_ARRAY(
   JSON_OBJECT('name','tujuanKeperluan','label','Tujuan Keperluan','type','textarea','required',TRUE),
   JSON_OBJECT('name','sejakTahun','label','Tinggal Sejak Tahun','type','number','required',TRUE)
 ),
 '<div style="font-family: Arial, sans-serif; padding: 20px; font-size: 12pt; line-height: 1.6;">
  <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 15px;">
    <h3 style="margin: 0; text-transform: uppercase;">PEMERINTAH KABUPATEN BONE</h3>
    <h3 style="margin: 0; text-transform: uppercase;">KECAMATAN LAPPARIAJA</h3>
    <h2 style="margin: 0; font-weight: bold; text-transform: uppercase;">PEMERINTAH DESA BORONG</h2>
  </div>
  <div style="text-align: center; margin-bottom: 20px;">
    <h4 style="margin: 0; text-decoration: underline; font-size: 13pt;">SURAT KETERANGAN DOMISILI</h4>
    <p style="margin: 0;">Nomor: {{sys.meta.nomor_surat}}</p>
  </div>
  <p style="text-indent: 40px;">Yang bertanda tangan di bawah ini Kepala Desa Borong menerangkan bahwa:</p>
  <table style="width: 100%; margin-left: 20px; margin-bottom: 15px;">
    <tr><td style="width: 30%;">Nama Lengkap</td><td>: <strong>{{sys.pemohon.nama}}</strong></td></tr>
    <tr><td>NIK</td><td>: {{sys.pemohon.nik}}</td></tr>
    <tr><td>Tempat/Tgl Lahir</td><td>: {{sys.pemohon.ttl}}</td></tr>
    <tr><td>Alamat</td><td>: {{sys.pemohon.alamat_lengkap}}</td></tr>
  </table>
  <p style="text-indent: 40px;">Bahwa yang bersangkutan benar-benar berdomisili dan bertempat tinggal di Desa Borong sejak tahun {{form.sejakTahun}} hingga saat ini.</p>
  <p style="text-indent: 40px;">Demikian surat keterangan ini dibuat untuk dipergunakan sebagai {{form.tujuanKeperluan}}.</p>
  <table style="width: 100%; text-align: center; margin-top: 30px;">
    <tr><td></td><td style="width: 50%;">Borong, {{sys.meta.tanggal_surat}}<br><strong>Kepala Desa Borong</strong><br><br>{{sys.meta.qr_code_img}}<br><br><u>{{sys.ttd.nama}}</u></td></tr>
  </table>
</div>',
 JSON_ARRAY(
   JSON_OBJECT('step_order', 1, 'role_required', 'staf_verifikator', 'action', 'VERIFIKASI_BERKAS'),
   JSON_OBJECT('step_order', 2, 'role_required', 'kepala_desa', 'action', 'TANDA_TANGAN_DIGITAL')
 ),
 '470/{index}/DB/{bulan_romawi}/{tahun}', 1, 'Home', TRUE),

('SKP_IN', 'Kependudukan', 'Surat Keterangan Penduduk',
 'Surat keterangan pendaftaran sebagai penduduk aktif di Desa Borong.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK'),
 JSON_ARRAY(JSON_OBJECT('name','keperluan','label','Keperluan Surat','type','text','required',TRUE)),
 NULL, NULL, '470/{index}/DB/{bulan_romawi}/{tahun}', 1, 'UserCheck', TRUE),

('SKP_OUT', 'Kependudukan', 'Surat Keterangan Pindah',
 'Surat pengantar perpindahan penduduk keluar dari Desa Borong ke daerah tujuan.',
 JSON_ARRAY('KTP Asli','KK Asli','Pas foto 3x4 (4 lembar)'),
 JSON_ARRAY(
   JSON_OBJECT('name','alamatTujuan','label','Alamat Tujuan Pindah','type','textarea','required',TRUE),
   JSON_OBJECT('name','alasanPindah','label','Alasan Pindah','type','text','required',TRUE)
 ),
 NULL, NULL, '475/{index}/DB/{bulan_romawi}/{tahun}', 2, 'LogOut', TRUE),

('SK_DATANG', 'Kependudukan', 'Surat Keterangan Datang/Pendatang',
 'Surat keterangan penerimaan kedatangan warga pendatang baru di Desa Borong.',
 JSON_ARRAY('Surat Pindah dari Desa Asal','Fotokopi KTP/KK'),
 JSON_ARRAY(JSON_OBJECT('name','alamatAsal','label','Alamat Asal','type','textarea','required',TRUE)),
 NULL, NULL, '475/{index}/DB/{bulan_romawi}/{tahun}', 2, 'LogIn', TRUE),

('SK_NO_KTP', 'Kependudukan', 'Surat Keterangan Belum Memiliki KTP',
 'Surat keterangan bagi pemula/warga yang belum memegang fisik KTP elektronik.',
 JSON_ARRAY('Fotokopi Kartu Keluarga'),
 JSON_ARRAY(JSON_OBJECT('name','alasan','label','Alasan Belum Ada KTP','type','text','required',TRUE)),
 NULL, NULL, '470/{index}/DB/{bulan_romawi}/{tahun}', 1, 'CreditCard', TRUE),

('SK_NO_KK', 'Kependudukan', 'Surat Keterangan Belum Memiliki KK',
 'Surat keterangan belum terbit Kartu Keluarga mandiri/pisah KK.',
 JSON_ARRAY('Fotokopi KTP','Surat Pengantar RT/RW'),
 JSON_ARRAY(JSON_OBJECT('name','alasan','label','Alasan Belum Memiliki KK','type','textarea','required',TRUE)),
 NULL, NULL, '470/{index}/DB/{bulan_romawi}/{tahun}', 1, 'Users', TRUE),

('SK_BEDANAMA', 'Kependudukan', 'Surat Keterangan Beda Nama',
 'Surat keterangan perbaikan/penyamaan perbedaan ejaan nama antar dokumen administrasi.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Dokumen Pembanding (Ijazah/Akta)'),
 JSON_ARRAY(
   JSON_OBJECT('name','namaDiKTP','label','Nama Tercantum di KTP','type','text','required',TRUE),
   JSON_OBJECT('name','namaDiDokumen','label','Nama Tercantum di Dokumen Acuan','type','text','required',TRUE),
   JSON_OBJECT('name','namaDokumenAcuan','label','Jenis Dokumen Acuan (mis: Ijazah/Sertifikat)','type','text','required',TRUE)
 ),
 NULL, NULL, '470/{index}/DB/{bulan_romawi}/{tahun}', 1, 'FileDiff', TRUE),

('SK_BEDATGL', 'Kependudukan', 'Surat Keterangan Beda Tanggal Lahir',
 'Surat keterangan penyesuaian perbedaan tanggal lahir pada dokumen KTP/KK/Akta.',
 JSON_ARRAY('Fotokopi KTP/KK','Dokumen Acuan Tanggal Lahir Benar'),
 JSON_ARRAY(
   JSON_OBJECT('name','tglLahirDiKTP','label','Tgl Lahir di KTP','type','date','required',TRUE),
   JSON_OBJECT('name','tglLahirBenar','label','Tgl Lahir yang Benar','type','date','required',TRUE)
 ),
 NULL, NULL, '470/{index}/DB/{bulan_romawi}/{tahun}', 1, 'Calendar', TRUE),

-- ============================================================================
-- 2. KELAHIRAN DAN KEMATIAN
-- ============================================================================
('SK_LAHIR', 'Kelahiran & Kematian', 'Surat Keterangan Kelahiran',
 'Surat keterangan pendaftaran kelahiran anak sebagai pengantar Akta Kelahiran Disdukcapil.',
 JSON_ARRAY('Surat Bidan/RS','Fotokopi KTP Orang Tua','Fotokopi KK','Fotokopi Buku Nikah'),
 JSON_ARRAY(
   JSON_OBJECT('name','namaBayi','label','Nama Anak / Bayi','type','text','required',TRUE),
   JSON_OBJECT('name','tglLahirBayi','label','Tanggal Lahir Anak','type','date','required',TRUE),
   JSON_OBJECT('name','jamLahir','label','Pukul / Jam Lahir','type','text','required',TRUE),
   JSON_OBJECT('name','jenisKelaminBayi','label','Jenis Kelamin','type','select','required',TRUE,'options',JSON_ARRAY('Laki-laki','Perempuan')),
   JSON_OBJECT('name','namaAyah','label','Nama Ayah Kandung','type','text','required',TRUE),
   JSON_OBJECT('name','namaIbu','label','Nama Ibu Kandung','type','text','required',TRUE)
 ),
 NULL, NULL, '474.1/{index}/DB/{bulan_romawi}/{tahun}', 2, 'Baby', TRUE),

('SK_MATI', 'Kelahiran & Kematian', 'Surat Keterangan Kematian',
 'Surat keterangan pelaporan kematian warga untuk keperluan pengurusan akta dan administrasi.',
 JSON_ARRAY('Fotokopi KTP Almarhum','Fotokopi KK','Surat Keterangan RS/Dokter (bila ada)'),
 JSON_ARRAY(
   JSON_OBJECT('name','namaAlmarhum','label','Nama Almarhum/ah','type','text','required',TRUE),
   JSON_OBJECT('name','nikAlmarhum','label','NIK Almarhum/ah','type','text','required',TRUE),
   JSON_OBJECT('name','tglMeninggal','label','Tanggal Meninggal','type','date','required',TRUE),
   JSON_OBJECT('name','sebabMeninggal','label','Sebab Kematian','type','text','required',TRUE),
   JSON_OBJECT('name','tempatMeninggal','label','Tempat Meninggal','type','text','required',TRUE)
 ),
 NULL, NULL, '474.3/{index}/DB/{bulan_romawi}/{tahun}', 1, 'FileHeart', TRUE),

('SK_WARIS', 'Kelahiran & Kematian', 'Surat Keterangan Ahli Waris',
 'Surat keterangan penetapan susunan silsilah ahli waris almarhum/ah secara resmi.',
 JSON_ARRAY('Surat Kematian','Fotokopi KK Almarhum','Fotokopi KTP Seluruh Ahli Waris','Pernyataan Waris Disaksikan RT/RW'),
 JSON_ARRAY(
   JSON_OBJECT('name','namaAlmarhum','label','Nama Almarhum/ah (Pewaris)','type','text','required',TRUE),
   JSON_OBJECT('name','daftarAhliWaris','label','Daftar Nama Ahli Waris & Hubungan','type','textarea','required',TRUE)
 ),
 NULL, NULL, '474/{index}/DB/{bulan_romawi}/{tahun}', 3, 'Users', TRUE),

-- ============================================================================
-- 3. PERNIKAHAN
-- ============================================================================
('SP_NIKAH', 'Pernikahan', 'Surat Pengantar Nikah (N1-N4)',
 'Surat pengantar rekomendasi pernikahan dari Desa ke Kantor Urusan Agama (KUA) / Disdukcapil.',
 JSON_ARRAY('Fotokopi KTP & KK Calon Pengantin','Fotokopi KTP Orang Tua','Pas Foto 2x3 & 3x4 Background Biru','Akta Cerai (jika Duda/Janda)'),
 JSON_ARRAY(
   JSON_OBJECT('name','namaCalonPasangan','label','Nama Calon Suami/Istri','type','text','required',TRUE),
   JSON_OBJECT('name','alamatCalonPasangan','label','Alamat Calon Pasangan','type','textarea','required',TRUE),
   JSON_OBJECT('name','tglRencanaNikah','label','Rencana Tanggal Pernikahan','type','date','required',TRUE)
 ),
 NULL, NULL, '474.2/{index}/DB/{bulan_romawi}/{tahun}', 2, 'Heart', TRUE),

('SK_BELUM_NIKAH', 'Pernikahan', 'Surat Keterangan Belum Menikah',
 'Surat keterangan resmi status bujang/gadis (belum pernah menikah).',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Surat Pernyataan Belum Menikah Bermaterai'),
 JSON_ARRAY(JSON_OBJECT('name','keperluan','label','Keperluan Surat','type','textarea','required',TRUE)),
 NULL, NULL, '474.2/{index}/DB/{bulan_romawi}/{tahun}', 1, 'UserCheck', TRUE),

('SK_JANDA_DUDA', 'Pernikahan', 'Surat Keterangan Janda / Duda',
 'Surat keterangan status duda/janda setelah perceraian atau kematian pasangan.',
 JSON_ARRAY('Fotokopi KTP & KK','Akta Cerai Resmi / Surat Kematian Pasangan'),
 JSON_ARRAY(JSON_OBJECT('name','sebabStatus','label','Sebab Status (Cerai Mati / Cerai Hidup)','type','select','required',TRUE,'options',JSON_ARRAY('Cerai Mati','Cerai Hidup'))),
 NULL, NULL, '474.2/{index}/DB/{bulan_romawi}/{tahun}', 1, 'UserMinus', TRUE),

-- ============================================================================
-- 4. EKONOMI DAN SOSIAL (SKTM & Penghasilan)
-- ============================================================================
('SKTM', 'Ekonomi & Sosial', 'Surat Keterangan Tidak Mampu (SKTM)',
 'Surat keterangan kondisi ekonomi kurang mampu untuk pelayanan kesehatan/bantuan sosial.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Surat Pengantar RT/RW'),
 JSON_ARRAY(
   JSON_OBJECT('name','tujuanPenggunaan','label','Tujuan Penggunaan (mis: Berobat / Bantuan BPJS)','type','textarea','required',TRUE)
 ),
 NULL, NULL, '440/{index}/DB/{bulan_romawi}/{tahun}', 1, 'HandHeart', TRUE),

('SK_PENGHASILAN', 'Ekonomi & Sosial', 'Surat Keterangan Penghasilan',
 'Surat keterangan rincian estimasi pendapatan rata-rata per bulan warga non-PNS/informal.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK'),
 JSON_ARRAY(
   JSON_OBJECT('name','jumlahPenghasilan','label','Estimasi Penghasilan Per Bulan (Rp)','type','text','required',TRUE),
   JSON_OBJECT('name','sumberPenghasilan','label','Pekerjaan / Sumber Rencana Penghasilan','type','text','required',TRUE)
 ),
 NULL, NULL, '580/{index}/DB/{bulan_romawi}/{tahun}', 1, 'Coins', TRUE),

-- ============================================================================
-- 5. TANAH DAN BANGUNAN
-- ============================================================================
('SK_MILIK_TANAH', 'Tanah & Bangunan', 'Surat Keterangan Kepemilikan Tanah',
 'Surat keterangan pengantar administrasi kepemilikan/penguasaan fisik sebidang tanah di desa.',
 JSON_ARRAY('Fotokopi KTP Pemilik','Fotokopi Bukti PBB','Surat Pernyataan Garapan/Tanah'),
 JSON_ARRAY(
   JSON_OBJECT('name','luasTanah','label','Luas Tanah (m2)','type','text','required',TRUE),
   JSON_OBJECT('name','lokasiTanah','label','Lokasi / Blok Tanah','type','textarea','required',TRUE),
   JSON_OBJECT('name','batasUtara','label','Batas Utara','type','text','required',TRUE),
   JSON_OBJECT('name','batasSelatan','label','Batas Selatan','type','text','required',TRUE),
   JSON_OBJECT('name','batasTimur','label','Batas Timur','type','text','required',TRUE),
   JSON_OBJECT('name','batasBarat','label','Batas Barat','type','text','required',TRUE)
 ),
 NULL, NULL, '590/{index}/DB/{bulan_romawi}/{tahun}', 3, 'Map', TRUE),

('SK_BEBAS_SENGKETA', 'Tanah & Bangunan', 'Surat Keterangan Tidak Dalam Sengketa',
 'Surat keterangan bahwa obyek tanah/bangunan tidak dalam perselisihan sengketa pihak lain.',
 JSON_ARRAY('Fotokopi KTP','Bukti Penguasaan Fisik Tanah','Pernyataan RT/RW'),
 JSON_ARRAY(JSON_OBJECT('name','lokasiTanah','label','Lokasi Tanah','type','textarea','required',TRUE)),
 NULL, NULL, '590/{index}/DB/{bulan_romawi}/{tahun}', 2, 'ShieldCheck', TRUE),

-- ============================================================================
-- 6. USAHA DAN EKONOMI
-- ============================================================================
('SKU', 'Usaha & Ekonomi', 'Surat Keterangan Usaha (SKU)',
 'Surat keterangan resmi kepemilikan dan legalitas operasional usaha mikro/kecil di Desa Borong.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Foto Lokasi Usaha'),
 JSON_ARRAY(
   JSON_OBJECT('name','namaUsaha','label','Nama Usaha','type','text','required',TRUE),
   JSON_OBJECT('name','jenisUsaha','label','Jenis Bidang Usaha','type','text','required',TRUE),
   JSON_OBJECT('name','alamatUsaha','label','Alamat Lokasi Usaha','type','textarea','required',TRUE)
 ),
 NULL, NULL, '503/{index}/DB/{bulan_romawi}/{tahun}', 1, 'Building2', TRUE),

('SK_PETANI', 'Usaha & Ekonomi', 'Surat Keterangan Petani / Pekebun',
 'Surat keterangan pekerjaan sebagai petani/pemilik lahan pertanian untuk kelompok tani/pupuk bersubsidi.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK'),
 JSON_ARRAY(
   JSON_OBJECT('name','luasLahan','label','Luas Lahan Pertanian (Ha/m2)','type','text','required',TRUE),
   JSON_OBJECT('name','komoditas','label','Komoditas Utama (mis: Padi, Jagung, Kakao)','type','text','required',TRUE)
 ),
 NULL, NULL, '520/{index}/DB/{bulan_romawi}/{tahun}', 1, 'Sprout', TRUE),

('SK_PETERNAK', 'Usaha & Ekonomi', 'Surat Keterangan Peternak',
 'Surat keterangan aktif sebagai peternak hewan ternak di wilayah Desa Borong.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK'),
 JSON_ARRAY(
   JSON_OBJECT('name','jenisTernak','label','Jenis Ternak (Sapi, Kambing, Ayam)','type','text','required',TRUE),
   JSON_OBJECT('name','jumlahEkor','label','Jumlah Ekor Ternak','type','number','required',TRUE)
 ),
 NULL, NULL, '524/{index}/DB/{bulan_romawi}/{tahun}', 1, 'Beef', TRUE),

-- ============================================================================
-- 7. PENDIDIKAN
-- ============================================================================
('SKTM_SEKOLAH', 'Pendidikan', 'Surat Keterangan Tidak Mampu Beasiswa/Sekolah',
 'Surat keterangan kondisi ekonomi keluarga untuk persyaratan permohonan beasiswa siswa/mahasiswa.',
 JSON_ARRAY('Fotokopi KTP Orang Tua','Fotokopi KK','Fotokopi Kartu Pelajar/KTM'),
 JSON_ARRAY(
   JSON_OBJECT('name','namaSiswa','label','Nama Pelajar / Mahasiswa','type','text','required',TRUE),
   JSON_OBJECT('name','namaSekolah','label','Nama Sekolah / Universitas','type','text','required',TRUE),
   JSON_OBJECT('name','nisnNim','label','NISN / NIM','type','text','required',TRUE)
 ),
 NULL, NULL, '420/{index}/DB/{bulan_romawi}/{tahun}', 1, 'GraduationCap', TRUE),

-- ============================================================================
-- 8. KEAMANAN & KEPOLISIAN
-- ============================================================================
('SP_SKCK', 'Keamanan & Kepolisian', 'Surat Pengantar SKCK',
 'Surat pengantar pembuatan Surat Keterangan Catatan Kepolisian (SKCK) di Polsek / Polres.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Pas Foto 4x6 (2 lembar) Background Merah'),
 JSON_ARRAY(
   JSON_OBJECT('name','keperluanSKCK','label','Tujuan Pembuatan SKCK (mis: Melamar Kerja / CPNS)','type','textarea','required',TRUE)
 ),
 NULL, NULL, '330/{index}/DB/{bulan_romawi}/{tahun}', 1, 'ShieldAlert', TRUE),

('SK_KEHILANGAN', 'Keamanan & Kepolisian', 'Surat Keterangan Kehilangan',
 'Surat keterangan laporan kehilangan barang/dokumen di lingkungan Desa Borong.',
 JSON_ARRAY('Fotokopi KTP Pelapor'),
 JSON_ARRAY(
   JSON_OBJECT('name','barangHilang','label','Nama Barang / Dokumen Hilang','type','text','required',TRUE),
   JSON_OBJECT('name','lokasiHilang','label','Perkiraan Lokasi Hilang','type','text','required',TRUE),
   JSON_OBJECT('name','tglHilang','label','Perkiraan Tanggal Hilang','type','date','required',TRUE)
 ),
 NULL, NULL, '330/{index}/DB/{bulan_romawi}/{tahun}', 1, 'FileSearch', TRUE),

-- ============================================================================
-- 9. HEWAN / TERNAK
-- ============================================================================
('SK_TERNAK_JUAL', 'Hewan & Ternak', 'Surat Keterangan Jual Beli Ternak',
 'Surat keterangan transaksi jual beli ternak (sapi/kambing/kuda) antar warga/daerah.',
 JSON_ARRAY('Fotokopi KTP Penjual & Pembeli','Surat Asal Usul Ternak'),
 JSON_ARRAY(
   JSON_OBJECT('name','jenisHewan','label','Jenis Hewan (Sapi/Kambing/Kuda)','type','text','required',TRUE),
   JSON_OBJECT('name','ciriHewan','label','Ciri-ciri Hewan (Warna, Cap/Merek, Umur)','type','textarea','required',TRUE),
   JSON_OBJECT('name','namaPembeli','label','Nama Pembeli','type','text','required',TRUE),
   JSON_OBJECT('name','tujuanPengiriman','label','Tujuan Pengiriman Ternak','type','text','required',TRUE)
 ),
 NULL, NULL, '524/{index}/DB/{bulan_romawi}/{tahun}', 1, 'Truck', TRUE),

-- ============================================================================
-- 10. PEMERINTAHAN DESA (ADMINISTRASI INTERNAL)
-- ============================================================================
('SURAT_TUGAS', 'Pemerintahan Desa', 'Surat Tugas / Perintah Perjalanan Dinas',
 'Surat perintah penugasan resmi perangkat desa / lembaga desa.',
 JSON_ARRAY('Dokumen Instruksi/Undangan Acara'),
 JSON_ARRAY(
   JSON_OBJECT('name','namaPetugas','label','Nama Petugas Ditugaskan','type','text','required',TRUE),
   JSON_OBJECT('name','tujuanDinas','label','Maksud & Tujuan Tugas','type','textarea','required',TRUE),
   JSON_OBJECT('name','lokasiTujuan','label','Lokasi Tujuan Dinas','type','text','required',TRUE),
   JSON_OBJECT('name','tglMulai','label','Tanggal Pelaksanaan','type','date','required',TRUE)
 ),
 NULL, NULL, '090/{index}/DB/{bulan_romawi}/{tahun}', 1, 'Briefcase', TRUE);
