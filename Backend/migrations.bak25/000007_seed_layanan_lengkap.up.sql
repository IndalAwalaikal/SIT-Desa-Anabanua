-- 000007: tambahkan 8 jenis surat lagi (total 12 jenis surat di sistem)
-- 8 jenis berikut belum ada di DB (hanya SKD, SKU, SKTM, SPN yang ada dari 000002):
--   SPK, SPKK, SKL, SKM, SKP, SKH, SKBM, LAIN

INSERT IGNORE INTO jenis_surat (kode,nama,deskripsi,persyaratan,form_fields,estimasi_hari,ikon,is_active) VALUES

('SPK','Surat Pengantar KTP',
 'Surat pengantar untuk pembuatan KTP baru atau perpanjangan KTP di Disdukcapil.',
 JSON_ARRAY('Fotokopi KK','Pas foto 3x4 (3 lembar)','KTP lama (jika perpanjangan)'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaLengkap','label','Nama Lengkap','type','text','required',TRUE),
  JSON_OBJECT('name','jenisPermohonan','label','Jenis Permohonan','type','select','required',TRUE,'options',JSON_ARRAY('KTP Baru','Perpanjangan KTP','Penggantian KTP Hilang/Rusak')),
  JSON_OBJECT('name','noKK','label','Nomor KK','type','text','required',TRUE),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',TRUE)
 ),1,'CreditCard',TRUE),

('SPKK','Surat Pengantar Kartu Keluarga',
 'Surat pengantar untuk pembuatan atau perubahan Kartu Keluarga di Disdukcapil.',
 JSON_ARRAY('Fotokopi KTP semua anggota keluarga','KK lama (jika perubahan)','Akta nikah/cerai (jika ada perubahan)'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaKepalaKeluarga','label','Nama Kepala Keluarga','type','text','required',TRUE),
  JSON_OBJECT('name','jenisPermohonan','label','Jenis Permohonan','type','select','required',TRUE,'options',JSON_ARRAY('KK Baru','Perubahan KK','Penggantian KK Hilang')),
  JSON_OBJECT('name','alasanPerubahan','label','Alasan','type','textarea','required',TRUE),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',TRUE)
 ),2,'Users',TRUE),

('SKL','Surat Keterangan Kelahiran',
 'Surat keterangan kelahiran sebagai dasar pembuatan akta kelahiran di Disdukcapil.',
 JSON_ARRAY('Surat keterangan lahir dari bidan/RS','Fotokopi KTP orang tua','Fotokopi KK','Fotokopi akta nikah'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaAnak','label','Nama Anak','type','text','required',TRUE),
  JSON_OBJECT('name','tanggalLahir','label','Tanggal Lahir','type','date','required',TRUE),
  JSON_OBJECT('name','tempatLahir','label','Tempat Lahir','type','text','required',TRUE),
  JSON_OBJECT('name','namaAyah','label','Nama Ayah','type','text','required',TRUE),
  JSON_OBJECT('name','namaIbu','label','Nama Ibu','type','text','required',TRUE),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',TRUE)
 ),2,'Baby',TRUE),

('SKM','Surat Keterangan Kematian',
 'Surat keterangan kematian untuk keperluan administrasi kependudukan.',
 JSON_ARRAY('Fotokopi KTP almarhum/ah','Fotokopi KK','Surat keterangan dari RS/dokter (jika ada)','Laporan dari RT/RW'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaAlmarhum','label','Nama Almarhum/ah','type','text','required',TRUE),
  JSON_OBJECT('name','tanggalMeninggal','label','Tanggal Meninggal','type','date','required',TRUE),
  JSON_OBJECT('name','tempatMeninggal','label','Tempat Meninggal','type','text','required',TRUE),
  JSON_OBJECT('name','sebabKematian','label','Sebab Kematian','type','text','required',TRUE),
  JSON_OBJECT('name','namaPelapor','label','Nama Pelapor','type','text','required',TRUE),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',TRUE)
 ),2,'FileHeart',TRUE),

('SKBM','Surat Keterangan Belum Menikah',
 'Surat keterangan yang menyatakan bahwa seseorang belum pernah menikah.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Surat pernyataan belum menikah (bermaterai)'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaLengkap','label','Nama Lengkap','type','text','required',TRUE),
  JSON_OBJECT('name','nik','label','NIK','type','text','required',TRUE),
  JSON_OBJECT('name','keperluan','label','Keperluan','type','text','required',TRUE),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',TRUE)
 ),2,'UserCheck',TRUE),

('SKP','Surat Keterangan Pindah Domisili',
 'Surat keterangan pindah untuk warga yang akan berpindah domisili ke desa/kelurahan lain.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Surat pengantar RT/RW'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaLengkap','label','Nama Lengkap','type','text','required',TRUE),
  JSON_OBJECT('name','nik','label','NIK','type','text','required',TRUE),
  JSON_OBJECT('name','alamatAsal','label','Alamat Asal','type','textarea','required',TRUE),
  JSON_OBJECT('name','alamatTujuan','label','Alamat Tujuan Pindah','type','textarea','required',TRUE),
  JSON_OBJECT('name','alasanPindah','label','Alasan Pindah','type','text','required',TRUE),
  JSON_OBJECT('name','jumlahPengikut','label','Jumlah Pengikut Pindah','type','number','required',TRUE),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',TRUE)
 ),3,'MapPin',TRUE),

('SKH','Surat Keterangan Kehilangan',
 'Surat pengantar untuk melapor kehilangan barang/dokumen ke kepolisian.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaLengkap','label','Nama Lengkap','type','text','required',TRUE),
  JSON_OBJECT('name','nik','label','NIK','type','text','required',TRUE),
  JSON_OBJECT('name','barangHilang','label','Barang/Dokumen yang Hilang','type','text','required',TRUE),
  JSON_OBJECT('name','tempatKehilangan','label','Tempat Kehilangan','type','text','required',TRUE),
  JSON_OBJECT('name','waktuKehilangan','label','Waktu Kehilangan (perkiraan)','type','date','required',TRUE),
  JSON_OBJECT('name','kronologi','label','Kronologi Singkat','type','textarea','required',TRUE),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',FALSE)
 ),1,'Search',TRUE),

('LAIN','Surat Keterangan Lain-lain',
 'Surat keterangan untuk keperluan lainnya yang tidak tercakup dalam jenis surat di atas.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK','Dokumen pendukung sesuai keperluan'),
 JSON_ARRAY(
  JSON_OBJECT('name','namaLengkap','label','Nama Lengkap','type','text','required',TRUE),
  JSON_OBJECT('name','nik','label','NIK','type','text','required',TRUE),
  JSON_OBJECT('name','jenisSurat','label','Jenis Surat yang Diminta','type','text','required',TRUE),
  JSON_OBJECT('name','keperluan','label','Keperluan','type','textarea','required',TRUE),
  JSON_OBJECT('name','keterangan','label','Keterangan Tambahan','type','textarea','required',FALSE),
  JSON_OBJECT('name','lampiran','label','Dokumen Pendukung','type','file','required',TRUE)
 ),3,'FileText',TRUE)
;
