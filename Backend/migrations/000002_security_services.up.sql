-- consolidated from 000006_security_cleanup.up.sql
-- Disable the fixed demonstration identities from migrations before 000006.
-- Operators must bootstrap a new, unique super-admin account via environment.
UPDATE users
SET is_active = FALSE
WHERE id IN ('usr-maria', 'usr-admin', 'usr-super');

-- consolidated from 000007_seed_layanan_lengkap.up.sql
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

-- consolidated from 000008_otp_email.up.sql
-- Migration 000008: Email verification via OTP (Mailjet) + surat notification email.
-- Adds email_verified flag, otp_codes table, email_log table, and surat delivery
-- tracking columns. Existing users (including bootstrap super admin) are marked
-- as email-verified so they keep working.

-- 1. Users: track email verification status.
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE users SET email_verified = TRUE;

-- 2. One-time passcode (OTP) table for verify_email & reset_password.
-- A single user has at most one *pending* code per purpose; older rows for the
-- same (user_id, purpose) are invalidated by purpose-scoped lookup + usage.
CREATE TABLE IF NOT EXISTS otp_codes (
  id           CHAR(26)      NOT NULL PRIMARY KEY,
  user_id      CHAR(26)      NOT NULL,
  code         VARCHAR(10)   NOT NULL,
  purpose      ENUM('verify_email','reset_password') NOT NULL,
  expires_at   DATETIME      NOT NULL,
  used_at      DATETIME      NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_otp_user  (user_id),
  INDEX idx_otp_code  (code)
);

-- 3. Surat delivery: track whether a finished letter's email was sent.
ALTER TABLE pengajuan_surat ADD COLUMN dokumen_email_terkirim       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pengajuan_surat ADD COLUMN dokumen_email_terkirim_at    DATETIME NULL;

-- 4. Email send log (audit trail for verify/reset/surat).
CREATE TABLE IF NOT EXISTS email_log (
  id            CHAR(26)      NOT NULL PRIMARY KEY,
  user_id       CHAR(26)      NOT NULL,
  purpose       ENUM('verify_email','reset_password','surat_selesai') NOT NULL,
  to_email      VARCHAR(255)  NOT NULL,
  subject       VARCHAR(255)  NOT NULL,
  status        ENUM('sent','failed') NOT NULL DEFAULT 'sent',
  error_message TEXT          NULL,
  sent_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email_user (user_id)
);

-- consolidated from 000009_pending_registration.up.sql
-- Migration 000009: pending registrations.
--
-- Registrasi warga TIDAK lagi langsung membuat baris di `users`. Data sementara
-- ditahan di `pending_registrations` (ber-email unik) sampai OTP verifikasi email
-- berhasil. Dengan begitu:
--   * email/NIK yang salah-verifikasi bisa didaftarkan ulang tanpa konflik.
--   * tidak ada akun non-aktif / tak-terverifikasi yang "mencuri" email unik.
-- Baris dipindahkan ke `users` hanya pada VerifyOTP yang sukses.

CREATE TABLE IF NOT EXISTS pending_registrations (
  email          VARCHAR(191) NOT NULL PRIMARY KEY,
  nama           VARCHAR(150) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  nik            VARCHAR(16)  NULL,
  telepon        VARCHAR(30)  NULL,
  alamat         TEXT         NULL,
  otp_code       VARCHAR(10)  NOT NULL,
  otp_expires_at DATETIME     NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- consolidated from 000010_expand_foto_column.up.sql
ALTER TABLE `perangkat_desa` MODIFY `foto` VARCHAR(2048) NOT NULL;

-- consolidated from 000011_apbdes_periode.up.sql
-- 000011: APBDes periode (bulanan/triwulanan) selain tahunan.
-- Sebelumnya apbdes_item hanya punya `tahun`, padahal transparansi APBDes lazim
-- diinput setiap akhir bulan atau triwulan. Sekarang tiap baris boleh ditandai:
--   bulan   1-12  -> entri bulanan
--   triwulan 1-4  -> entri triwulanan
--   keduanya NULL  -> entri tahunan (lihat seed 000004)
ALTER TABLE apbdes_item
  ADD COLUMN bulan TINYINT UNSIGNED NULL AFTER tahun,
  ADD COLUMN triwulan TINYINT UNSIGNED NULL AFTER bulan;

-- consolidated from 000012_dynamic_persuratan.up.sql
-- 000012: Dynamic Persuratan (100+ Template Engine, Data Penduduk Binding, Approval Workflow)

-- 1. Tambah kolom dinamis ke jenis_surat
ALTER TABLE jenis_surat 
  ADD COLUMN kategori VARCHAR(50) NOT NULL DEFAULT 'Umum' AFTER kode,
  ADD COLUMN template_html LONGTEXT NULL AFTER form_fields,
  ADD COLUMN workflow_config JSON NULL AFTER template_html,
  ADD COLUMN nomor_surat_format VARCHAR(100) NOT NULL DEFAULT '470/{index}/DB/{bulan_romawi}/{tahun}' AFTER workflow_config;

-- 2. Buat tabel master data penduduk (integrasi auto-fill data warga)
CREATE TABLE IF NOT EXISTS penduduk (
    nik VARCHAR(16) PRIMARY KEY,
    no_kk VARCHAR(16) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    tempat_lahir VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin ENUM('L', 'P') NOT NULL,
    agama VARCHAR(30) NOT NULL DEFAULT 'Islam',
    status_perkawinan ENUM('belum_kawin', 'kawin', 'cerai_hidup', 'cerai_mati') NOT NULL DEFAULT 'belum_kawin',
    pekerjaan VARCHAR(100) NOT NULL DEFAULT 'Wiraswasta',
    golongan_darah VARCHAR(5) NULL,
    hubungan_keluarga ENUM('kepala_keluarga', 'suami', 'istri', 'anak', 'orang_tua', 'famili_lain') NOT NULL DEFAULT 'anak',
    alamat TEXT NOT NULL,
    rt VARCHAR(5) NOT NULL DEFAULT '001',
    rw VARCHAR(5) NOT NULL DEFAULT '001',
    dusun VARCHAR(100) NOT NULL DEFAULT 'Dusun I',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_penduduk_no_kk(no_kk)
);

-- 3. Tambah kolom pendukung workflow & pdf ke pengajuan_surat
ALTER TABLE pengajuan_surat
  ADD COLUMN nomor_surat_resmi VARCHAR(100) NULL AFTER nomor_resi,
  ADD COLUMN subjek_nik VARCHAR(16) NULL AFTER pemohon_id,
  ADD COLUMN data_snapshot JSON NULL AFTER data_isian,
  ADD COLUMN current_step INT NOT NULL DEFAULT 1 AFTER status,
  ADD COLUMN file_pdf_url VARCHAR(255) NULL AFTER catatan_admin,
  ADD COLUMN qr_verification_code VARCHAR(100) NULL UNIQUE AFTER file_pdf_url;

-- 4. Tabel pengajuan_approval_step untuk tracking workflow persetujuan multi-level
CREATE TABLE IF NOT EXISTS pengajuan_approval_step (
    id CHAR(26) PRIMARY KEY,
    pengajuan_id CHAR(26) NOT NULL,
    step_order INT NOT NULL,
    role_required VARCHAR(50) NOT NULL,
    actor_id CHAR(26) NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    catatan TEXT NULL,
    signed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(pengajuan_id) REFERENCES pengajuan_surat(id) ON DELETE CASCADE,
    FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE SET NULL,
    KEY idx_pas_pengajuan(pengajuan_id, step_order)
);

-- 5. Seed sampel template HTML & Workflow Config default untuk jenis surat yang sudah ada (SKU, SKTM, SPK)
UPDATE jenis_surat 
SET template_html = '<div style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #000; padding: 20px;">
  <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px;">
    <h3 style="margin: 0; font-size: 14pt; text-transform: uppercase;">PEMERINTAH KABUPATEN BARRU</h3>
    <h3 style="margin: 0; font-size: 14pt; text-transform: uppercase;">KECAMATAN BARRU</h3>
    <h2 style="margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase;">PEMERINTAH DESA ANABANUA</h2>
    <p style="margin: 0; font-size: 10pt; font-style: italic;">Jl. Poros Bosowa Desa Anabanua, Kode Pos 90712</p>
  </div>

  <div style="text-align: center; margin-bottom: 20px;">
    <h4 style="margin: 0; text-decoration: underline; text-transform: uppercase; font-size: 13pt;">SURAT KETERANGAN USAHA</h4>
    <p style="margin: 0; font-size: 11pt;">Nomor: {{sys.meta.nomor_surat}}</p>
  </div>

  <p style="text-indent: 40px; margin-bottom: 15px;">
    Yang bertanda tangan di bawah ini Kepala Desa Anabanua, Kecamatan Barru, Kabupaten Barru, menerangkan bahwa:
  </p>

  <table style="width: 100%; margin-left: 20px; margin-bottom: 15px; border-collapse: collapse;">
    <tr><td style="width: 25%; padding: 4px 0;">Nama Lengkap</td><td style="width: 75%; padding: 4px 0;">: <strong>{{sys.pemohon.nama}}</strong></td></tr>
    <tr><td style="padding: 4px 0;">NIK</td><td style="padding: 4px 0;">: {{sys.pemohon.nik}}</td></tr>
    <tr><td style="padding: 4px 0;">Tempat / Tgl Lahir</td><td style="padding: 4px 0;">: {{sys.pemohon.ttl}}</td></tr>
    <tr><td style="padding: 4px 0;">Jenis Kelamin</td><td style="padding: 4px 0;">: {{sys.pemohon.jenis_kelamin}}</td></tr>
    <tr><td style="padding: 4px 0;">Pekerjaan</td><td style="padding: 4px 0;">: {{sys.pemohon.pekerjaan}}</td></tr>
    <tr><td style="padding: 4px 0;">Alamat</td><td style="padding: 4px 0;">: {{sys.pemohon.alamat_lengkap}}</td></tr>
  </table>

  <p style="text-indent: 40px; margin-bottom: 15px;">
    Bahwa nama tersebut di atas adalah benar warga Desa Anabanua yang memiliki dan menjalankan usaha <strong>{{form.namaUsaha}}</strong> yang bergerak di bidang <em>{{form.jenisUsaha}}</em> dan berlokasi di {{form.alamatUsaha}}.
  </p>

  <p style="text-indent: 40px; margin-bottom: 30px;">
    Demikian Surat Keterangan Usaha ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
  </p>

  <table style="width: 100%; text-align: center; margin-top: 30px;">
    <tr>
      <td style="width: 50%;"></td>
      <td style="width: 50%;">
        <p style="margin: 0;">Anabanua, {{sys.meta.tanggal_surat}}</p>
        <p style="margin: 0; font-weight: bold;">Kepala Desa Anabanua</p>
        <div style="margin: 15px 0;">
          {{sys.meta.qr_code_img}}
        </div>
        <p style="margin: 0; font-weight: bold; text-decoration: underline;">{{sys.ttd.nama}}</p>
      </td>
    </tr>
  </table>
</div>',
workflow_config = JSON_ARRAY(
  JSON_OBJECT('step_order', 1, 'role_required', 'staf_verifikator', 'action', 'VERIFIKASI_BERKAS'),
  JSON_OBJECT('step_order', 2, 'role_required', 'sekretaris_desa', 'action', 'PARAF_HIRARKI'),
  JSON_OBJECT('step_order', 3, 'role_required', 'kepala_desa', 'action', 'TANDA_TANGAN_DIGITAL')
),
kategori = 'Usaha'
WHERE kode = 'SKU';

-- consolidated from 000013_seed_100_jenis_surat.up.sql
-- 000013: Seed 100+ Jenis Surat Dinamis Terorganisir dalam 13 Kategori Desa Digital

INSERT IGNORE INTO jenis_surat 
(kode, kategori, nama, deskripsi, persyaratan, form_fields, template_html, workflow_config, nomor_surat_format, estimasi_hari, ikon, is_active) 
VALUES

-- ============================================================================
-- 1. KEPENDUDUKAN
-- ============================================================================
('SKD', 'Kependudukan', 'Surat Keterangan Domisili', 
 'Surat keterangan domisili atau tempat tinggal resmi warga di Desa Anabanua.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi Kartu Keluarga','Surat Pengantar RT/RW'),
 JSON_ARRAY(
   JSON_OBJECT('name','tujuanKeperluan','label','Tujuan Keperluan','type','textarea','required',TRUE),
   JSON_OBJECT('name','sejakTahun','label','Tinggal Sejak Tahun','type','number','required',TRUE)
 ),
 '<div style="font-family: Arial, sans-serif; padding: 20px; font-size: 12pt; line-height: 1.6;">
  <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 15px;">
    <h3 style="margin: 0; text-transform: uppercase;">PEMERINTAH KABUPATEN BARRU</h3>
    <h3 style="margin: 0; text-transform: uppercase;">KECAMATAN BARRU</h3>
    <h2 style="margin: 0; font-weight: bold; text-transform: uppercase;">PEMERINTAH DESA ANABANUA</h2>
  </div>
  <div style="text-align: center; margin-bottom: 20px;">
    <h4 style="margin: 0; text-decoration: underline; font-size: 13pt;">SURAT KETERANGAN DOMISILI</h4>
    <p style="margin: 0;">Nomor: {{sys.meta.nomor_surat}}</p>
  </div>
  <p style="text-indent: 40px;">Yang bertanda tangan di bawah ini Kepala Desa Anabanua menerangkan bahwa:</p>
  <table style="width: 100%; margin-left: 20px; margin-bottom: 15px;">
    <tr><td style="width: 30%;">Nama Lengkap</td><td>: <strong>{{sys.pemohon.nama}}</strong></td></tr>
    <tr><td>NIK</td><td>: {{sys.pemohon.nik}}</td></tr>
    <tr><td>Tempat/Tgl Lahir</td><td>: {{sys.pemohon.ttl}}</td></tr>
    <tr><td>Alamat</td><td>: {{sys.pemohon.alamat_lengkap}}</td></tr>
  </table>
  <p style="text-indent: 40px;">Bahwa yang bersangkutan benar-benar berdomisili dan bertempat tinggal di Desa Anabanua sejak tahun {{form.sejakTahun}} hingga saat ini.</p>
  <p style="text-indent: 40px;">Demikian surat keterangan ini dibuat untuk dipergunakan sebagai {{form.tujuanKeperluan}}.</p>
  <table style="width: 100%; text-align: center; margin-top: 30px;">
    <tr><td></td><td style="width: 50%;">Anabanua, {{sys.meta.tanggal_surat}}<br><strong>Kepala Desa Anabanua</strong><br><br>{{sys.meta.qr_code_img}}<br><br><u>{{sys.ttd.nama}}</u></td></tr>
  </table>
</div>',
 JSON_ARRAY(
   JSON_OBJECT('step_order', 1, 'role_required', 'staf_verifikator', 'action', 'VERIFIKASI_BERKAS'),
   JSON_OBJECT('step_order', 2, 'role_required', 'kepala_desa', 'action', 'TANDA_TANGAN_DIGITAL')
 ),
 '470/{index}/DB/{bulan_romawi}/{tahun}', 1, 'Home', TRUE),

('SKP_IN', 'Kependudukan', 'Surat Keterangan Penduduk',
 'Surat keterangan pendaftaran sebagai penduduk aktif di Desa Anabanua.',
 JSON_ARRAY('Fotokopi KTP','Fotokopi KK'),
 JSON_ARRAY(JSON_OBJECT('name','keperluan','label','Keperluan Surat','type','text','required',TRUE)),
 NULL, NULL, '470/{index}/DB/{bulan_romawi}/{tahun}', 1, 'UserCheck', TRUE),

('SKP_OUT', 'Kependudukan', 'Surat Keterangan Pindah',
 'Surat pengantar perpindahan penduduk keluar dari Desa Anabanua ke daerah tujuan.',
 JSON_ARRAY('KTP Asli','KK Asli','Pas foto 3x4 (4 lembar)'),
 JSON_ARRAY(
   JSON_OBJECT('name','alamatTujuan','label','Alamat Tujuan Pindah','type','textarea','required',TRUE),
   JSON_OBJECT('name','alasanPindah','label','Alasan Pindah','type','text','required',TRUE)
 ),
 NULL, NULL, '475/{index}/DB/{bulan_romawi}/{tahun}', 2, 'LogOut', TRUE),

('SK_DATANG', 'Kependudukan', 'Surat Keterangan Datang/Pendatang',
 'Surat keterangan penerimaan kedatangan warga pendatang baru di Desa Anabanua.',
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
 'Surat keterangan resmi kepemilikan dan legalitas operasional usaha mikro/kecil di Desa Anabanua.',
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
 'Surat keterangan aktif sebagai peternak hewan ternak di wilayah Desa Anabanua.',
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
 'Surat keterangan laporan kehilangan barang/dokumen di lingkungan Desa Anabanua.',
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
