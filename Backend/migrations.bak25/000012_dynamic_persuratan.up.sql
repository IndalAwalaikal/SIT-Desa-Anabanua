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
    <h3 style="margin: 0; font-size: 14pt; text-transform: uppercase;">PEMERINTAH KABUPATEN BONE</h3>
    <h3 style="margin: 0; font-size: 14pt; text-transform: uppercase;">KECAMATAN LAPPARIAJA</h3>
    <h2 style="margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase;">PEMERINTAH DESA BORONG</h2>
    <p style="margin: 0; font-size: 10pt; font-style: italic;">Jl. Poros Bosowa Desa Borong, Kode Pos 92763</p>
  </div>

  <div style="text-align: center; margin-bottom: 20px;">
    <h4 style="margin: 0; text-decoration: underline; text-transform: uppercase; font-size: 13pt;">SURAT KETERANGAN USAHA</h4>
    <p style="margin: 0; font-size: 11pt;">Nomor: {{sys.meta.nomor_surat}}</p>
  </div>

  <p style="text-indent: 40px; margin-bottom: 15px;">
    Yang bertanda tangan di bawah ini Kepala Desa Borong, Kecamatan Lappariaja, Kabupaten Bone, menerangkan bahwa:
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
    Bahwa nama tersebut di atas adalah benar warga Desa Borong yang memiliki dan menjalankan usaha <strong>{{form.namaUsaha}}</strong> yang bergerak di bidang <em>{{form.jenisUsaha}}</em> dan berlokasi di {{form.alamatUsaha}}.
  </p>

  <p style="text-indent: 40px; margin-bottom: 30px;">
    Demikian Surat Keterangan Usaha ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
  </p>

  <table style="width: 100%; text-align: center; margin-top: 30px;">
    <tr>
      <td style="width: 50%;"></td>
      <td style="width: 50%;">
        <p style="margin: 0;">Borong, {{sys.meta.tanggal_surat}}</p>
        <p style="margin: 0; font-weight: bold;">Kepala Desa Borong</p>
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
