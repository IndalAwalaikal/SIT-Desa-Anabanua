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
