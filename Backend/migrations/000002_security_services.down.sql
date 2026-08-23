-- from 000013_seed_100_jenis_surat.down.sql
-- 000013: Rollback seed 100+ jenis surat

DELETE FROM jenis_surat WHERE kode IN (
  'SKD', 'SKP_IN', 'SKP_OUT', 'SK_DATANG', 'SK_NO_KTP', 'SK_NO_KK', 'SK_BEDANAMA', 'SK_BEDATGL',
  'SK_LAHIR', 'SK_MATI', 'SK_WARIS',
  'SP_NIKAH', 'SK_BELUM_NIKAH', 'SK_JANDA_DUDA',
  'SKTM', 'SK_PENGHASILAN',
  'SK_MILIK_TANAH', 'SK_BEBAS_SENGKETA',
  'SKU', 'SK_PETANI', 'SK_PETERNAK',
  'SKTM_SEKOLAH',
  'SP_SKCK', 'SK_KEHILANGAN',
  'SK_TERNAK_JUAL',
  'SURAT_TUGAS'
);

-- from 000012_dynamic_persuratan.down.sql
-- 000012: Rollback Dynamic Persuratan

DROP TABLE IF EXISTS pengajuan_approval_step;

ALTER TABLE pengajuan_surat
  DROP COLUMN nomor_surat_resmi,
  DROP COLUMN subjek_nik,
  DROP COLUMN data_snapshot,
  DROP COLUMN current_step,
  DROP COLUMN file_pdf_url,
  DROP COLUMN qr_verification_code;

DROP TABLE IF EXISTS penduduk;

ALTER TABLE jenis_surat
  DROP COLUMN kategori,
  DROP COLUMN template_html,
  DROP COLUMN workflow_config,
  DROP COLUMN nomor_surat_format;

-- from 000011_apbdes_periode.down.sql
-- 000011 (down): hapus kolom periode bulanan/triwulanan
ALTER TABLE apbdes_item
  DROP COLUMN triwulan,
  DROP COLUMN bulan;

-- from 000010_expand_foto_column.down.sql
ALTER TABLE `perangkat_desa` MODIFY `foto` VARCHAR(255) NOT NULL;

-- from 000009_pending_registration.down.sql
DROP TABLE IF EXISTS pending_registrations;

-- from 000008_otp_email.down.sql
-- Rollback migration 000008.
DROP TABLE IF EXISTS email_log;
ALTER TABLE pengajuan_surat DROP COLUMN dokumen_email_terkirim_at;
ALTER TABLE pengajuan_surat DROP COLUMN dokumen_email_terkirim;
DROP TABLE IF EXISTS otp_codes;
ALTER TABLE users DROP COLUMN email_verified;

-- from 000007_seed_layanan_lengkap.down.sql
-- reverse 000007: hapus 8 jenis surat tambahan
DELETE FROM jenis_surat WHERE kode IN ('SPK','SPKK','SKL','SKM','SKBM','SKP','SKH','LAIN');

-- from 000006_security_cleanup.down.sql
-- Deliberately irreversible: re-enabling known demo identities would restore
-- credentials that are intentionally retired for security.
SELECT 1;
